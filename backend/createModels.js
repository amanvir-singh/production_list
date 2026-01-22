const mongoose = require("mongoose");

const userSchema = require("./models/users");
const materialSchema = require("./models/materials");
const supplierSchema = require("./models/suppliers");
const finishesSchema = require("./models/finishes");
const thicknessSchema = require("./models/thicknesses");
const jobStatusIndicatorSchema = require("./models/jobstatusindicators");
const stockStatusIndicatorSchema = require("./models/stockstatusindicator");
const productionListSchema = require("./models/productionList");
const logSchema = require("./models/logs");
const TLFInventorySchema = require("./models/TLFInventory");
const TLFInventoryFixerSchema = require("./models/TLFInventoryFixer");
const jobListSchema = require("./models/jobList");
const jobListMaterialSchema = require("./models/jobListMaterial");
const edgebandSchema = require("./models/edgeBand");
const warehouseInventorySchema = require("./models/warehouseInventory");
const TLFOrphanPanelSchema = require("./models/TLFOrphanPanel");
const TLFOutfeedLogSchema = require("./models/TLFOutfeedLog");
const TLFOutfeedCursorSchema = require("./models/TLFOutfeedCursor");
const materialOrderSchema = require("./models/materialOrder");

function initializeModels() {
  console.log("Checking for Models...");
  const models = {
    users: { name: "users", schema: userSchema },
    materials: { name: "materials", schema: materialSchema },
    suppliers: { name: "suppliers", schema: supplierSchema },
    finishes: { name: "finishes", schema: finishesSchema },
    thicknesses: { name: "thicknesses", schema: thicknessSchema },
    jobStatusIndicators: {
      name: "jobStatusIndicators",
      schema: jobStatusIndicatorSchema,
    },
    stockStatusIndicators: {
      name: "stockStatusIndicators",
      schema: stockStatusIndicatorSchema,
    },
    productionLists: {
      name: "productionLists",
      schema: productionListSchema,
    },
    logs: { name: "logs", schema: logSchema },
    TLFInventory: { name: "TLFInventory", schema: TLFInventorySchema },
    TLFInventoryFixer: {
      name: "TLFInventoryFixer",
      schema: TLFInventoryFixerSchema,
    },
    jobList: { name: "jobList", schema: jobListSchema },
    jobListMaterial: { name: "jobListMaterial", schema: jobListMaterialSchema },
    edgeBand: { name: "edgeBand", schema: edgebandSchema },
    warehouseInventory: {
      name: "warehouseInventory",
      schema: warehouseInventorySchema,
    },
    TLFOrphanPanel: {
      name: "TLFOrphanPanel",
      schema: TLFOrphanPanelSchema,
    },
    TLFOutfeedLog: {
      name: "TLFOutfeedLog",
      schema: TLFOutfeedLogSchema,
    },
    TLFOutfeedCursor: {
      name: "TLFOutfeedCursor",
      schema: TLFOutfeedCursorSchema,
    },
    materialOrders: {
      name: "materialOrders",
      schema: materialOrderSchema,
    },
  };

  Object.entries(models).forEach(([key, { name, schema }]) => {
    if (mongoose.models[name]) {
      console.log(`Model ${name} exists`);
      models[key].model = mongoose.model(name);
    } else {
      console.log(`Model ${name} created`);
      models[key].model = mongoose.model(name, schema);
    }
  });

  return {
    User: models.users.model,
    Material: models.materials.model,
    Supplier: models.suppliers.model,
    Finish: models.finishes.model,
    Thickness: models.thicknesses.model,
    JobStatusIndicator: models.jobStatusIndicators.model,
    StatusStatusIndicator: models.stockStatusIndicators.model,
    ProductionList: models.productionLists.model,
    Log: models.logs.model,
    TLFInventory: models.TLFInventory.model,
    TLFInventoryFixer: models.TLFInventoryFixer.model,
    jobList: models.jobList.model,
    jobListMaterial: models.jobListMaterial.model,
    edgeBand: models.edgeBand.model,
    warehouseInventory: models.warehouseInventory.model,
    TLFOrphanPanel: models.TLFOrphanPanel.model,
    TLFOutfeedLog: models.TLFOutfeedLog.model,
    TLFOutfeedCursor: models.TLFOutfeedCursor.model,
    MaterialOrder: models.materialOrders.model,
  };
}

module.exports = {
  initializeModels,
  schemas: {
    userSchema,
    materialSchema,
    supplierSchema,
    finishesSchema,
    thicknessSchema,
    jobStatusIndicatorSchema,
    stockStatusIndicatorSchema,
    productionListSchema,
    logSchema,
    TLFInventorySchema,
    TLFInventoryFixerSchema,
    jobListSchema,
    jobListMaterialSchema,
    edgebandSchema,
    warehouseInventorySchema,
    TLFOrphanPanelSchema,
    TLFOutfeedLogSchema,
    TLFOutfeedCursorSchema,
    materialOrderSchema,
  },
};
