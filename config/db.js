const mongoose = require('mongoose');
require('dotenv').config();

const mongourl = process.env.MONGO_URI

const connectMongooseDb = async () => {
    try{
        await mongoose.connect(mongourl)
        console.log("Connected to MongoDB successfully");
    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
        console.log("Please check your MONGO_URI in .env file");
        console.log("For local MongoDB, use: mongodb://localhost:27017/online-exam-system");
        // Don't throw error to prevent app crash - continue with graceful degradation
        process.exit(1);
    }
}
module.exports = connectMongooseDb;