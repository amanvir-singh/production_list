const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();
const cors = require('cors');
const http = require('http'); 

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
const server = http.createServer(app);

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
      'http://productionmanager.local:8080', // Your custom domain
      'http://192.168.78.78:8080',          // Backend IP address (if needed)
      'http://localhost:5173'               // Localhost for development
    ];

    // Allow requests with no origin (e.g., mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Otherwise, block the request
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));


const io = new Server(server, {
  cors: corsOptions,
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB');
  const changeStream = db.collection('KBZ_Production_List').watch();

  changeStream.on('change', (change) => {
    console.log('Change detected:', change);
    io.emit('dataUpdated', change); // Emit event to all connected clients
  });

  changeStream.on('error', (error) => {
    console.error('Error in change stream:', error);
  });

  // Close change stream on app termination
  process.on('SIGINT', () => {
    changeStream.close();
    process.exit(0);
  });
});
  

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

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

