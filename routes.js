const { storage } = require('./storage');

// Register all API routes
function registerRoutes(app) {
  // Get user statistics
  app.get('/api/user/stats', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const stats = await storage.getUserStats(req.user._id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch user statistics' });
    }
  });

  // Get user's referrals
  app.get('/api/user/referrals', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const referrals = await storage.getUserReferrals(req.user._id);
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // Get user's redemptions
  app.get('/api/user/redemptions', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const redemptions = await storage.getUserRedemptions(req.user._id);
      res.json(redemptions);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      res.status(500).json({ message: 'Failed to fetch redemptions' });
    }
  });

  // Get available rewards
  app.get('/api/rewards', async (req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      res.status(500).json({ message: 'Failed to fetch rewards' });
    }
  });

  // Redeem a reward
  app.post('/api/rewards/redeem', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { rewardId, email, country } = req.body;
      
      if (!rewardId || !email || !country) {
        return res.status(400).json({ message: 'Reward ID, email, and country are required' });
      }
      
      const result = await storage.redeemReward(req.user._id, rewardId, email, country);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.status(201).json(result.redemption);
    } catch (error) {
      console.error('Error redeeming reward:', error);
      res.status(500).json({ message: 'Failed to redeem reward' });
    }
  });

  // Get ads
  app.get('/api/ads', async (req, res) => {
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ message: 'Failed to fetch ads' });
    }
  });

  // ADMIN ROUTES
  
  // Get site settings
  app.get('/api/admin/settings', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });
  
  // Update site settings
  app.put('/api/admin/settings', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const updates = req.body;
      const updatedSettings = await storage.updateSettings(updates);
      
      if (!updatedSettings) {
        return res.status(500).json({ message: 'Failed to update settings' });
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });
  
  // Ban a user
  app.post('/api/admin/users/:id/ban', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { reason } = req.body;
      const bannedUser = await storage.banUser(req.params.id, reason);
      
      if (!bannedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(bannedUser);
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });
  
  // Unban a user
  app.post('/api/admin/users/:id/unban', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const unbannedUser = await storage.unbanUser(req.params.id);
      
      if (!unbannedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(unbannedUser);
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({ message: 'Failed to unban user' });
    }
  });
  
  // Ban an IP address
  app.post('/api/admin/ban-ip', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { ip } = req.body;
      
      if (!ip) {
        return res.status(400).json({ message: 'IP address is required' });
      }
      
      const success = await storage.banIP(ip);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to ban IP' });
      }
      
      res.json({ message: 'IP banned successfully' });
    } catch (error) {
      console.error('Error banning IP:', error);
      res.status(500).json({ message: 'Failed to ban IP' });
    }
  });
  
  // Unban an IP address
  app.post('/api/admin/unban-ip', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { ip } = req.body;
      
      if (!ip) {
        return res.status(400).json({ message: 'IP address is required' });
      }
      
      const success = await storage.unbanIP(ip);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to unban IP' });
      }
      
      res.json({ message: 'IP unbanned successfully' });
    } catch (error) {
      console.error('Error unbanning IP:', error);
      res.status(500).json({ message: 'Failed to unban IP' });
    }
  });
  
  // Get banned users
  app.get('/api/admin/banned-users', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const bannedUsers = await storage.getBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      console.error('Error fetching banned users:', error);
      res.status(500).json({ message: 'Failed to fetch banned users' });
    }
  });
  
  // Get all users
  app.get('/api/admin/users', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Get a single user
  app.get('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Update a user
  app.put('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUser(req.params.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Delete a user
  app.delete('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const result = await storage.deleteUser(req.params.id);
      
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Get all referrals
  app.get('/api/admin/referrals', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const referrals = await storage.getAllReferrals();
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // Get all redemptions
  app.get('/api/admin/redemptions', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const redemptions = await storage.getAllRedemptions();
      res.json(redemptions);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      res.status(500).json({ message: 'Failed to fetch redemptions' });
    }
  });
  
  // Get a single redemption
  app.get('/api/admin/redemptions/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const redemptions = await storage.getAllRedemptions();
      const redemption = redemptions.find(r => r.id.toString() === req.params.id);
      
      if (!redemption) {
        return res.status(404).json({ message: 'Redemption not found' });
      }
      
      res.json(redemption);
    } catch (error) {
      console.error('Error fetching redemption details:', error);
      res.status(500).json({ message: 'Failed to fetch redemption details' });
    }
  });

  // Update redemption status
  app.put('/api/admin/redemptions/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { status, giftCardCode, notes } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // For approved status, require a gift card code
      if (status === 'approved' && !giftCardCode) {
        return res.status(400).json({ message: 'Gift card code is required for approval' });
      }
      
      const updatedRedemption = await storage.updateRedemptionStatus(req.params.id, status, {
        giftCardCode,
        notes
      });
      
      if (!updatedRedemption) {
        return res.status(404).json({ message: 'Redemption not found' });
      }
      
      res.json(updatedRedemption);
    } catch (error) {
      console.error('Error updating redemption:', error);
      res.status(500).json({ message: 'Failed to update redemption' });
    }
  });

  // Get all rewards (admin)
  app.get('/api/admin/rewards', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      res.status(500).json({ message: 'Failed to fetch rewards' });
    }
  });

  // Get a single reward
  app.get('/api/admin/rewards/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const reward = await storage.getReward(req.params.id);
      
      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      
      res.json(reward);
    } catch (error) {
      console.error('Error fetching reward:', error);
      res.status(500).json({ message: 'Failed to fetch reward' });
    }
  });

  // Create a reward
  app.post('/api/admin/rewards', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { name, description, pointsCost } = req.body;
      
      if (!name || !description || !pointsCost) {
        return res.status(400).json({ message: 'Name, description and points cost are required' });
      }
      
      const reward = await storage.createReward({
        name,
        description,
        pointsCost: parseInt(pointsCost)
      });
      
      res.status(201).json(reward);
    } catch (error) {
      console.error('Error creating reward:', error);
      res.status(500).json({ message: 'Failed to create reward' });
    }
  });

  // Update a reward
  app.put('/api/admin/rewards/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const updates = req.body;
      const updatedReward = await storage.updateReward(req.params.id, updates);
      
      if (!updatedReward) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      
      res.json(updatedReward);
    } catch (error) {
      console.error('Error updating reward:', error);
      res.status(500).json({ message: 'Failed to update reward' });
    }
  });

  // Delete a reward
  app.delete('/api/admin/rewards/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const result = await storage.deleteReward(req.params.id);
      
      if (!result) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      
      res.json({ message: 'Reward deleted successfully' });
    } catch (error) {
      console.error('Error deleting reward:', error);
      res.status(500).json({ message: 'Failed to delete reward' });
    }
  });

  // Get all ads (admin)
  app.get('/api/admin/ads', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ message: 'Failed to fetch ads' });
    }
  });

  // Get a single ad
  app.get('/api/admin/ads/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const ad = await storage.getAd(req.params.id);
      
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      
      res.json(ad);
    } catch (error) {
      console.error('Error fetching ad:', error);
      res.status(500).json({ message: 'Failed to fetch ad' });
    }
  });

  // Create an ad
  app.post('/api/admin/ads', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { name, adCode } = req.body;
      
      if (!name || !adCode) {
        return res.status(400).json({ message: 'Name and ad code are required' });
      }
      
      const ad = await storage.createAd({
        name,
        adCode
      });
      
      res.status(201).json(ad);
    } catch (error) {
      console.error('Error creating ad:', error);
      res.status(500).json({ message: 'Failed to create ad' });
    }
  });

  // Update an ad
  app.put('/api/admin/ads/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const updates = req.body;
      const updatedAd = await storage.updateAd(req.params.id, updates);
      
      if (!updatedAd) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      
      res.json(updatedAd);
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({ message: 'Failed to update ad' });
    }
  });

  // Delete an ad
  app.delete('/api/admin/ads/:id', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const result = await storage.deleteAd(req.params.id);
      
      if (!result) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      
      res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({ message: 'Failed to delete ad' });
    }
  });

  return app;
}

module.exports = { registerRoutes };
