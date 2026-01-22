const mongoose = require("mongoose");
const bus = require("../events/bus");
const {FetchDatafromTLF} = require("../TLF_Connection");

const { Decimal128 } = mongoose.Types;
const { schemas } = require("../createModels");

const TLFInventory = mongoose.model(
  "TLFInventory",
  schemas.TLFInventorySchema,
  "TLFInventory"
);
const WarehouseInventory = mongoose.model(
  "warehouseInventory",
  schemas.warehouseInventorySchema,
  "warehouseInventory"
);

async function saveDataToMongoDB(boardsqldata, qtysqldata) {
  const fetchedAt = new Date();

  await TLFInventory.deleteMany({});

  // Build qty map: Identnummer -> count of entries, excluding Platznummer 1 and 2
  const qtyByBoardCode = new Map();
  for (let i = 0; i < qtysqldata.length; i++) {
    const row = qtysqldata[i];
    const platz = Number(row.Platznummer);

    if (platz === 1 || platz === 2) continue;

    const boardCode = row.Identnummer;
    qtyByBoardCode.set(boardCode, (qtyByBoardCode.get(boardCode) || 0) + 1);
  }

  // Map Ident table rows to boards
  const boardsData = boardsqldata.map((record) => {
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

  const tlfInventory = new TLFInventory({
    FetchedAt: fetchedAt,
    boards: boardsData,
  });

  await tlfInventory.save();
  return tlfInventory;
}

async function updateWarehouseTlfQuantities(rawSnapshot) {
  const qtyByBoardCode = new Map();

  // Build qty map from raw TLF snapshot
  const boards = rawSnapshot?.boards || [];
  for (const board of boards) {
    const bc = board?.BoardCode;
    const qty = Number(board?.TotalQty) || 0;
    qtyByBoardCode.set(bc, qty);
  }

  // Build bulkWrite for existing warehouse records only
  const updates = [];
  const now = new Date();
  for (const [boardCode, qty] of qtyByBoardCode.entries()) {
    updates.push({
      updateOne: {
        filter: { boardCode },
        update: {
          $set: {
            tlfQty: qty,
            updatedAt: now,
          },
        },
      },
    });
  }

  if (updates.length > 0) {
    const result = await WarehouseInventory.bulkWrite(updates, {
      ordered: false,
    });
    console.log(
      `Updated ${result.modifiedCount} warehouse records with TLF qty`
    );
  }
}

function aggKeyForBoardCode(boardCode, aggKeyMap) {
  const k = aggKeyMap.get(boardCode);
  return k && String(k).trim() ? String(k).trim() : boardCode;
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

async function buildAggregationKeyMapFromWarehouse() {
  // Build mapping: raw boardCode -> aggregationKey
  const docs = await WarehouseInventory.find(
    { aggregationKey: { $exists: true, $ne: "" } },
    { boardCode: 1, aggregationKey: 1 }
  ).lean();

  const map = new Map();
  for (const d of docs) {
    if (d?.boardCode && d?.aggregationKey)
      map.set(d.boardCode, d.aggregationKey);
  }
  return map;
}

// --- Main sync
async function syncOnce() {
  try {
    const [boardsqldata, qtysqldata] = await Promise.all([
      FetchDatafromTLF("dbo.Ident"),
      FetchDatafromTLF("dbo.lagen"),
    ]);

    const saved = await saveDataToMongoDB(boardsqldata, qtysqldata);

    // Update warehouse tlfQty from the raw snapshot
    await updateWarehouseTlfQuantities(saved);

    const latest = await TLFInventory.findOne({})
      .sort({ FetchedAt: -1 })
      .lean();

    // Build agg snapshot for warehouse page
    const aggKeyMap = await buildAggregationKeyMapFromWarehouse();
    const aggSnapshot = buildAggSnapshotFromRaw(latest, aggKeyMap);

    // Emit both versions
    bus.emit("tlf_snapshot_raw", latest);
    bus.emit("tlf_snapshot_agg", aggSnapshot);

    console.log("New data emitted");

    return {
      ok: true,
      fetchedAt: latest?.FetchedAt,
      boardsCount: latest?.boards?.length || 0,
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
