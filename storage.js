// MongoDB-based storage for the application
const crypto = require('crypto');
const { User, Referral, Reward, Redemption, Ad, Settings } = require('./models');
const { store } = require('./database');

// Generate a random string for a user's referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex');
}

// Storage interface
const storage = {
  // Session store
  sessionStore: store,

  // User methods
  async createUser(userData) {
    try {
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password, // Already hashed in auth.js
        ip: userData.ip
      });
      
      await user.save();
      
      // If there's a referral, process it
      if (userData.referral) {
        await this.processReferral(userData.referral, user._id);
      }
      
      // Return the user without the password
      const userObject = user.toObject();
      delete userObject.password;
      return userObject;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  async getUser(id) {
    try {
      const user = await User.findById(id).lean();
      if (!user) return null;
      
      // Return without password
      delete user.password;
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },
  
  async getUserByUsername(username) {
    try {
      return await User.findOne({ username }).lean();
      // Include password for auth
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  },
  
  async getUserByReferralCode(referralCode) {
    try {
      const user = await User.findOne({ referralCode }).lean();
      if (!user) return null;
      
      // Return without password
      delete user.password;
      return user;
    } catch (error) {
      console.error('Error getting user by referral code:', error);
      return null;
    }
  },
  
  async checkUserExists(email, username) {
    try {
      const user = await User.findOne({
        $or: [
          { email },
          { username }
        ]
      });
      
      return !!user;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  },
  
  async getAllUsers() {
    try {
      const users = await User.find().lean();
      
      // Remove passwords
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },
  
  async updateUser(id, updates) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();
      
      if (!updatedUser) return null;
      
      // Return updated user without password
      delete updatedUser.password;
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },
  
  async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) return false;
      
      // Also delete associated referrals and redemptions
      await Referral.deleteMany({
        $or: [
          { referrerId: id },
          { referredId: id }
        ]
      });
      
      await Redemption.deleteMany({ userId: id });
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },
  
  async getUserByIP(ip) {
    try {
      return await User.findOne({ ip }).lean();
    } catch (error) {
      console.error('Error getting user by IP:', error);
      return null;
    }
  },
  
  // Referral methods
  async processReferral(referralCode, newUserId) {
    try {
      // Find the referrer
      const referrer = await this.getUserByReferralCode(referralCode);
      if (!referrer) return false;
      
      // Get the new user
      const newUser = await this.getUser(newUserId);
      if (!newUser) return false;
      
      // Create referral record
      const referral = new Referral({
        referrerId: referrer._id,
        referredId: newUserId,
        pointsAwarded: 500
      });
      
      await referral.save();
      
      // Award points to referrer
      await this.updateUser(referrer._id, {
        points: (referrer.points || 0) + 500
      });
      
      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  },
  
  async getUserReferrals(userId) {
    try {
      const referrals = await Referral.find({ referrerId: userId });
      const userReferrals = [];
      
      for (const referral of referrals) {
        const referredUser = await User.findById(referral.referredId).lean();
        
        if (referredUser) {
          userReferrals.push({
            id: referral._id,
            username: referredUser.username,
            joinedAt: referredUser.createdAt,
            pointsEarned: referral.pointsAwarded
          });
        }
      }
      
      return userReferrals;
    } catch (error) {
      console.error('Error getting user referrals:', error);
      return [];
    }
  },
  
  async getAllReferrals() {
    try {
      const referrals = await Referral.find().lean();
      const allReferrals = [];
      
      for (const referral of referrals) {
        const referrer = await User.findById(referral.referrerId).lean();
        const referred = await User.findById(referral.referredId).lean();
        
        if (referrer && referred) {
          allReferrals.push({
            id: referral._id,
            referrerUsername: referrer.username,
            referredUsername: referred.username,
            pointsAwarded: referral.pointsAwarded,
            createdAt: referral.createdAt
          });
        }
      }
      
      return allReferrals;
    } catch (error) {
      console.error('Error getting all referrals:', error);
      return [];
    }
  },
  
  // Reward methods
  async getAllRewards() {
    try {
      return await Reward.find().lean();
    } catch (error) {
      console.error('Error getting all rewards:', error);
      return [];
    }
  },
  
  async getReward(id) {
    try {
      return await Reward.findById(id).lean();
    } catch (error) {
      console.error('Error getting reward:', error);
      return null;
    }
  },
  
  async createReward(rewardData) {
    try {
      const reward = new Reward(rewardData);
      await reward.save();
      return reward.toObject();
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  },
  
  async updateReward(id, updates) {
    try {
      return await Reward.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      console.error('Error updating reward:', error);
      return null;
    }
  },
  
  async deleteReward(id) {
    try {
      const result = await Reward.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting reward:', error);
      return false;
    }
  },
  
  // Redemption methods
  async redeemReward(userId, rewardId, email, country) {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, message: 'User not found' };
      
      const reward = await this.getReward(rewardId);
      if (!reward) return { success: false, message: 'Reward not found' };
      
      // Check if user has enough points
      const userPoints = user.points || 0;
      if (userPoints < reward.pointsCost) {
        return { success: false, message: 'Not enough points' };
      }
      
      // Validate country is provided
      if (!country) {
        return { success: false, message: 'Country is required for gift card redemption' };
      }
      
      // Create redemption record
      const redemption = new Redemption({
        userId,
        rewardId,
        email,
        country,
        pointsCost: reward.pointsCost
      });
      
      await redemption.save();
      
      // Deduct points from user
      await this.updateUser(userId, {
        points: userPoints - reward.pointsCost
      });
      
      return { success: true, redemption: redemption.toObject() };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return { success: false, message: 'An error occurred during redemption' };
    }
  },
  
  async getUserRedemptions(userId) {
    try {
      const redemptions = await Redemption.find({ userId }).lean();
      const userRedemptions = [];
      
      for (const redemption of redemptions) {
        const reward = await Reward.findById(redemption.rewardId).lean();
        
        if (reward) {
          userRedemptions.push({
            id: redemption._id,
            rewardName: reward.name,
            pointsCost: redemption.pointsCost,
            status: redemption.status,
            redeemedAt: redemption.createdAt,
            processedAt: redemption.processedAt,
            email: redemption.email,
            country: redemption.country || 'Not specified',
            giftCardCode: redemption.status === 'approved' ? redemption.giftCardCode : null,
            notes: redemption.notes
          });
        }
      }
      
      return userRedemptions;
    } catch (error) {
      console.error('Error getting user redemptions:', error);
      return [];
    }
  },
  
  async getAllRedemptions() {
    try {
      const redemptions = await Redemption.find().lean();
      const allRedemptions = [];
      
      for (const redemption of redemptions) {
        const user = await User.findById(redemption.userId).lean();
        const reward = await Reward.findById(redemption.rewardId).lean();
        
        if (user && reward) {
          allRedemptions.push({
            id: redemption._id,
            username: user.username,
            rewardName: reward.name,
            pointsCost: redemption.pointsCost,
            status: redemption.status,
            createdAt: redemption.createdAt,
            email: redemption.email,
            country: redemption.country || 'Not specified'
          });
        }
      }
      
      return allRedemptions;
    } catch (error) {
      console.error('Error getting all redemptions:', error);
      return [];
    }
  },
  
  async updateRedemptionStatus(id, status, data = {}) {
    try {
      const redemption = await Redemption.findById(id);
      if (!redemption) return null;
      
      // Update status and additional data
      redemption.status = status;
      redemption.processedAt = new Date();
      
      // Add gift card code and notes if provided
      if (data.giftCardCode) {
        redemption.giftCardCode = data.giftCardCode;
      }
      
      if (data.notes) {
        redemption.notes = data.notes;
      }
      
      await redemption.save();
      
      // If rejected, refund points to user
      if (status === 'rejected') {
        const user = await User.findById(redemption.userId);
        if (user) {
          user.points = (user.points || 0) + redemption.pointsCost;
          await user.save();
        }
      }
      
      return redemption.toObject();
    } catch (error) {
      console.error('Error updating redemption status:', error);
      return null;
    }
  },
  
  // Ad methods
  async getAllAds() {
    try {
      return await Ad.find().lean();
    } catch (error) {
      console.error('Error getting all ads:', error);
      return [];
    }
  },
  
  async getAd(id) {
    try {
      return await Ad.findById(id).lean();
    } catch (error) {
      console.error('Error getting ad:', error);
      return null;
    }
  },
  
  async createAd(adData) {
    try {
      const ad = new Ad(adData);
      await ad.save();
      return ad.toObject();
    } catch (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
  },
  
  async updateAd(id, updates) {
    try {
      return await Ad.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      console.error('Error updating ad:', error);
      return null;
    }
  },
  
  async deleteAd(id) {
    try {
      const result = await Ad.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting ad:', error);
      return false;
    }
  },
  
  // Statistics methods
  async getUserStats(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) return null;
      
      const referralsCount = await Referral.countDocuments({ referrerId: userId });
      const redemptionsCount = await Redemption.countDocuments({ userId });
      
      return {
        points: user.points || 0,
        referralsCount,
        redemptionsCount
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  },
  
  // User ban management
  async banUser(userId, reason) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isBanned: true,
            banReason: reason || 'Violation of terms of service'
          } 
        },
        { new: true }
      ).lean();
      
      if (!updatedUser) return null;
      
      // Return updated user without password
      delete updatedUser.password;
      return updatedUser;
    } catch (error) {
      console.error('Error banning user:', error);
      return null;
    }
  },
  
  async unbanUser(userId) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isBanned: false,
            banReason: null
          } 
        },
        { new: true }
      ).lean();
      
      if (!updatedUser) return null;
      
      // Return updated user without password
      delete updatedUser.password;
      return updatedUser;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return null;
    }
  },
  
  // IP ban management
  async banIP(ip) {
    try {
      // Get settings
      let settings = await Settings.findOne();
      
      // If no settings yet, create them
      if (!settings) {
        settings = new Settings();
      }
      
      // Add IP to banned list if not already there
      if (!settings.bannedIPs.includes(ip)) {
        settings.bannedIPs.push(ip);
        settings.lastUpdated = new Date();
        await settings.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error banning IP:', error);
      return false;
    }
  },
  
  async unbanIP(ip) {
    try {
      // Get settings
      const settings = await Settings.findOne();
      
      if (!settings) return false;
      
      // Remove IP from banned list
      settings.bannedIPs = settings.bannedIPs.filter(bannedIp => bannedIp !== ip);
      settings.lastUpdated = new Date();
      await settings.save();
      
      return true;
    } catch (error) {
      console.error('Error unbanning IP:', error);
      return false;
    }
  },
  
  async isIPBanned(ip) {
    try {
      const settings = await Settings.findOne();
      
      if (!settings) return false;
      
      return settings.bannedIPs.includes(ip);
    } catch (error) {
      console.error('Error checking if IP is banned:', error);
      return false;
    }
  },
  
  // Settings management
  async getSettings() {
    try {
      let settings = await Settings.findOne().lean();
      
      // If no settings yet, create them with defaults
      if (!settings) {
        const newSettings = new Settings();
        await newSettings.save();
        settings = newSettings.toObject();
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  },
  
  async updateSettings(updates) {
    try {
      let settings = await Settings.findOne();
      
      // If no settings yet, create them
      if (!settings) {
        settings = new Settings();
      }
      
      // Update the fields
      Object.keys(updates).forEach(key => {
        if (key in settings) {
          settings[key] = updates[key];
        }
      });
      
      settings.lastUpdated = new Date();
      await settings.save();
      
      return settings.toObject();
    } catch (error) {
      console.error('Error updating settings:', error);
      return null;
    }
  },
  
  // Get all banned users
  async getBannedUsers() {
    try {
      const bannedUsers = await User.find({ isBanned: true }).lean();
      
      // Remove passwords
      return bannedUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error getting banned users:', error);
      return [];
    }
  }
};

module.exports = { storage };
