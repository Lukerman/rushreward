const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const { User, Referral, Reward, Redemption, Ad } = require('./models');

// Initialize MongoDB connection
async function connectToDatabase() {
  try {
    // Simplified connection options for Mongoose with MongoDB 4.0+ driver
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('Connected to MongoDB database');
    
    // Initialize sample data if database is empty
    await initializeSampleData();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if database connection fails
  }
}

// Create session store
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions',
  expires: 1000 * 60 * 60 * 24 // 24 hours
});

// Handle session store errors
store.on('error', function(error) {
  console.error('Session store error:', error);
});

// Initialize sample data if database is empty
async function initializeSampleData() {
  try {
    // Check if there are any users
    const usersCount = await User.countDocuments();
    
    if (usersCount === 0) {
      console.log('Initializing sample data...');
      
      // Create admin user
      const adminPassword = await bcrypt.hash('adminpassword', 10);
      const admin = new User({
        username: 'admin',
        email: 'admin@giftrush.com',
        password: adminPassword,
        points: 10000,
        isAdmin: true,
        ip: '127.0.0.1'
      });
      await admin.save();
      
      // Create Google Play gift card rewards
      const rewards = [
        {
          name: 'Google Play $10 Gift Card',
          description: 'Get a $10 gift card for Google Play Store',
          pointsCost: 2000
        },
        {
          name: 'Google Play $25 Gift Card',
          description: 'Get a $25 gift card for Google Play Store',
          pointsCost: 5000
        },
        {
          name: 'Google Play $50 Gift Card',
          description: 'Get a $50 gift card for Google Play Store',
          pointsCost: 10000
        },
        {
          name: 'Google Play $100 Gift Card',
          description: 'Get a $100 gift card for Google Play Store',
          pointsCost: 20000
        }
      ];
      
      await Reward.insertMany(rewards);
      
      // Create sample ads
      const ads = [
        {
          name: 'Sidebar Advertisement',
          adCode: '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center;"><h4>Special Offer!</h4><p>Double points on your next 5 referrals!</p><a href="#" class="btn btn-sm btn-primary">Learn More</a></div>'
        },
        {
          name: 'Banner Advertisement',
          adCode: '<div style="background-color: #e9f7fe; padding: 15px; border-radius: 5px; text-align: center;"><h4>New Gift Cards Available!</h4><p>Check out our newest Google Play gift card options starting at $10</p><a href="#" class="btn btn-sm btn-secondary">View Rewards</a></div>'
        }
      ];
      
      await Ad.insertMany(ads);
      
      console.log('Sample data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

module.exports = { connectToDatabase, store };