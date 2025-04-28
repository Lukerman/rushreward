const mongoose = require('mongoose');
const { User } = require('./models');

// Replace with your connection string if different
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/giftrush';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB database');
    makeAdmin();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Make a user admin by username
async function makeAdmin() {
  try {
    const username = process.argv[2];
    
    if (!username) {
      console.error('Please provide a username as an argument');
      process.exit(1);
    }
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }
    
    // Make user an admin and set points to 10000 if specified
    user.isAdmin = true;
    
    // Set points to 10000 if specified with --points flag
    if (process.argv.includes('--points')) {
      user.points = 10000;
      console.log(`Setting points to 10000 for user ${username}`);
    }
    
    await user.save();
    
    console.log(`User ${username} is now an admin with ${user.points} points`);
    
    // List all users
    const users = await User.find({}, 'username email isAdmin points');
    console.log('\nAll users:');
    users.forEach(u => {
      console.log(`- ${u.username} (${u.email}): Admin=${u.isAdmin}, Points=${u.points}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
}