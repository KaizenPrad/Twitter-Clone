import mongoose from "mongoose";

const connectMongoDb = async () => {
    try {
       const conn =  await mongoose.connect(process.env.MONGO_URI);
     console.log(`Connected to MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectMongoDb;