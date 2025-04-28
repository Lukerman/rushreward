const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const session = require('express-session');
const { storage } = require('./storage');

// Hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password with hash
async function comparePasswords(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Set up authentication
function setupAuth(app) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'giftrush-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure LocalStrategy for authentication
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      // If user not found or password incorrect
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      // Check if user is banned
      if (user.isBanned) {
        return done(null, false, { message: 'Account is banned: ' + (user.banReason || 'Violation of terms of service') });
      }
      
      // Update last login info
      await storage.updateUser(user._id, {
        lastLoginDate: new Date(),
        lastLoginIp: user.ip // Keep the same IP or update with new IP if needed
      });
      
      // Success - return user
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register route - create new user
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password, referral } = req.body;
      
      // Validate inputs
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if username or email already exists
      const exists = await storage.checkUserExists(email, username);
      if (exists) {
        return res.status(400).json({ message: 'Username or email already in use' });
      }
      
      // Get IP address
      const ip = req.ip || req.connection.remoteAddress;
      
      // Check if IP is banned
      const ipBanned = await storage.isIPBanned(ip);
      if (ipBanned) {
        return res.status(403).json({ message: 'This IP address has been banned from registration' });
      }
      
      // Check for multiple accounts from same IP
      const settings = await storage.getSettings();
      if (settings && settings.ipCheckEnabled) {
        const existingUserFromIP = await storage.getUserByIP(ip);
        
        if (existingUserFromIP) {
          return res.status(400).json({ message: 'An account from this IP already exists' });
        }
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        referral,
        ip
      });
      
      // Log user in automatically
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Login route
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      req.session.destroy();
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  // Get current user route
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    res.json(req.user);
  });
}

module.exports = { setupAuth };
