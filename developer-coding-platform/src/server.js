const dotenv = require('dotenv');
// Load environment variables as first operation
dotenv.config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Start Server function
const startServer = async () => {
  // Connect Database
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => {
      mongoose.connection.close(false, () => {
        process.exit(1);
      });
    });
  });

  // Graceful shutdown on SIGINT and SIGTERM
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} signal received: closing HTTP server and database connections...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
