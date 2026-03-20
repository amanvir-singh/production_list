const mongoose = require("mongoose");
const bus = require("../events/bus");
const { FetchDatafromTLF, FetchDatafromTLFWithQuery } = require("../TLF_Connection");

const { Decimal128 } = mongoose.Types;
const { schemas } = require("../createModels");

const TLFInventory = mongoose.model(
  "TLFInventory",
  schemas.TLFInventorySchema,
  "TLFInventory",
);
const WarehouseInventory = mongoose.model(
  "warehouseInventory",
  schemas.warehouseInventorySchema,
  "warehouseInventory",
);
const TLFOutfeedCursor = mongoose.model(
  "TLFOutfeedCursor",
  schemas.TLFOutfeedCursorSchema,
  "TLFOutfeedCursor",
);
const TLFOutfeedLog = mongoose.model(
  "TLFOutfeedLog",
  schemas.TLFOutfeedLogSchema,
  "TLFOutfeedLog",
);
const TLFOrphanPanel = mongoose.model(
  "TLFOrphanPanel",
  schemas.TLFOrphanPanelSchema,
  "TLFOrphanPanel",
);
const MaterialOrder = mongoose.model(
  "materialOrders",
  schemas.materialOrderSchema,
  "materialOrders",
);

const TLFPendingOutfeed = mongoose.model(
  "TLFPendingOutfeed",
  schemas.TLFPendingOutfeedSchema,
  "TLFPendingOutfeed",
);

const TLFSyncAudit = mongoose.model(
  "TLFSyncAudit",
  schemas.TLFSyncAuditSchema,
  "TLFSyncAudit",
);

const TLFInfeedLog = mongoose.model(
  "TLFInfeedLog",
  schemas.TLFInfeedLogSchema,
  "TLFInfeedLog",
);

const TLFInfeedCursor = mongoose.model(
  "TLFInfeedCursor",
  schemas.TLFInfeedCursorSchema,
  "TLFInfeedCursor",
);

// Helper to recalc totals
async function recalculateWarehouseTotals() {
  const allWhDocs = await WarehouseInventory.find({}).lean();
  const allOrders = await MaterialOrder.find({ status: "On Order" }).lean();

  if (!allWhDocs.length) return;

  const whDocMap = new Map();
  const aggKeyToPrimaryBC = new Map();
  const bcToAggKey = new Map();

  for (const doc of allWhDocs) {
    whDocMap.set(doc.boardCode, { ...doc, onOrderQty: 0 });

    if (doc.boardCode && doc.aggregationKey) {
      bcToAggKey.set(doc.boardCode, doc.aggregationKey);
      if (!aggKeyToPrimaryBC.has(doc.aggregationKey)) {
        aggKeyToPrimaryBC.set(doc.aggregationKey, doc.boardCode);
      }
    }
  }

  for (const order of allOrders) {
    if (!order.boardCode) continue;

    let targetBC = null;

    if (whDocMap.has(order.boardCode)) {
      targetBC = order.boardCode;
    }
    else if (aggKeyToPrimaryBC.has(order.boardCode)) {
      targetBC = aggKeyToPrimaryBC.get(order.boardCode);
    }

    if (!targetBC) continue;

    const whItem = whDocMap.get(targetBC);
    if (whItem) {
      whItem.onOrderQty += (Number(order.orderedQty) || 0);
    }
  }


  const ops = [];
  const now = new Date();

  for (const doc of whDocMap.values()) {
    const warehouseQty = Number(doc.warehouseQty) || 0;
    const tlfQty = Number(doc.tlfQty) || 0;
    const reservedQty = Number(doc.reservedQty) || 0;
    const onOrderQty = doc.onOrderQty; 

    const onHandQty = warehouseQty + tlfQty;
    const availableQty = onHandQty - reservedQty;
    const projectedQty = availableQty + onOrderQty;

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            onOrderQty,
            onHandQty,
            availableQty,
            projectedQty,
            updatedAt: now,
          },
        },
      },
    });
  }

  if (ops.length > 0) {
    await WarehouseInventory.bulkWrite(ops, { ordered: false });
  }
}

function aggKeyForBoardCode(boardCode, aggKeyMap) {
  const k = aggKeyMap.get(boardCode);
  return k && String(k).trim() ? String(k).trim() : boardCode;
}

