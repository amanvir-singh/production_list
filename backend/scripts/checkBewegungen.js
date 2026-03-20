/**
 * Quick inspection script for dbo.Bewegungen
 * Run from backend/: node scripts/checkBewegungen.js
 */

require("dotenv").config();
const { FetchDatafromTLFWithQuery } = require("../TLF_Connection");

async function main() {
  console.log("Fetching top 20 rows from dbo.Bewegungen...\n");

  const rows = await FetchDatafromTLFWithQuery(
    "SELECT TOP 20 * FROM dbo.Bewegungen ORDER BY ID DESC"
  );

  if (!rows || rows.length === 0) {
    console.log("No rows returned.");
    return;
  }

  // Print column names
  console.log("=== COLUMNS ===");
  console.log(Object.keys(rows[0]).join(", "));
  console.log();

  // Print each row
  console.log("=== ROWS ===");
  for (const row of rows) {
    console.log(JSON.stringify(row, null, 2));
    console.log("---");
  }
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
