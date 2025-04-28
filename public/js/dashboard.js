document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard features
    initDashboard();
    
    // Initialize referral link copying
    initReferralLink();
    
    // Initialize reward redemption
    initRewardRedemption();
    
    // Load user data
    loadUserData();
    
    // Load referrals
    loadReferrals();
    
    // Load redemption history
    loadRedemptionHistory();
    
    // Initialize adblock detection
    initAdblockDetection();
    
    // Load ads
    loadAds();
});

/**
 * Initialize dashboard features
 */
function initDashboard() {
    // Load user stats
    updateUserStats();
    
    // Set up modal functionality for redemption and gift card details
    initModal('redemption-modal');
    initModal('gift-card-details-modal');
}

/**
 * Update user statistics on the dashboard
 */
function updateUserStats() {
    fetch('/api/user/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load user stats');
            }
            return response.json();
        })
        .then(data => {
            // Update points display
            const pointsElement = document.getElementById('user-points');
            if (pointsElement) {
                pointsElement.textContent = formatNumber(data.points || 0);
            }
            
            // Update referrals count
            const referralsElement = document.getElementById('referrals-count');
            if (referralsElement) {
                referralsElement.textContent = formatNumber(data.referralsCount || 0);
            }
            
            // Update redemptions count
            const redemptionsElement = document.getElementById('redemptions-count');
            if (redemptionsElement) {
                redemptionsElement.textContent = formatNumber(data.redemptionsCount || 0);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message, 'error');
        });
}

/**
 * Initialize referral link copying functionality
 */
function initReferralLink() {
    const copyBtn = document.getElementById('copy-referral-link');
    const referralInput = document.getElementById('referral-link');
    
    if (copyBtn && referralInput) {
        copyBtn.addEventListener('click', () => {
            // Copy text to clipboard
            copyToClipboard(referralInput.value, () => {
                // Show success message
                showToast('Referral link copied to clipboard!', 'success');
                
                // Change button text temporarily
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            });
        });
    }
}

/**
 * Initialize reward redemption functionality
 */
function initRewardRedemption() {
    // Load available rewards
    loadAvailableRewards();
    
    // Set up redemption form submission
    const redemptionForm = document.getElementById('redemption-form');
    if (redemptionForm) {
        redemptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const rewardId = document.getElementById('reward-id').value;
            const email = document.getElementById('redemption-email').value;
            
            if (!rewardId || !email) {
                showToast('Please select a reward and enter your email', 'error');
                return;
            }
            
            redeemReward(rewardId, email);
        });
    }
}

/**
 * Load user data from the server
 */
function loadUserData() {
    fetch('/api/user')
        .then(response => {
            if (!response.ok) {
                // If not authenticated, redirect to login
                if (response.status === 401) {
                    window.location.href = '/auth';
                }
                throw new Error('Failed to load user data');
            }
            return response.json();
        })
        .then(user => {
            // Update user information
            const welcomeElement = document.getElementById('welcome-message');
            if (welcomeElement) {
                welcomeElement.textContent = `Welcome back, ${user.username}!`;
            }
            
            // Set referral link
            const referralLink = document.getElementById('referral-link');
            if (referralLink) {
                const baseUrl = window.location.origin;
                referralLink.value = `${baseUrl}/auth?register=true&ref=${user.referralCode}`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message, 'error');
        });
}

/**
 * Load user's referrals
 */
