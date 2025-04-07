const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const connectDB = require("./database");
const usersRoutes = require("./routes/users");
const finishesRoutes = require("./routes/finishes");
const logsRoutes = require("./routes/logs");
const materialsRoutes = require("./routes/materials");
const suppliersRoutes = require("./routes/suppliers");
const thicknessesRoutes = require("./routes/thicknesses");
const jobstatusindicatorsRoutes = require("./routes/jobstatusindicators");
const stockstatusindicatorsRoutes = require("./routes/stockstatusindicator");
const productionListRoutes = require("./routes/productionList");
const preProdRoutes = require("./routes/preprod");
const TLFInventoryRoutes = require("./routes/TLFInventory");
const TLFInventoryFixerRoutes = require("./routes/TLFInventoryFixer");
const jobListRoutes = require("./routes/jobList");
const jobListMaterialRoutes = require("./routes/jobListMaterial");
const edgeBandRoutes = require("./routes/edgeBand");

const app = express();

// Connect to MongoDB
connectDB();

// app.use(cors({
//     origin: '0.0.0.0',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://productionmanager.local:8080", // Your custom domain
      "http://192.168.78.78:8080", // Backend IP address
      "http://localhost:5173", // Localhost for development
      "http://localhost:4173", // Localhost for build preview
    ];

    // Allow requests with no origin (e.g., mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Otherwise, block the request
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use("/users", usersRoutes);
app.use("/finishes", finishesRoutes);
app.use("/logs", logsRoutes);
app.use("/materials", materialsRoutes);
app.use("/suppliers", suppliersRoutes);
app.use("/thicknesses", thicknessesRoutes);
app.use("/jobStatusIndicators", jobstatusindicatorsRoutes);
app.use("/stockStatusIndicators", stockstatusindicatorsRoutes);
app.use("/productionLists", productionListRoutes);
app.use("/preprod", preProdRoutes);
app.use("/TLFInventory", TLFInventoryRoutes);
app.use("/tlfinventoryfixer", TLFInventoryFixerRoutes);
app.use("/joblist", jobListRoutes);
app.use("/joblistmaterial", jobListMaterialRoutes);
app.use("/edgeband", edgeBandRoutes);
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
