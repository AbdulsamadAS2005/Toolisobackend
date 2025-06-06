let mongoose = require('mongoose');

const connectDb = async () => {
    try {
        await mongoose.connect('mongodb+srv://ranaabdulsamad500:hhYPmzBuXYaVwZPB@mycluster.hl9q4os.mongodb.net/')
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

module.exports = connectDb;