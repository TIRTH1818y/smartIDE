const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('Database Connection Error: MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected successfully: Host ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}).`);

    // Attempt fallback to In-Memory MongoDB Server if installed
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('Starting In-Memory MongoDB Server fallback...');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`MongoDB connected successfully (In-Memory Server active): ${conn.connection.host}`);
      return;
    } catch (fallbackError) {
      console.error('\n===================================================================');
      console.error('DATABASE CONNECTION FAILED:');
      console.error(`Reason: ${error.message}`);
      console.error('\nTO FIX THIS:');
      console.error('1. Open .env file in developer-coding-platform directory.');
      console.error('2. Paste your MongoDB Atlas URI:');
      console.error('   MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/developer_platform?retryWrites=true&w=majority');
      console.error('3. Or start your local MongoDB daemon.');
      console.error('===================================================================\n');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