function loadReferrals() {
    fetch('/api/user/referrals')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load referrals');
            }
            return response.json();
        })
        .then(referrals => {
            const referralTableBody = document.getElementById('referrals-table-body');
            if (!referralTableBody) return;
            
            if (referrals.length === 0) {
                // No referrals yet
                referralTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center">You haven't referred anyone yet.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with referrals
            referralTableBody.innerHTML = '';
            referrals.forEach(referral => {
                const row = document.createElement('tr');
                
                // Format the date
                const date = new Date(referral.joinedAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
                
                row.innerHTML = `
                    <td>${referral.username}</td>
                    <td>${formattedDate}</td>
                    <td>+${referral.pointsEarned} points</td>
                `;
                
                referralTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Show error message in table
            const referralTableBody = document.getElementById('referrals-table-body');
            if (referralTableBody) {
                referralTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center">Error loading referrals. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Load available rewards
 */
function loadAvailableRewards() {
    fetch('/api/rewards')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load rewards');
            }
            return response.json();
        })
        .then(rewards => {
            const rewardsContainer = document.getElementById('rewards-container');
            if (!rewardsContainer) return;
            
            if (rewards.length === 0) {
                // No rewards available
                rewardsContainer.innerHTML = `
                    <div class="text-center p-4">
                        <p>No rewards available at the moment. Please check back later.</p>
                    </div>
                `;
                return;
            }
            
            // Populate container with rewards
            rewardsContainer.innerHTML = '';
            rewards.forEach(reward => {
                const rewardElement = document.createElement('div');
                rewardElement.className = 'reward-card';
                rewardElement.innerHTML = `
                    <div class="reward-info">
                        <h3 class="reward-name">${reward.name}</h3>
                        <p class="reward-points">${reward.pointsCost} points</p>
                        <p class="reward-description">${reward.description}</p>
                    </div>
                    <button class="btn btn-primary redeem-btn" data-reward-id="${reward._id}" data-reward-name="${reward.name}" data-reward-points="${reward.pointsCost}">Redeem</button>
                `;
                
                rewardsContainer.appendChild(rewardElement);
            });
            
            // Add click event to redeem buttons
            document.querySelectorAll('.redeem-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const rewardId = this.getAttribute('data-reward-id');
                    const rewardName = this.getAttribute('data-reward-name');
                    const rewardPoints = this.getAttribute('data-reward-points');
                    
                    // Open redemption modal
                    openRedemptionModal(rewardId, rewardName, rewardPoints);
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Show error message
            const rewardsContainer = document.getElementById('rewards-container');
            if (rewardsContainer) {
                rewardsContainer.innerHTML = `
                    <div class="text-center p-4">
                        <p>Error loading rewards. Please try again later.</p>
                    </div>
                `;
            }
        });
}

/**
 * Open redemption modal with reward details
 * @param {string} rewardId - ID of the reward
 * @param {string} rewardName - Name of the reward
 * @param {string} rewardPoints - Point cost of the reward
 */
function openRedemptionModal(rewardId, rewardName, rewardPoints) {
    const modalTitle = document.querySelector('#redemption-modal .modal-title');
    const rewardInput = document.getElementById('reward-id');
    const rewardNameElement = document.getElementById('reward-name-display');
    const rewardPointsElement = document.getElementById('reward-points-display');
    
    if (modalTitle && rewardInput && rewardNameElement && rewardPointsElement) {
        modalTitle.textContent = `Redeem ${rewardName}`;
        rewardInput.value = rewardId;
        rewardNameElement.textContent = rewardName;
        rewardPointsElement.textContent = rewardPoints;
        
        // Show the modal
        showModal('redemption-modal');
    }
}

/**
 * Redeem a reward
 * @param {string} rewardId - ID of the reward
 * @param {string} email - Email for reward delivery
 */
function redeemReward(rewardId, email) {
    // Get the country from the form
    const country = document.getElementById('redemption-country').value;
    
    // Validate country selection
    if (!country) {
        showToast('Please select your country', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#redemption-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rewardId,
            email,
            country
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to redeem reward');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('redemption-modal');
        
        // Show success message
        showToast('Reward redeemed successfully!', 'success');
        
        // Update user stats
        updateUserStats();
        
        // Reload redemption history
        loadRedemptionHistory();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

/**
 * Load redemption history
 */
function loadRedemptionHistory() {
    fetch('/api/user/redemptions')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load redemption history');
            }
            return response.json();
        })
        .then(redemptions => {
            const redemptionTableBody = document.getElementById('redemptions-table-body');
            if (!redemptionTableBody) return;
            
            if (redemptions.length === 0) {
                // No redemptions yet
                redemptionTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">You haven't redeemed any rewards yet.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with redemptions
            redemptionTableBody.innerHTML = '';
            redemptions.forEach(redemption => {
                const row = document.createElement('tr');
                
                // Format the date
                const date = new Date(redemption.redeemedAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
                
                // Determine status badge class
                let statusClass = 'badge-pending';
                let actionBtn = '';
                
                if (redemption.status === 'approved') {
                    statusClass = 'badge-success';
                    // Add view gift card button for approved redemptions
                    actionBtn = `<button class="btn btn-sm btn-primary view-gc-btn" data-id="${redemption.id}">View Code</button>`;
                } else if (redemption.status === 'rejected') {
                    statusClass = 'badge-danger';
                    actionBtn = `<span class="badge badge-danger">Rejected</span>`;
                } else {
                    actionBtn = `<span class="badge badge-pending">Pending</span>`;
                }
                
                row.innerHTML = `
                    <td>${redemption.rewardName}</td>
                    <td>${formattedDate}</td>
                    <td>${redemption.pointsCost} points</td>
                    <td><span class="badge ${statusClass}">${redemption.status}</span></td>
                    <td>${actionBtn}</td>
                `;
                
                redemptionTableBody.appendChild(row);
                
                // Store gift card code data for approved redemptions
                if (redemption.status === 'approved' && redemption.giftCardCode) {
                    row.dataset.giftCardCode = redemption.giftCardCode;
                    row.dataset.notes = redemption.notes || '';
                    row.dataset.rewardName = redemption.rewardName;
                    row.dataset.redemptionDate = formattedDate;
                }
            });
            
            // Add event listeners for View Code buttons
            document.querySelectorAll('.view-gc-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const redemptionId = this.getAttribute('data-id');
                    const row = this.closest('tr');
                    
                    try {
                        // Fill in gift card details modal
                        const gcRewardNameEl = document.getElementById('gc-reward-name');
                        const gcRedemptionDateEl = document.getElementById('gc-redemption-date');
                        const gcCodeEl = document.getElementById('gc-code');
                        const gcNotesEl = document.getElementById('gc-notes');
                        const gcNotesContainerEl = document.getElementById('gc-notes-container');
                        
                        if (gcRewardNameEl) gcRewardNameEl.textContent = row.dataset.rewardName || 'Gift Card Reward';
                        if (gcRedemptionDateEl) gcRedemptionDateEl.textContent = row.dataset.redemptionDate || 'N/A';
                        if (gcCodeEl) gcCodeEl.value = row.dataset.giftCardCode || 'No code available';
                        
                        // Show notes if available
                        if (gcNotesEl && gcNotesContainerEl) {
                            if (row.dataset.notes && row.dataset.notes !== 'undefined' && row.dataset.notes.trim() !== '') {
                                gcNotesEl.textContent = row.dataset.notes;
                                gcNotesContainerEl.style.display = 'block';
                            } else {
                                gcNotesContainerEl.style.display = 'none';
                            }
                        }
                        
                        // Show the modal
                        showModal('gift-card-details-modal');
                    } catch (error) {
                        console.error('Error displaying gift card details:', error);
                        showToast('Error displaying gift card details. Please try again.', 'error');
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Show error message in table
            const redemptionTableBody = document.getElementById('redemptions-table-body');
            if (redemptionTableBody) {
                redemptionTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Error loading redemption history. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Load ads from the server
 */
function loadAds() {
    fetch('/api/ads')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load ads');
            }
            return response.json();
        })
        .then(ads => {
            // Select ad containers
            const adContainers = document.querySelectorAll('.ad-container');
            
            if (adContainers.length === 0 || ads.length === 0) return;
            
            // Randomly select ads for each container
            adContainers.forEach(container => {
                const randomAd = ads[Math.floor(Math.random() * ads.length)];
                container.innerHTML = randomAd.adCode;
            });
        })
        .catch(error => {
            console.error('Error loading ads:', error);
        });
}
