/**
 * Infeed tracking diagnostic
 * Run from backend/: node scripts/diagInfeed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../database");
const { FetchDatafromTLFWithQuery } = require("../TLF_Connection");
const { initializeModels } = require("../createModels");

async function main() {
  await connectDB();
  const models = initializeModels();
  const TLFInfeedCursor = models.TLFInfeedCursor;
  const TLFInfeedLog = models.TLFInfeedLog;

  // 1) Check cursor state
  console.log("=== INFEED CURSOR ===");
  const cursor = await TLFInfeedCursor.findById("bewegungCursor").lean();
  console.log(cursor || "NOT FOUND");
  console.log();

  const lastId = cursor?.lastProcessedId || 0;

  // 2) Count infeed logs in MongoDB
  console.log("=== INFEED LOGS IN MONGODB ===");
  const logCount = await TLFInfeedLog.countDocuments();
  const recentLogs = await TLFInfeedLog.find().sort({ eventTime: -1 }).limit(5).lean();
  console.log(`Total docs: ${logCount}`);
  console.log("Most recent 5:", JSON.stringify(recentLogs, null, 2));
  console.log();

  // 3) Raw query — what would the filter return?
  console.log(`=== BEWEGUNGEN WHERE Id > ${lastId} AND Einlagervorgang = 1 AND Auslagervorgang = 0 ===`);
  const filtered = await FetchDatafromTLFWithQuery(
    `SELECT TOP 20 * FROM dbo.Bewegungen WHERE Id > ${lastId} AND Einlagervorgang = 1 AND Auslagervorgang = 0 ORDER BY Id ASC`
  );
  console.log(`Rows returned: ${filtered.length}`);
  if (filtered.length > 0) {
    for (const r of filtered) console.log(JSON.stringify(r, null, 2));
  }
  console.log();

  // 4) Broader check — any Einlagervorgang = 1 at all after cursor?
  console.log(`=== ANY Einlagervorgang = 1 after Id ${lastId} (no Auslagervorgang filter) ===`);
  const anyInfeed = await FetchDatafromTLFWithQuery(
    `SELECT TOP 10 Id, Identnummer, Quellplatz, Zielplatz, Einlagervorgang, Auslagervorgang, Bewegungsdatum FROM dbo.Bewegungen WHERE Id > ${lastId} AND Einlagervorgang = 1 ORDER BY Id ASC`
  );
  console.log(`Rows: ${anyInfeed.length}`);
  for (const r of anyInfeed) console.log(JSON.stringify(r));
  console.log();

  // 5) What's the max Id in Bewegungen right now?
  console.log("=== MAX Id IN dbo.Bewegungen ===");
  const maxRow = await FetchDatafromTLFWithQuery("SELECT MAX(Id) AS MaxId FROM dbo.Bewegungen");
  console.log(maxRow[0]);

  mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
