let mongoose = require('mongoose');
const dotenv=require('dotenv');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.Server)
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectDb;