const mongoose = require('mongoose');
const crypto = require('crypto');

// Generate a random string for a user's referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex');
}

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 100 },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  referralCode: { type: String, default: generateReferralCode, unique: true },
  ip: { type: String },
  lastLoginDate: { type: Date },
  lastLoginIp: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Referral Schema
const referralSchema = new mongoose.Schema({
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pointsAwarded: { type: Number, default: 500 },
  createdAt: { type: Date, default: Date.now }
});

// Reward Schema
const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  pointsCost: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Redemption Schema
const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  email: { type: String, required: true },
  country: { type: String, required: true },
  pointsCost: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  giftCardCode: { type: String },
  notes: { type: String },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Ad Schema
const adSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Settings Schema
const settingsSchema = new mongoose.Schema({
  referralPoints: { type: Number, default: 500 },
  newUserPoints: { type: Number, default: 100 },
  ipCheckEnabled: { type: Boolean, default: true },
  adblockDetectionEnabled: { type: Boolean, default: true },
  redemptionEmailTemplate: { type: String, default: 'Dear {{username}},\n\nYour redemption request for {{reward_name}} has been approved. Your Google Play Gift Card code is: {{gift_card_code}}\n\nThank you for using GiftRush!\n\nBest regards,\nThe GiftRush Team' },
  bannedIPs: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Referral = mongoose.model('Referral', referralSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const Redemption = mongoose.model('Redemption', redemptionSchema);
const Ad = mongoose.model('Ad', adSchema);
const Settings = mongoose.model('Settings', settingsSchema);

module.exports = {
  User,
  Referral,
  Reward,
  Redemption,
  Ad,
  Settings,
  generateReferralCode
};