async function buildAggregationKeyMapFromWarehouse() {
  // Build mapping: raw boardCode -> aggregationKey
  const docs = await WarehouseInventory.find(
    { aggregationKey: { $exists: true, $ne: "" } },
    { boardCode: 1, aggregationKey: 1 },
  ).lean();

  const map = new Map();
  for (const d of docs) {
    if (d?.boardCode && d?.aggregationKey)
      map.set(d.boardCode, d.aggregationKey);
  }
  return map;
}

function buildAggSnapshotFromRaw(rawSnapshotDoc, aggKeyMap) {
  // returns: { fetchedAt, qtyByKey: { [aggregationKeyOrBoardCode]: totalQty } }
  const qtyByKey = new Map();
  const boards = rawSnapshotDoc?.boards || [];

  for (const b of boards) {
    const bc = b?.BoardCode;
    if (!bc) continue;

    const key = aggKeyForBoardCode(bc, aggKeyMap);
    const qty = Number(b?.TotalQty) || 0;
    qtyByKey.set(key, (qtyByKey.get(key) || 0) + qty);
  }

  return {
    fetchedAt: rawSnapshotDoc?.FetchedAt,
    qtyByKey: Object.fromEntries(qtyByKey.entries()),
  };
}

function destFromPlatzNr(platzNr) {
  const p = Number(platzNr);
  if (p === 101) return "SAW";
  if (p === 102) return "CNC";
  if (p === 1) return "OUTFEED 1";
  if (p === 2) return "OUTFEED 2";
  return null;
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Builds qty map: Identnummer -> count of entries, excluding Platznummer 1 and 2
function buildQtyByBoardCodeFromLagen(qtysqldata) {
  const qtyByBoardCode = new Map();
  for (let i = 0; i < qtysqldata.length; i++) {
    const row = qtysqldata[i];
    const platz = Number(row.Platznummer);
    if ([1, 2, 101, 102].includes(platz)) continue;

    const boardCode = row.Identnummer;
    qtyByBoardCode.set(boardCode, (qtyByBoardCode.get(boardCode) || 0) + 1);
  }
  return qtyByBoardCode;
}

function buildBoardsData(boardsqldata, qtyByBoardCode) {
  return boardsqldata.map((record) => {
    const boardCode = record.Identnummer;
    const totalQty = qtyByBoardCode.get(boardCode) || 0;

    return {
      ID: record.IdNr,
      BoardCode: boardCode,
      Length: Decimal128.fromString((record.Laenge / 1000).toString()),
      Width: Decimal128.fromString((record.Breite / 1000).toString()),
      Thickness: Decimal128.fromString((record.Dicke / 1000).toString()),
      TotalQty: totalQty,
    };
  });
}

function buildQtyMapFromSnapshot(snapshotDoc) {
  const map = new Map();
  const boards = snapshotDoc?.boards || [];
  for (const b of boards) {
    const bc = b?.BoardCode;
    if (!bc) continue;
    map.set(bc, toNum(b?.TotalQty, 0));
  }
  return map;
}

async function getOrCreateCursor() {
  let cursor = await TLFOutfeedCursor.findById("auslagerCursor").lean();
  if (!cursor) {
    await TLFOutfeedCursor.create({
      _id: "auslagerCursor",
      lastProcessedId: 0,
      lastProcessedAt: null,
    });
    cursor = await TLFOutfeedCursor.findById("auslagerCursor").lean();
  }
  return cursor;
}

async function getOrCreateInfeedCursor() {
  let cursor = await TLFInfeedCursor.findById("bewegungCursor").lean();
  if (!cursor) {
    await TLFInfeedCursor.create({
      _id: "bewegungCursor",
      lastProcessedId: 0,
      lastProcessedAt: null,
    });
    cursor = await TLFInfeedCursor.findById("bewegungCursor").lean();
  }
  return cursor;
}

// dbo.Bewegungen fetch + normalize
// Columns: Id, Identnummer, Quellplatz, Zielplatz, Bewegungsdatum, Einlagervorgang, Auslagervorgang
// Infeeds (warehouse → TLF storage) are identified by Einlagervorgang = 1
async function fetchInfeedEventsAfterId(lastProcessedId) {
  // Einlagervorgang = 1 AND Auslagervorgang = 0: panel was stored in TLF (true infeed).
  // If both = 1, TLF was a pass-through (warehouse → saw/CNC directly) — not an infeed.
  const query = `SELECT * FROM dbo.Bewegungen WHERE Id > ${Number(lastProcessedId) || 0} AND Einlagervorgang = 1 AND Auslagervorgang = 0`;
  const rows = await FetchDatafromTLFWithQuery(query);
  const normalized = [];

  for (const r of rows || []) {
    const bewegungRowId = toNum(r.Id);
    if (!bewegungRowId) continue;

    const boardCode = r.Identnummer;
    if (!boardCode) continue;

    const eventTimeRaw = r.Bewegungsdatum;
    const eventTime = eventTimeRaw ? new Date(eventTimeRaw) : null;

    normalized.push({
      bewegungRowId,
      boardCode: String(boardCode),
      fromPosition: toNum(r.Quellplatz),
      toPosition: toNum(r.Zielplatz),
      quantity: 1,
      eventTime,
    });
  }

  normalized.sort((a, b) => a.bewegungRowId - b.bewegungRowId);
  return normalized;
}

// AuslagerReport fetch + normalize
async function fetchOutfeedEventsAfterId(lastProcessedId) {
  const query = `SELECT * FROM dbo.AuslagerReport WHERE ID > ${Number(lastProcessedId) || 0}`;
  //const query = `SELECT * FROM dbo.AuslagerReport WHERE ID > 35655 AND ID <= 35665`;

  const rows = await FetchDatafromTLFWithQuery(query);
  // Filter + normalize
  const normalized = [];
  for (const r of rows || []) {
    const auslagerRowId = toNum(r.ID);
    const auslagerId = r.AuslagerID;
    const platzNr = toNum(r.PlatzNr);

    const dest = destFromPlatzNr(platzNr);
    if (!dest) continue;

    const insertApp = r.InsertApplication;
    if (!auslagerId) continue;
    if (insertApp && insertApp !== "TLF Powercontrol -- Auftragsmanager")
      continue;

    const boardCode = r.Identnummer;
    if (!boardCode) continue;

    const jobName = r.Lauf;
    const plan = r.Plan;

    const eventTimeRaw = r.UpdateDatum;
    const eventTime = eventTimeRaw ? new Date(eventTimeRaw) : null;

    normalized.push({
      auslagerId: toNum(auslagerId, null),
      auslagerRowId,
      boardCode: String(boardCode),
      platzNr,
      dest,
      jobName: jobName ? String(jobName) : null,
      plan: plan ? String(plan) : null,
      quantity: 1,
      eventTime,
    });
  }

  //sorting by auslagerId(ascending)
  normalized.sort(
    (a, b) => toNum(a.auslagerRowId, 0) - toNum(b.auslagerRowId, 0),
  );
  return normalized;
}


// Warehouse updates

// Deprecated function
async function updateWarehouseTlfQuantitiesFromSnapshot(rawSnapshot) {
  const qtyByBoardCode = new Map();
  const boards = rawSnapshot?.boards || [];
  for (const board of boards) {
    const bc = board?.BoardCode;
    const qty = Number(board?.TotalQty) || 0;
    if (!bc) continue;
    qtyByBoardCode.set(bc, qty);
  }

  const updates = [];
  const now = new Date();
  for (const [boardCode, qty] of qtyByBoardCode.entries()) {
    updates.push({
      updateOne: {
        filter: { boardCode },
        update: {
          $set: { tlfQty: qty, updatedAt: now },
        },
        upsert: false,
      },
    });
  }

  if (updates.length > 0) {
    await WarehouseInventory.bulkWrite(updates, { ordered: false });
  }
}


async function applyWarehouseDeltas({
  warehouseDeltasByBoardCode,
  newTlfQtyByBoardCode,
}) {
  const ops = [];
  const now = new Date();

  for (const [
    boardCode,
    warehouseDelta,
  ] of warehouseDeltasByBoardCode.entries()) {

    ops.push({
      updateOne: {
        filter: { boardCode },
        update: {
          $inc: { warehouseQty: warehouseDelta },
          $set: {
            tlfQty: newTlfQtyByBoardCode.get(boardCode) || 0,
            updatedAt: now,
          },
        },
        upsert: false,
      },
    });
  }

  if (ops.length > 0) {
    await WarehouseInventory.bulkWrite(ops, { ordered: false });
  }
}


// Orphans + logs
async function upsertOrphanEvent({ boardCode, ev, now }) {
  const upsertResult = await TLFOrphanPanel.updateOne(
    { boardCode },
    {
      $setOnInsert: {
        boardCode,
        firstSeenAt: now,
      },
      $set: { lastSeenAt: now },
      $push: {
        events: {
          auslagerRowId: ev.auslagerRowId,
          auslagerId: ev.auslagerId,
          jobName: ev.jobName,
          plan: ev.plan,
          dest: ev.dest,
          eventTime: ev.eventTime,
        },
      },
      $inc: { totalQty: 1 },
    },
    { upsert: true },
  );
}

async function insertOutfeedLogs(logDocs) {
  if (!logDocs.length) return;
  await TLFOutfeedLog.insertMany(logDocs, { ordered: false });
}

async function overwriteSnapshotWithNew(boardsData, fetchedAt) {
  await TLFInventory.deleteMany({});
  const tlfInventory = new TLFInventory({
    FetchedAt: fetchedAt,
    boards: boardsData,
  });
  await tlfInventory.save();
  return tlfInventory;
}

async function syncWarehouseTlfQtyFromSnapshot(snapshotDoc) {
  const now = new Date();

  const snapshotBoardCodes = (snapshotDoc.boards || []).map(
    (b) => b.BoardCode
  );

  if (!snapshotBoardCodes.length) return;

  const whDocs = await WarehouseInventory.find(
    { boardCode: { $in: snapshotBoardCodes } },
    { boardCode: 1 }
  ).lean();

  if (!whDocs.length) return;

  const whBoardCodeSet = new Set(whDocs.map((d) => d.boardCode));

  const ops = [];
  for (const b of snapshotDoc.boards) {
    if (!whBoardCodeSet.has(b.BoardCode)) continue;

    ops.push({
      updateOne: {
        filter: { boardCode: b.BoardCode },
        update: {
          $set: {
            tlfQty: Number(b.TotalQty) || 0,
            updatedAt: now,
          },
        },
        upsert: false,
      },
    });
  }

  if (ops.length > 0) {
    await WarehouseInventory.bulkWrite(ops, { ordered: false });
  }
}



// Main sync

async function syncOnce() {
  const now = new Date();

  try {
    // 0) Reading previous snapshot
    const prevSnapshot = await TLFInventory.findOne({})
      .sort({ FetchedAt: -1 })
      .lean();

    // 1) Fetch everything
    const [cursor, infeedCursor] = await Promise.all([
      getOrCreateCursor(),
      getOrCreateInfeedCursor(),
    ]);

    const syncId = `sync_${now.toISOString()}`;

    const audit = {
      syncId,
      startedAt: now,
      cursor: {
        previous: cursor?.lastProcessedId || 0,
        next: null,
      },
      summary: {
        boardsTouched: 0,
        totalWarehouseDelta: 0,
        totalEvents: 0,
        totalOrphans: 0,
      },
      boards: [],
    };

    const [boardsqldata, qtysqldata, outfeedEvents, infeedEvents] = await Promise.all([
      FetchDatafromTLF("dbo.Ident"),
      FetchDatafromTLF("dbo.lagen"),
      fetchOutfeedEventsAfterId(cursor?.lastProcessedId || 0),
      fetchInfeedEventsAfterId(infeedCursor?.lastProcessedId || 0),
    ]);

    // 2) Prepare new snapshot
    const qtyByBoardCode = buildQtyByBoardCodeFromLagen(qtysqldata);
    const boardsData = buildBoardsData(boardsqldata, qtyByBoardCode);
    const newSnapshotDoc = {
      FetchedAt: now,
      boards: boardsData,
    };

    // 3) Compute deltas (prev vs new)
    const prevQtyMap = buildQtyMapFromSnapshot(prevSnapshot);
    const newQtyMap = buildQtyMapFromSnapshot(newSnapshotDoc);

    const unionBoardCodes = new Set([
      ...Array.from(prevQtyMap.keys()),
      ...Array.from(newQtyMap.keys()),
    ]);

    // 4) Group outfeed events by boardCode (with deduplication)
    const allAuslagerRowIds = outfeedEvents.map((e) => e.auslagerRowId);
    let existingIdsSet = new Set();
    
    if (allAuslagerRowIds.length > 0) {
        const existingLogs = await TLFOutfeedLog.find(
            { auslagerRowId: { $in: allAuslagerRowIds } },
            { auslagerRowId: 1 }
        ).lean();
        existingIdsSet = new Set(existingLogs.map((l) => l.auslagerRowId));
    }

    const eventsByBoardCode = new Map();
    let maxAuslagerRowId = cursor?.lastProcessedId || 0;

    for (const ev of outfeedEvents) {
      // Deduplication check
      if (existingIdsSet.has(ev.auslagerRowId)) {
        console.log("Duplicated event:", ev);
          continue;
      }

      const bc = ev.boardCode;
      if (!eventsByBoardCode.has(bc)) eventsByBoardCode.set(bc, []);
      eventsByBoardCode.get(bc).push(ev);

      if (ev.auslagerRowId && ev.auslagerRowId > maxAuslagerRowId) {
        maxAuslagerRowId = ev.auslagerRowId;
      }
    }

    // 5) Preload which boardCodes exist in warehouse
    const allBoardCodes = new Set([
      ...prevQtyMap.keys(),
      ...newQtyMap.keys(),
      ...eventsByBoardCode.keys(),
    ]);
    const whDocs = await WarehouseInventory.find(
      { boardCode: { $in: Array.from(allBoardCodes) } },
      { boardCode: 1, warehouseQty: 1 }
    ).lean();
    
    const warehouseDataMap = new Map();
    for (const d of whDocs || []) {
        warehouseDataMap.set(d.boardCode, {
            exists: true,
            warehouseQty: toNum(d.warehouseQty, 0)
        });
    }

    const pendingDocs = await TLFPendingOutfeed.find({}).lean();
    const pendingMap = new Map();

    for (const d of pendingDocs) {
      pendingMap.set(d.boardCode, toNum(d.qty, 0));
    }




    // 6) Reconcile snapshot deltas + attribute outfeed events
    const warehouseDeltasByBoardCode = new Map();
    const outfeedLogs = [];

    for (const boardCode of allBoardCodes) {
      const oldTlfQty = prevQtyMap.get(boardCode) || 0;
      const newTlfQty = newQtyMap.get(boardCode) || 0;
      const deltaT = newTlfQty - oldTlfQty;
      const pendingBefore = pendingMap.get(boardCode) || 0;

      const evs = eventsByBoardCode.get(boardCode) || [];
      const S = evs.length;

      const snapshotLoss = Math.max(0, oldTlfQty - newTlfQty);
      const tlfFromPending = Math.min(pendingBefore, S);
      const eventsRemaining = S - tlfFromPending;

      const tlfFromSnapshot = Math.min(
        snapshotLoss,
        eventsRemaining
      );

      const warehouseUsedForOutfeed =
        Math.max(0, eventsRemaining - tlfFromSnapshot);

      const unexplainedTlfDrop = snapshotLoss - tlfFromSnapshot;
      const pendingCreated = unexplainedTlfDrop;
      const pendingAfter = pendingBefore - tlfFromPending + pendingCreated;

      /**
       * INVENTORY MATH
       * deltaT = W2T - T2O        (W2T = warehouse→TLF replenishment, T2O = TLF→outfeed)
       * S      = T2O + W2O        (W2O = warehouse→outfeed direct)
       * => warehouseDelta = -(W2T + W2O)
       *
       * W2T = max(0, deltaT)   — only when TLF net increased (warehouse replenished TLF).
       *                           When deltaT < 0, panels are leaving TLF — W2T = 0.
       *                           Unexplained drops (no events) = panel in transit; tracked
       *                           as pendingCreated debt. Must NOT raise warehouse qty.
       * W2O = warehouseUsedForOutfeed
       */
      const rawWarehouseDelta = -Math.max(0, deltaT) - warehouseUsedForOutfeed;


      const whData = warehouseDataMap.get(boardCode);
      const existsInWarehouse = !!whData?.exists;
      const currentWhQty = whData?.warehouseQty || 0;

      let appliedWarehouseDelta = 0;
      let deficit = 0;

      if (existsInWarehouse) {
        if (currentWhQty + rawWarehouseDelta >= 0) {
          appliedWarehouseDelta = rawWarehouseDelta;
        } else {
          appliedWarehouseDelta = -currentWhQty;
          deficit = -(currentWhQty + rawWarehouseDelta);
        }

        warehouseDeltasByBoardCode.set(
          boardCode,
          (warehouseDeltasByBoardCode.get(boardCode) || 0) + appliedWarehouseDelta
        );
      } else {
        deficit = -rawWarehouseDelta;
      }

      const boardAudit = {
        boardCode,

        snapshot: {
          oldTlfQty,
          newTlfQty,
          deltaT,
        },

        warehouse: {
          existed: existsInWarehouse,
          warehouseOld: currentWhQty,
          warehouseDeltaRaw: rawWarehouseDelta,
          warehouseDeltaApplied: appliedWarehouseDelta,
          warehouseNew: existsInWarehouse
            ? currentWhQty + appliedWarehouseDelta
            : null,
          deficit,
        },

        events: {
          total: evs.length,
          fromTLF: 0,
          fromWarehouse: 0,
          unknown: 0,
          details: [],
        },

        orphans: {
          count: 0,
          details: [],
        },
      };


      /**
       * EVENT ATTRIBUTION
       */

      boardAudit.snapshot.oldTlfDebt = pendingBefore;
      boardAudit.snapshot.newTlfDebt = pendingAfter;
      pendingMap.set(boardCode, pendingAfter);

      // Only as many events can be attributed to WAREHOUSE as the warehouse actually has
      const effectiveWarehouseForAttribution = existsInWarehouse
        ? Math.min(warehouseUsedForOutfeed, Math.max(0, currentWhQty))
        : 0;

      let remainingTLF = tlfFromPending + tlfFromSnapshot;
      let remainingWarehouse = effectiveWarehouseForAttribution;

      for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        let source = "UNKNOWN";

        if (remainingTLF > 0) {
          source = "TLF_STORAGE";
          remainingTLF--;
        } else if (remainingWarehouse > 0) {
          source = "WAREHOUSE";
          remainingWarehouse--;
        }

        if (source === "TLF_STORAGE") boardAudit.events.fromTLF++;
        else if (source === "WAREHOUSE") boardAudit.events.fromWarehouse++;
        else boardAudit.events.unknown++;

        boardAudit.events.details.push({
          auslagerRowId: ev.auslagerRowId,
          auslagerId: ev.auslagerId,
          dest: ev.dest,
          source,
          eventTime: ev.eventTime,
          jobName: ev.jobName,
          plan: ev.plan,
        });


        if (source === "UNKNOWN") {
          await upsertOrphanEvent({ boardCode, ev, now });
          boardAudit.orphans.count++;
          boardAudit.orphans.details.push({
            auslagerRowId: ev.auslagerRowId,
            auslagerId: ev.auslagerId,
            dest: ev.dest,
            source: source,
            eventTime: ev.eventTime,
            jobName: ev.jobName,
            plan: ev.plan,
          });
          audit.summary.totalOrphans++;
        }

        outfeedLogs.push({
          auslagerId: ev.auslagerId,
          auslagerRowId: ev.auslagerRowId,
          boardCode,
          platzNr: ev.platzNr,
          dest: ev.dest,
          jobName: ev.jobName,
          plan: ev.plan,
          quantity: 1,
          source,
          processedAt: now,
          eventTime: ev.eventTime,
        });
      }

      if (
        deltaT !== 0 ||
        rawWarehouseDelta !== 0 ||
        evs.length > 0
      ) {
        audit.boards.push(boardAudit);
      }
      audit.summary.boardsTouched++;
      audit.summary.totalWarehouseDelta += appliedWarehouseDelta;
      audit.summary.totalEvents += evs.length;
    }


    // 7) WRITING UPDATED DATA
    // 7a) overwrite snapshot
    const savedSnapshot = await overwriteSnapshotWithNew(boardsData, now);

    // 7b) sync warehouse tlfQty from snapshot
    await syncWarehouseTlfQtyFromSnapshot(savedSnapshot);

    // 7c) update warehouse
    await applyWarehouseDeltas({
      warehouseDeltasByBoardCode,
      newTlfQtyByBoardCode: newQtyMap,
    });

    // 7c) older function which was updating tlfQty from snapshot
    //await updateWarehouseTlfQuantitiesFromSnapshot(savedSnapshot);

    // 7d) write outfeed logs
    await insertOutfeedLogs(outfeedLogs);

    // 7e) update pending outfeed
    const pendingOps = [];
    const nowTs = new Date();

    for (const [boardCode, qty] of pendingMap.entries()) {
      if (qty > 0) {
        pendingOps.push({
          updateOne: {
            filter: { boardCode },
            update: {
              $set: { qty, updatedAt: nowTs }
            },
            upsert: true,
          },
        });
      } else {
        pendingOps.push({
          deleteOne: {
            filter: { boardCode }
          }
        });
      }
    }

    if (pendingOps.length > 0) {
      await TLFPendingOutfeed.bulkWrite(pendingOps, { ordered: false });
    }


    // 7f) Recalculate Warehouse Totals
    await recalculateWarehouseTotals();

    // 7g) advance cursor
    if (
      outfeedEvents.length > 0 &&
      maxAuslagerRowId > (cursor?.lastProcessedId || 0)
    ) {
      await TLFOutfeedCursor.updateOne(
        { _id: "auslagerCursor" },
        { $set: { lastProcessedId: maxAuslagerRowId, lastProcessedAt: now } },
        { upsert: true },
      );
    } else {
      await TLFOutfeedCursor.updateOne(
        { _id: "auslagerCursor" },
        { $set: { lastProcessedAt: now } },
        { upsert: true },
      );
    }

    // 7h) process infeed events (dbo.Bewegungen)
    let maxBewegungId = infeedCursor?.lastProcessedId || 0;

    if (infeedEvents.length > 0) {
      const allBewegungIds = infeedEvents.map((e) => e.bewegungRowId);
      const existingInfeedLogs = await TLFInfeedLog.find(
        { bewegungRowId: { $in: allBewegungIds } },
        { bewegungRowId: 1 }
      ).lean();
      const existingInfeedIds = new Set(existingInfeedLogs.map((l) => l.bewegungRowId));

      const newInfeedDocs = [];
      for (const ev of infeedEvents) {
        if (existingInfeedIds.has(ev.bewegungRowId)) continue;
        newInfeedDocs.push({
          bewegungRowId: ev.bewegungRowId,
          boardCode: ev.boardCode,
          fromPosition: ev.fromPosition,
          toPosition: ev.toPosition,
          quantity: ev.quantity,
          eventTime: ev.eventTime,
          processedAt: now,
        });
        if (ev.bewegungRowId > maxBewegungId) maxBewegungId = ev.bewegungRowId;
      }

      if (newInfeedDocs.length > 0) {
        await TLFInfeedLog.insertMany(newInfeedDocs, { ordered: false });
      }
    }

    if (maxBewegungId > (infeedCursor?.lastProcessedId || 0)) {
      await TLFInfeedCursor.updateOne(
        { _id: "bewegungCursor" },
        { $set: { lastProcessedId: maxBewegungId, lastProcessedAt: now } },
        { upsert: true }
      );
    } else {
      await TLFInfeedCursor.updateOne(
        { _id: "bewegungCursor" },
        { $set: { lastProcessedAt: now } },
        { upsert: true }
      );
    }

    // 7i) save audit
    audit.cursor.next = maxAuslagerRowId;
    audit.finishedAt = new Date();

    await TLFSyncAudit.create(audit);

    // 8) Broadcast
    const latest = await TLFInventory.findOne({})
      .sort({ FetchedAt: -1 })
      .lean();
    const aggKeyMap = await buildAggregationKeyMapFromWarehouse();
    const aggSnapshot = buildAggSnapshotFromRaw(latest, aggKeyMap);

    bus.emit("tlf_snapshot_raw", latest);
    bus.emit("tlf_snapshot_agg", aggSnapshot);
    bus.emit("tlf_outfeed_processed", {
      fetchedAt: latest?.FetchedAt,
      outfeedEvents: outfeedEvents.length,
      cursor: { lastProcessedId: maxAuslagerRowId },
    });

    console.log("Inventory updated");

    return {
      ok: true,
      fetchedAt: latest?.FetchedAt,
      boardsCount: latest?.boards?.length || 0,
      outfeedEvents: outfeedEvents.length,
    };
  } catch (err) {
    bus.emit("tlf_sync_error", {
      ts: new Date().toISOString(),
      message: err?.message || "TLF sync error",
    });

    console.error("TLF sync failed:", err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

module.exports = {
  syncOnce,
};
