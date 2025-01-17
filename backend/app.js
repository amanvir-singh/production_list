const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const connectDB = require('./database');
const usersRoutes = require('./routes/users');
const finishesRoutes = require('./routes/finishes');
const logsRoutes = require('./routes/logs');
const materialsRoutes = require('./routes/materials');
const suppliersRoutes = require('./routes/suppliers');
const thicknessesRoutes = require('./routes/thicknesses');
const jobstatusindicatorsRoutes = require('./routes/jobstatusindicators');
const stockstatusindicatorsRoutes = require('./routes/stockstatusindicator');
const productionListRoutes = require('./routes/productionList');
const preProdRoutes = require('./routes/preprod');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
  

// Middleware
app.use(express.json());

// Routes
app.use('/users', usersRoutes);
app.use('/finishes', finishesRoutes);
app.use('/logs', logsRoutes);
app.use('/materials', materialsRoutes);
app.use('/suppliers', suppliersRoutes);
app.use('/thicknesses', thicknessesRoutes);
app.use('/jobStatusIndicators', jobstatusindicatorsRoutes);
app.use('/stockStatusIndicators', stockstatusindicatorsRoutes);
app.use('/productionLists', productionListRoutes);
app.use('/preprod', preProdRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




