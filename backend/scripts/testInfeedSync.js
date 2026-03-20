/**
 * Simulates the infeed processing step from syncOnce.
 * Run from backend/: node scripts/testInfeedSync.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../database");
const { FetchDatafromTLFWithQuery } = require("../TLF_Connection");
const { initializeModels } = require("../createModels");

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  await connectDB();
  const models = initializeModels();
  const TLFInfeedCursor = models.TLFInfeedCursor;
  const TLFInfeedLog = models.TLFInfeedLog;

  // Step 1: Read cursor
  const cursor = await TLFInfeedCursor.findById("bewegungCursor").lean();
  console.log("Cursor:", cursor);
  const lastId = cursor?.lastProcessedId || 0;

  // Step 2: Fetch from TLF
  console.log(`\nQuerying: WHERE Id > ${lastId} AND Einlagervorgang = 1 AND Auslagervorgang = 0`);
  let rows;
  try {
    rows = await FetchDatafromTLFWithQuery(
      `SELECT * FROM dbo.Bewegungen WHERE Id > ${lastId} AND Einlagervorgang = 1 AND Auslagervorgang = 0`
    );
    console.log(`Rows from TLF: ${rows.length}`);
  } catch (err) {
    console.error("TLF fetch ERROR:", err.message);
    process.exit(1);
  }

  // Step 3: Normalize
  const normalized = [];
  for (const r of rows || []) {
    const bewegungRowId = toNum(r.Id);
    if (!bewegungRowId) { console.log("Skipping row - no Id:", r); continue; }
    const boardCode = r.Identnummer;
    if (!boardCode) { console.log("Skipping row - no Identnummer:", r); continue; }
    normalized.push({
      bewegungRowId,
      boardCode: String(boardCode),
      fromPosition: toNum(r.Quellplatz),
      toPosition: toNum(r.Zielplatz),
      quantity: 1,
      eventTime: r.Bewegungsdatum ? new Date(r.Bewegungsdatum) : null,
    });
  }
  console.log(`Normalized: ${normalized.length}`);
  if (normalized.length > 0) {
    console.log("First:", JSON.stringify(normalized[0]));
    console.log("Last: ", JSON.stringify(normalized[normalized.length - 1]));
  }

  // Step 4: Dedup check
  const allIds = normalized.map((e) => e.bewegungRowId);
  const existing = await TLFInfeedLog.find({ bewegungRowId: { $in: allIds } }, { bewegungRowId: 1 }).lean();
  console.log(`\nAlready in MongoDB: ${existing.length}`);
  const existingSet = new Set(existing.map((l) => l.bewegungRowId));

  const toInsert = normalized.filter((e) => !existingSet.has(e.bewegungRowId));
  console.log(`To insert: ${toInsert.length}`);

  // Step 5: Insert
  if (toInsert.length > 0) {
    const now = new Date();
    const docs = toInsert.map((ev) => ({ ...ev, processedAt: now }));
    try {
      const result = await TLFInfeedLog.insertMany(docs, { ordered: false });
      console.log(`\nInserted: ${result.length}`);
    } catch (err) {
      console.error("insertMany ERROR:", err.message);
    }
  }

  // Step 6: Advance cursor
  const maxId = normalized.length > 0 ? Math.max(...normalized.map((e) => e.bewegungRowId)) : lastId;
  console.log(`\nMax bewegungRowId: ${maxId}`);
  if (maxId > lastId) {
    await TLFInfeedCursor.updateOne(
      { _id: "bewegungCursor" },
      { $set: { lastProcessedId: maxId, lastProcessedAt: new Date() } },
      { upsert: true }
    );
    console.log("Cursor advanced to:", maxId);
  } else {
    console.log("Cursor unchanged.");
  }

  // Step 7: Final count
  const finalCount = await TLFInfeedLog.countDocuments();
  console.log(`\nTotal TLFInfeedLog docs now: ${finalCount}`);

  mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
