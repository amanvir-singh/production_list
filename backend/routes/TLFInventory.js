const express = require("express");
const router = express.Router();
const FetchDatafromTLF = require("../TLF_Connection");

const mongoose = require("mongoose");
const { Decimal128 } = mongoose.Types;

const { schemas } = require("../createModels");
const TLFInventory = mongoose.model(
  "TLFInventory",
  schemas.TLFInventorySchema,
  "TLFInventory"
);

const saveDataToMongoDB = async (data) => {
  try {
    const fetchedAt = new Date();

    await TLFInventory.deleteMany({});

    // Process each record from SQL and map it to the board schema
    const boardsData = data.map((record) => ({
      ID: record.IdNr, // Mapping SQL column 'IdNr' to 'ID'
      BoardCode: record.Identnummer, // Mapping 'Identnummer' to 'BoardCode'
      Length: Decimal128.fromString((record.Laenge / 1000).toString()),
      Width: Decimal128.fromString((record.Breite / 1000).toString()),
      Thickness: Decimal128.fromString((record.Dicke / 1000).toString()),
      Infeeds: record.AnzahlEin, // Mapping 'AnzahlEin' to 'Infeeds'
      Outfeeds: record.AnzahlAus, // Mapping 'AnzahlAus' to 'Outfeeds'
      TotalQty: record.AnzahlEin - record.AnzahlAus, // Calculating Model Qty
    }));

    const tlfInventory = new TLFInventory({
      FetchedAt: fetchedAt,
      boards: boardsData,
    });

    await tlfInventory.save(); // Save the document
    console.log("TLF Inventory successfully saved");
  } catch (err) {
    console.error("Error saving TLF Inventory to Database:", err);
    throw err;
  }
};

// Routes

router.get("/", async (req, res) => {
  try {
    const inventoryData = await TLFInventory.find();
    res.json(inventoryData);
  } catch (error) {
    console.error("Error fetching TLF inventory:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/fetch-now", async (req, res) => {
  try {
    // Fetch data from TLF
    const sqlData = await FetchDatafromTLF();

    // Save the fetched data to MongoDB
    await saveDataToMongoDB(sqlData);

    res.status(200).json({
      message: "TLF Inventory successfully fetched and saved",
    });
  } catch (err) {
    console.error("Error in /fetch-now route:", err);
    res.status(500).json({
      message: "Error occurred while fetching data.",
      error: err.message,
    });
  }
});

module.exports = router;
