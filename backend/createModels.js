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
  },
};
