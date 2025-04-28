const mongoose = require('mongoose');
const { User } = require('./models');

// Replace with your connection string if different
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/giftrush';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB database');
    listUsers();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// List all users
async function listUsers() {
  try {
    const users = await User.find({}, 'username email isAdmin points');
    
    if (users.length === 0) {
      console.log('No users found in the database');
    } else {
      console.log('\nAll users:');
      users.forEach(user => {
        console.log(`- ${user.username} (${user.email}): Admin=${user.isAdmin}, Points=${user.points}`);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}