require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const { Server } = require("socket.io");
const http = require("http");

const config = require("./config");
const logger = require("./utils/logger");

// Routes
const authRoute = require("./routes/auth");
const chatRoute = require("./routes/chatbot");
const menuRoute = require("./routes/menu");
const orderRoute = require("./routes/orderRoutes");
const reservationRoute = require("./routes/reservationRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const deliveryBoyRoute = require("./routes/deliveryBoyRoutes");
const adminRoute = require("./routes/adminRoutes");
const menuRoutes = require('./routes/menuRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Import middleware
const { apiLimiter, authLimiter, chatbotLimiter } = require('./middleware/rateLimiter');

// Security Middleware
// Production-grade security middleware
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}));

// Production CORS settings
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Optimize response size
app.use(compression());

// Production logging
app.use(morgan('[:date[iso]] ":method :url" :status :response-time ms - :res[content-length]', { 
  stream: logger.stream,
  skip: (req, res) => res.statusCode < 400 // Only log errors in production
}));
app.use(express.json({ limit: '50mb' })); // Increased body parser limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Apply rate limiting to routes
// Auth routes
app.use("/api/auth", authLimiter, authRoute);

// Core functionality routes
app.use("/api/menu", apiLimiter, menuRoutes); // Using menuRoutes instead of menuRoute
app.use("/api/orders", apiLimiter, orderRoute);
app.use("/api/reservations", apiLimiter, reservationRoute);
app.use("/api/payments", apiLimiter, paymentRoute);

// User type specific routes
app.use("/api/delivery-boy", apiLimiter, deliveryBoyRoute);
app.use("/api/admin", apiLimiter, adminRoute);
app.use("/api/user", apiLimiter, userRoutes);

// Additional services
app.use("/api/chatbot", chatbotLimiter, chatRoute);
app.use('/api/users', apiLimiter, userRoutes);

// Root endpoint
app.get("/", (_, res) => res.send("🚀 Real-Time Restaurant Server is running"));

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Manager
const socketManager = require('./utils/socketManager');
socketManager.initialize(server);

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

// Graceful shutdown handling
const gracefulShutdown = async () => {
  try {
    logger.info('Starting graceful shutdown...');
    
    // Close HTTP server
    await new Promise((resolve) => {
      server.close(resolve);
    });
    logger.info('HTTP server closed.');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => {
  gracefulShutdown().catch(err => {
    logger.error('Error during SIGTERM shutdown:', err);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  gracefulShutdown().catch(err => {
    logger.error('Error during SIGINT shutdown:', err);
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown().catch(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  gracefulShutdown().catch(() => process.exit(1));
});

// MongoDB + Server Boot
mongoose.connect(config.mongoUri)
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    
    let port = config.port;
    const maxRetries = 10;
    let retries = 0;

    const startServer = async (retryPort) => {
      try {
        await new Promise((resolve, reject) => {
          const serverInstance = server.listen(retryPort, () => {
            console.log(`🚀 Server listening on port ${retryPort}`);
            resolve();
          });

          serverInstance.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              serverInstance.close();
              reject(err);
            }
          });
        });
      } catch (err) {
        if (err.code === 'EADDRINUSE' && retries < maxRetries) {
          retries++;
          console.log(`Port ${retryPort} is in use, trying port ${retryPort + 1}...`);
          return startServer(retryPort + 1);
        }
        throw err;
      }
    };

    await startServer(port);
}).catch((err) => {
  console.error("❌ MongoDB Connection Failed:", err);
  process.exit(1);
});
