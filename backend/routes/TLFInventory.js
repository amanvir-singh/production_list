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

const saveDataToMongoDB = async (boardsqldata, qtysqldata) => {
  try {
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
    const [boardsqldata, qtysqldata] = await Promise.all([
      FetchDatafromTLF("dbo.Ident"),
      FetchDatafromTLF("dbo.lagen"),
    ]);

    await saveDataToMongoDB(boardsqldata, qtysqldata);
    console.log(qtysqldata[19]);
    console.log(qtysqldata[10]);

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
