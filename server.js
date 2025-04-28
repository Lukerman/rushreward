// Import required modules
const express = require('express');
const session = require('express-session');
const path = require('path');
const { registerRoutes } = require('./routes');
const { setupAuth } = require('./auth');
const { connectToDatabase } = require('./database');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize authentication
setupAuth(app);

// Register routes
registerRoutes(app);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/auth', (req, res) => {
  // If user is already authenticated, redirect to dashboard
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'views/auth.html'));
});

app.get('/dashboard', (req, res) => {
  // Protect dashboard route
  if (!req.isAuthenticated()) {
    return res.redirect('/auth');
  }
  res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

app.get('/admin', (req, res) => {
  // Protect admin route
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.redirect('/auth');
  }
  res.sendFile(path.join(__dirname, 'views/admin.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start the server
connectToDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });
