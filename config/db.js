const mongoose = require('mongoose');
const { mongoURI } = require('./config'); // Import mongoURI from config.js

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
