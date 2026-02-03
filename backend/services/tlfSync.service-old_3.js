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
    const cursor = await getOrCreateCursor();

    const [boardsqldata, qtysqldata, outfeedEvents] = await Promise.all([
      FetchDatafromTLF("dbo.Ident"),
      FetchDatafromTLF("dbo.lagen"),
      fetchOutfeedEventsAfterId(cursor?.lastProcessedId || 0),
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
    const boardCodesInEvents = Array.from(eventsByBoardCode.keys());
    const whDocs = await WarehouseInventory.find(
      { boardCode: { $in: boardCodesInEvents } },
      { boardCode: 1, warehouseQty: 1 },
    ).lean();
    
    const warehouseDataMap = new Map();
    for (const d of whDocs || []) {
        warehouseDataMap.set(d.boardCode, {
            exists: true,
            warehouseQty: toNum(d.warehouseQty, 0)
        });
    }


    // 6) Infer movement + build logs/orphans + compute warehouse deltas
    const warehouseDeltasByBoardCode = new Map();
    const outfeedLogs = [];

    for (const boardCode of boardCodesInEvents) {
      const evs = eventsByBoardCode.get(boardCode) || [];
      const S = evs.length;
      if (S <= 0) continue;

      const oldTlfQty = prevQtyMap.get(boardCode) || 0;
      const newTlfQty = newQtyMap.get(boardCode) || 0;
      const deltaT = newTlfQty - oldTlfQty;

      // Initial calculation of movements
      const fromTLFToOutfeed = Math.min(S, Math.max(0, -deltaT));
      const fromWarehouseDirectToOutfeed = S - fromTLFToOutfeed;
      const warehouseToTLFStorage = Math.max(0, deltaT);
      
      const totalWarehouseDemand = fromWarehouseDirectToOutfeed + warehouseToTLFStorage;
      let warehouseDelta = -totalWarehouseDemand;

      const whData = warehouseDataMap.get(boardCode);
      const existsInWarehouse = !!whData?.exists;
      const currentWhQty = whData?.warehouseQty || 0;

      // Deficit Calculation
      let deficit = 0;
      if (existsInWarehouse) {
          if (currentWhQty < totalWarehouseDemand) {
              deficit = totalWarehouseDemand - currentWhQty;
              warehouseDelta = -currentWhQty;
          }
          
          warehouseDeltasByBoardCode.set(
            boardCode,
            (warehouseDeltasByBoardCode.get(boardCode) || 0) + warehouseDelta,
          );
      } else {
          deficit = totalWarehouseDemand;
      }

      const countTLF = fromTLFToOutfeed;
      let countWarehouse = Math.max(0, fromWarehouseDirectToOutfeed - deficit);
      let countUnknown = S - countTLF - countWarehouse;

      const existsInNewSnapshot = newQtyMap.has(boardCode);
      const isOrphan = !existsInNewSnapshot && !existsInWarehouse;

      // Assign sources to event
      for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        let source = "UNKNOWN";
        if (i < countTLF) source = "TLF_STORAGE";
        else if (i < countTLF + countWarehouse) source = "WAREHOUSE";
        else source = "UNKNOWN";

        if (isOrphan || source === "UNKNOWN") {
          await upsertOrphanEvent({ boardCode, ev, now });
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

    // 7f) Recalculate Warehouse Totals
    await recalculateWarehouseTotals();

    // 7e) advance cursor
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

    console.log("New data emitted updated");

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
