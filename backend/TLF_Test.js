const sql = require("mssql");
const fs = require("fs");
require("dotenv").config();

// SQL Server connection configuration
const config = {
  user: process.env.TLF_USER,
  password: process.env.TLF_PASSWORD,
  server: process.env.TLF_SERVER,
  database: process.env.TLF_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: false,
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function FetchDatafromTLF() {
  try {
    const pool = await sql.connect(config);

    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = '${process.env.TLF_DATABASE}'`);

    let allTableData = {};

    const totalTables = tablesResult.recordset.length;
    for (let i = 0; i < totalTables; i++) {
      const tableName = tablesResult.recordset[i].TABLE_NAME;

      const query = `SELECT * FROM ${tableName}`;

      try {
        const result = await pool.request().query(query);

        if (result.recordset.length > 0) {
          allTableData[tableName] = result.recordset;
        }

        console.log(`Processed table ${i + 1} of ${totalTables}: ${tableName}`);
      } catch (err) {
        console.error(`Error querying ${tableName}:`, err);
      }

      await sleep(5000); // sleep for 5 seconds
    }

    // Step 5: Save the result to a JSON file
    if (Object.keys(allTableData).length > 0) {
      const jsonData = JSON.stringify(allTableData, null, 2);
      fs.writeFileSync("allTableData.json", jsonData);
      console.log("Data has been saved to allTableData.json");
    } else {
      console.log("No data was found in the tables.");
    }
  } catch (err) {
    console.error("Error fetching data: ", err);
    throw err;
  }
}

//FetchDatafromTLF();
