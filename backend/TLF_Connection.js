const sql = require("mssql");
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

async function FetchDatafromTLF(table_name) {
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Query the database
    const query = `SELECT * FROM ${table_name}`;
    const result = await pool.request().query(query);

    return result.recordset;
  } catch (err) {
    console.error("Error fetching data: ", err);
    throw err;
  }
}

async function FetchDatafromTLFWithQuery(query) {
  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Query the database
    const result = await pool.request().query(query);

    return result.recordset;
  } catch (err) {
    console.error("Error fetching data: ", err);
    throw err;
  }
}

module.exports = { FetchDatafromTLF, FetchDatafromTLFWithQuery };
