/**
 * Seeds the infeed cursor to a specific starting point.
 * Edit START_FROM_DATE below, then run: node scripts/seedInfeedCursor.js
 *
 * This sets lastProcessedId to the last Bewegungen Id BEFORE that date,
 * so the next sync picks up events from that date onward.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../database");
const { FetchDatafromTLFWithQuery } = require("../TLF_Connection");
const { initializeModels } = require("../createModels");

// --- CONFIGURE THIS ---
const START_FROM_DATE = "2026-03-20"; // Events ON OR AFTER this date will be picked up
// ----------------------

async function main() {
  await connectDB();
  const models = initializeModels();
  const TLFInfeedCursor = models.TLFInfeedCursor;

  // Find the last Id before the start date
  const rows = await FetchDatafromTLFWithQuery(
    `SELECT MAX(Id) AS LastId FROM dbo.Bewegungen WHERE Bewegungsdatum < '${START_FROM_DATE}'`
  );

  const lastId = rows[0]?.LastId || 0;
  console.log(`Last Bewegungen Id before ${START_FROM_DATE}: ${lastId}`);

  // Upsert the cursor
  const result = await TLFInfeedCursor.updateOne(
    { _id: "bewegungCursor" },
    { $set: { lastProcessedId: lastId, lastProcessedAt: new Date() } },
    { upsert: true }
  );

  console.log("Cursor upserted:", result);

  const cursor = await TLFInfeedCursor.findById("bewegungCursor").lean();
  console.log("Cursor now:", cursor);

  mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
