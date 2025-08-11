import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    // If we already have a connection, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we don't have a promise, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };

      cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/quickcart`, opts).then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      });
    }

    // Wait for the promise to resolve and cache the connection
    cached.conn = await cached.promise;
    return cached.conn;
    
  } catch (error) {
    // Reset the promise so we can try again next time
    cached.promise = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export default connectDB;