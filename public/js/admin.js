document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin tabs
    initAdminTabs();
    
    // Load admin data based on first active tab
    loadAdminData();
    
    // Initialize edit modal
    initModal('edit-modal');
    
    // Initialize adblock detection
    initAdblockDetection();
});

/**
 * Initialize admin tabs functionality
 */
function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show the appropriate content
            const contentId = tab.getAttribute('data-content');
            const content = document.getElementById(contentId);
            if (content) {
                content.style.display = 'block';
                
                // Load data for this tab
                loadTabData(contentId);
            }
        });
    });
}

/**
 * Load admin data based on active tab
 */
function loadAdminData() {
    // Find the active tab
    const activeTab = document.querySelector('.admin-tab.active');
    if (activeTab) {
        const contentId = activeTab.getAttribute('data-content');
        loadTabData(contentId);
    }
}

/**
 * Load data for specific admin tab
 * @param {string} tabId - ID of the tab content to load data for
 */
function loadTabData(tabId) {
    switch (tabId) {
        case 'users-content':
            loadUsers();
            break;
        case 'referrals-content':
            loadAllReferrals();
            break;
        case 'redemptions-content':
            loadAllRedemptions();
            break;
        case 'rewards-content':
            loadRewards();
            break;
        case 'ads-content':
            loadAdsAdmin();
            break;
    }
}

/**
 * Load all users for the admin panel
 */
function loadUsers() {
    fetch('/api/admin/users')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/auth';
                    return;
                }
                throw new Error('Failed to load users');
            }
            return response.json();
        })
        .then(users => {
            const userTableBody = document.getElementById('users-table-body');
            if (!userTableBody) return;
            
            if (users.length === 0) {
                // No users yet
                userTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">No users found.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with users
            userTableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                
                // Format the date
                const date = new Date(user.createdAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
                
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.points} points</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-action-btn edit-user-btn" data-user-id="${user.id}">Edit</button>
                        <button class="btn btn-sm btn-danger admin-action-btn delete-user-btn" data-user-id="${user.id}">Delete</button>
                    </td>
                `;
                
                userTableBody.appendChild(row);
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-user-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    openEditUserModal(userId);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    confirmDeleteUser(userId);
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Show error message in table
            const userTableBody = document.getElementById('users-table-body');
            if (userTableBody) {
                userTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">Error loading users. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Open modal for editing a user
 * @param {string} userId - ID of the user to edit
 */
function openEditUserModal(userId) {
    // First, fetch the user details
    fetch(`/api/admin/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load user details');
            }
            return response.json();
        })
        .then(user => {
            // Set up the modal
            const modalTitle = document.querySelector('#edit-modal .modal-title');
            const modalBody = document.querySelector('#edit-modal .modal-body');
            
            if (modalTitle && modalBody) {
                modalTitle.textContent = `Edit User: ${user.username}`;
                
                // Create the edit form
                modalBody.innerHTML = `
                    <form id="edit-user-form">
                        <input type="hidden" name="userId" value="${user.id}">
                        <div class="form-group">
                            <label for="edit-username">Username</label>
                            <input type="text" id="edit-username" name="username" class="form-control" value="${user.username}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email" name="email" class="form-control" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-points">Points</label>
                            <input type="number" id="edit-points" name="points" class="form-control" value="${user.points}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-is-admin">Admin Status</label>
                            <select id="edit-is-admin" name="isAdmin" class="form-control">
                                <option value="0" ${user.isAdmin ? '' : 'selected'}>Regular User</option>
                                <option value="1" ${user.isAdmin ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </form>
                `;
                
                // Update the footer buttons
                const modalFooter = document.querySelector('#edit-modal .modal-footer');
                if (modalFooter) {
                    modalFooter.innerHTML = `
                        <button type="button" class="btn btn-secondary" onclick="closeModal('edit-modal')">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-user-btn">Save Changes</button>
                    `;
                    
                    // Add event listener to save button
                    document.getElementById('save-user-btn').addEventListener('click', function() {
                        saveUserChanges();
                    });
                }
                
                // Show the modal
                showModal('edit-modal');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message, 'error');
        });
}

/**
 * Save changes to a user
 */
function saveUserChanges() {
    const form = document.getElementById('edit-user-form');
    
    if (!form) return;
    
    // Get form data
    const userId = form.querySelector('[name="userId"]').value;
    const username = form.querySelector('[name="username"]').value;
    const email = form.querySelector('[name="email"]').value;
    const points = form.querySelector('[name="points"]').value;
    const isAdmin = form.querySelector('[name="isAdmin"]').value === '1';
    
    // Validate form
    if (!username || !email || !points) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('save-user-btn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Send update request
    fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            email,
            points: parseInt(points),
            isAdmin
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to update user');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('edit-modal');
        
        // Show success message
        showToast('User updated successfully', 'success');
        
        // Reload users
        loadUsers();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    });
}

/**
 * Confirm deletion of a user
 * @param {string} userId - ID of the user to delete
 */
function confirmDeleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        deleteUser(userId);
    }
}

/**
 * Delete a user
 * @param {string} userId - ID of the user to delete
 */
function deleteUser(userId) {
    fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to delete user');
            });
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('User deleted successfully', 'success');
        
        // Reload users
        loadUsers();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
    });
}

/**
 * Load all referrals for admin view
 */
function loadAllReferrals() {
    fetch('/api/admin/referrals')
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
                        <td colspan="5" class="text-center">No referrals found.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with referrals
            referralTableBody.innerHTML = '';
            referrals.forEach(referral => {
                const row = document.createElement('tr');
                
                // Format the date
                const date = new Date(referral.createdAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
                
                row.innerHTML = `
                    <td>${referral.id}</td>
                    <td>${referral.referrerUsername}</td>
                    <td>${referral.referredUsername}</td>
                    <td>${referral.pointsAwarded}</td>
                    <td>${formattedDate}</td>
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
                        <td colspan="5" class="text-center">Error loading referrals. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Load all redemptions for admin view
 */
function loadAllRedemptions() {
    fetch('/api/admin/redemptions')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load redemptions');
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
                        <td colspan="8" class="text-center">No redemptions found.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with redemptions
            redemptionTableBody.innerHTML = '';
            redemptions.forEach(redemption => {
                const row = document.createElement('tr');
                
                // Format the date
                const date = new Date(redemption.createdAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
                
                // Determine actions based on status
                let actions = '';
                if (redemption.status === 'pending') {
                    actions = `
                        <button class="btn btn-sm btn-success admin-action-btn approve-redemption-btn" data-id="${redemption.id}">Approve</button>
                        <button class="btn btn-sm btn-danger admin-action-btn reject-redemption-btn" data-id="${redemption.id}">Reject</button>
                    `;
                } else {
                    actions = `<span class="badge ${redemption.status === 'approved' ? 'bg-success' : 'bg-danger'}">${redemption.status}</span>`;
                }
                
                row.innerHTML = `
                    <td>${redemption.id}</td>
                    <td>${redemption.username}</td>
                    <td>${redemption.rewardName}</td>
                    <td>${redemption.pointsCost}</td>
                    <td>${redemption.email}</td>
                    <td>${redemption.country || 'Not specified'}</td>
                    <td>${formattedDate}</td>
                    <td>${actions}</td>
                `;
                
                redemptionTableBody.appendChild(row);
            });
            
            // Add event listeners for approve buttons
            document.querySelectorAll('.approve-redemption-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const redemptionId = this.getAttribute('data-id');
                    updateRedemptionStatus(redemptionId, 'approved');
                });
            });
            
            // Add event listeners for reject buttons
            document.querySelectorAll('.reject-redemption-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const redemptionId = this.getAttribute('data-id');
                    updateRedemptionStatus(redemptionId, 'rejected');
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
                        <td colspan="8" class="text-center">Error loading redemptions. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Update redemption status
 * @param {string} redemptionId - ID of the redemption
 * @param {string} status - New status ('approved' or 'rejected')
 */
function updateRedemptionStatus(redemptionId, status, giftCardCode = null, notes = null) {
    // For approvals, if no gift card code has been provided, show the gift card code modal
    if (status === 'approved' && !giftCardCode) {
        openGiftCardCodeModal(redemptionId);
        return;
    }

    // Prepare request data
    const requestData = { status };
    if (giftCardCode) requestData.giftCardCode = giftCardCode;
    if (notes) requestData.notes = notes;

    fetch(`/api/admin/redemptions/${redemptionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || `Failed to ${status} redemption`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast(`Redemption ${status} successfully`, 'success');
        
        // Close any open modals
        closeModal('view-redemption-modal');
        closeModal('gift-card-code-modal');
        
        // Reload redemptions
        loadAllRedemptions();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
    });
}

/**
 * Opens the gift card code modal for approving a redemption
 * @param {string} redemptionId - ID of the redemption
 */
function openGiftCardCodeModal(redemptionId) {
    // Clear previous code
    document.getElementById('gift-card-code').value = '';
    document.getElementById('gift-card-notes').value = '';
    
    // Set up submit button
    const submitButton = document.getElementById('submit-gift-card-code');
    submitButton.onclick = function() {
        const giftCardCode = document.getElementById('gift-card-code').value.trim();
        const notes = document.getElementById('gift-card-notes').value.trim();
        
        if (!giftCardCode) {
            showToast('Please enter a gift card code', 'error');
            return;
        }
        
        updateRedemptionStatus(redemptionId, 'approved', giftCardCode, notes);
    };
    
    // Show the modal
    showModal('gift-card-code-modal');
}

/**
 * Load rewards for admin view
 */
function loadRewards() {
    fetch('/api/admin/rewards')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load rewards');
            }
            return response.json();
        })
        .then(rewards => {
            const rewardTableBody = document.getElementById('rewards-table-body');
            if (!rewardTableBody) return;
            
            if (rewards.length === 0) {
                // No rewards yet
                rewardTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No rewards found.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with rewards
            rewardTableBody.innerHTML = '';
            rewards.forEach(reward => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${reward.id}</td>
                    <td>${reward.name}</td>
                    <td>${reward.description}</td>
                    <td>${reward.pointsCost}</td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-action-btn edit-reward-btn" data-id="${reward.id}">Edit</button>
                        <button class="btn btn-sm btn-danger admin-action-btn delete-reward-btn" data-id="${reward.id}">Delete</button>
                    </td>
                `;
                
                rewardTableBody.appendChild(row);
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-reward-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const rewardId = this.getAttribute('data-id');
                    openEditRewardModal(rewardId);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-reward-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const rewardId = this.getAttribute('data-id');
                    confirmDeleteReward(rewardId);
                });
            });
            
            // Add event listener for add reward button
            const addRewardBtn = document.getElementById('add-reward-btn');
            if (addRewardBtn) {
                addRewardBtn.addEventListener('click', openAddRewardModal);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Show error message in table
            const rewardTableBody = document.getElementById('rewards-table-body');
            if (rewardTableBody) {
                rewardTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Error loading rewards. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Open modal for adding a new reward
 */
function openAddRewardModal() {
    // Set up the modal
    const modalTitle = document.querySelector('#edit-modal .modal-title');
    const modalBody = document.querySelector('#edit-modal .modal-body');
    
    if (modalTitle && modalBody) {
        modalTitle.textContent = 'Add New Reward';
        
        // Create the add form
        modalBody.innerHTML = `
            <form id="add-reward-form">
                <div class="form-group">
                    <label for="reward-name">Reward Name</label>
                    <input type="text" id="reward-name" name="name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="reward-description">Description</label>
                    <textarea id="reward-description" name="description" class="form-control" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="reward-points">Points Cost</label>
                    <input type="number" id="reward-points" name="pointsCost" class="form-control" required>
                </div>
            </form>
        `;
        
        // Update the footer buttons
        const modalFooter = document.querySelector('#edit-modal .modal-footer');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" onclick="closeModal('edit-modal')">Cancel</button>
                <button type="button" class="btn btn-primary" id="add-reward-submit-btn">Add Reward</button>
            `;
            
            // Add event listener to add button
            document.getElementById('add-reward-submit-btn').addEventListener('click', function() {
                addReward();
            });
        }
        
        // Show the modal
        showModal('edit-modal');
    }
}

/**
 * Add a new reward
 */
function addReward() {
    const form = document.getElementById('add-reward-form');
    
    if (!form) return;
    
    // Get form data
    const name = form.querySelector('[name="name"]').value;
    const description = form.querySelector('[name="description"]').value;
    const pointsCost = form.querySelector('[name="pointsCost"]').value;
    
    // Validate form
    if (!name || !description || !pointsCost) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const addBtn = document.getElementById('add-reward-submit-btn');
    const originalText = addBtn.textContent;
    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    // Send add request
    fetch('/api/admin/rewards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description,
            pointsCost: parseInt(pointsCost)
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to add reward');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('edit-modal');
        
        // Show success message
        showToast('Reward added successfully', 'success');
        
        // Reload rewards
        loadRewards();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
        
        // Reset button
        addBtn.disabled = false;
        addBtn.textContent = originalText;
    });
}

/**
 * Open modal for editing a reward
 * @param {string} rewardId - ID of the reward to edit
 */
function openEditRewardModal(rewardId) {
    // First, fetch the reward details
    fetch(`/api/admin/rewards/${rewardId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load reward details');
            }
            return response.json();
        })
        .then(reward => {
            // Set up the modal
            const modalTitle = document.querySelector('#edit-modal .modal-title');
            const modalBody = document.querySelector('#edit-modal .modal-body');
            
            if (modalTitle && modalBody) {
                modalTitle.textContent = `Edit Reward: ${reward.name}`;
                
                // Create the edit form
                modalBody.innerHTML = `
                    <form id="edit-reward-form">
                        <input type="hidden" name="rewardId" value="${reward.id}">
                        <div class="form-group">
                            <label for="edit-reward-name">Reward Name</label>
                            <input type="text" id="edit-reward-name" name="name" class="form-control" value="${reward.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-reward-description">Description</label>
                            <textarea id="edit-reward-description" name="description" class="form-control" rows="3" required>${reward.description}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-reward-points">Points Cost</label>
                            <input type="number" id="edit-reward-points" name="pointsCost" class="form-control" value="${reward.pointsCost}" required>
                        </div>
                    </form>
                `;
                
                // Update the footer buttons
                const modalFooter = document.querySelector('#edit-modal .modal-footer');
                if (modalFooter) {
                    modalFooter.innerHTML = `
                        <button type="button" class="btn btn-secondary" onclick="closeModal('edit-modal')">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-reward-btn">Save Changes</button>
                    `;
                    
                    // Add event listener to save button
                    document.getElementById('save-reward-btn').addEventListener('click', function() {
                        saveRewardChanges();
                    });
                }
                
                // Show the modal
                showModal('edit-modal');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message, 'error');
        });
}

/**
 * Save changes to a reward
 */
function saveRewardChanges() {
    const form = document.getElementById('edit-reward-form');
    
    if (!form) return;
    
    // Get form data
    const rewardId = form.querySelector('[name="rewardId"]').value;
    const name = form.querySelector('[name="name"]').value;
    const description = form.querySelector('[name="description"]').value;
    const pointsCost = form.querySelector('[name="pointsCost"]').value;
    
    // Validate form
    if (!name || !description || !pointsCost) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('save-reward-btn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Send update request
    fetch(`/api/admin/rewards/${rewardId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description,
            pointsCost: parseInt(pointsCost)
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to update reward');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('edit-modal');
        
        // Show success message
        showToast('Reward updated successfully', 'success');
        
        // Reload rewards
        loadRewards();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    });
}

/**
 * Confirm deletion of a reward
 * @param {string} rewardId - ID of the reward to delete
 */
function confirmDeleteReward(rewardId) {
    if (confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
        deleteReward(rewardId);
    }
}

/**
 * Delete a reward
 * @param {string} rewardId - ID of the reward to delete
 */
function deleteReward(rewardId) {
    fetch(`/api/admin/rewards/${rewardId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to delete reward');
            });
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('Reward deleted successfully', 'success');
        
        // Reload rewards
        loadRewards();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
    });
}

/**
 * Load ads for admin view
 */
function loadAdsAdmin() {
    fetch('/api/admin/ads')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load ads');
            }
            return response.json();
        })
        .then(ads => {
            const adTableBody = document.getElementById('ads-table-body');
            if (!adTableBody) return;
            
            if (ads.length === 0) {
                // No ads yet
                adTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">No ads found.</td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with ads
            adTableBody.innerHTML = '';
            ads.forEach(ad => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${ad.id}</td>
                    <td>${ad.name}</td>
                    <td>${ad.adCode.substring(0, 50)}...</td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-action-btn edit-ad-btn" data-id="${ad.id}">Edit</button>
                        <button class="btn btn-sm btn-danger admin-action-btn delete-ad-btn" data-id="${ad.id}">Delete</button>
                    </td>
                `;
                
                adTableBody.appendChild(row);
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-ad-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const adId = this.getAttribute('data-id');
                    openEditAdModal(adId);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-ad-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const adId = this.getAttribute('data-id');
                    confirmDeleteAd(adId);
                });
            });
            
            // Add event listener for add ad button
            const addAdBtn = document.getElementById('add-ad-btn');
            if (addAdBtn) {
                addAdBtn.addEventListener('click', openAddAdModal);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Show error message in table
            const adTableBody = document.getElementById('ads-table-body');
            if (adTableBody) {
                adTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">Error loading ads. Please try again.</td>
                    </tr>
                `;
            }
        });
}

/**
 * Open modal for adding a new ad
 */
function openAddAdModal() {
    // Set up the modal
    const modalTitle = document.querySelector('#edit-modal .modal-title');
    const modalBody = document.querySelector('#edit-modal .modal-body');
    
    if (modalTitle && modalBody) {
        modalTitle.textContent = 'Add New Ad';
        
        // Create the add form
        modalBody.innerHTML = `
            <form id="add-ad-form">
                <div class="form-group">
                    <label for="ad-name">Ad Name</label>
                    <input type="text" id="ad-name" name="name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="ad-code">Ad Code</label>
                    <textarea id="ad-code" name="adCode" class="form-control" rows="5" required></textarea>
                    <small class="text-muted">Enter the HTML/JS code for this ad.</small>
                </div>
            </form>
        `;
        
        // Update the footer buttons
        const modalFooter = document.querySelector('#edit-modal .modal-footer');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" onclick="closeModal('edit-modal')">Cancel</button>
                <button type="button" class="btn btn-primary" id="add-ad-submit-btn">Add Ad</button>
            `;
            
            // Add event listener to add button
            document.getElementById('add-ad-submit-btn').addEventListener('click', function() {
                addAd();
            });
        }
        
        // Show the modal
        showModal('edit-modal');
    }
}

/**
 * Add a new ad
 */
function addAd() {
    const form = document.getElementById('add-ad-form');
    
    if (!form) return;
    
    // Get form data
    const name = form.querySelector('[name="name"]').value;
    const adCode = form.querySelector('[name="adCode"]').value;
    
    // Validate form
    if (!name || !adCode) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const addBtn = document.getElementById('add-ad-submit-btn');
    const originalText = addBtn.textContent;
    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    // Send add request
    fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            adCode
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to add ad');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('edit-modal');
        
        // Show success message
        showToast('Ad added successfully', 'success');
        
        // Reload ads
        loadAdsAdmin();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
        
        // Reset button
        addBtn.disabled = false;
        addBtn.textContent = originalText;
    });
}

/**
 * Open modal for editing an ad
 * @param {string} adId - ID of the ad to edit
 */
function openEditAdModal(adId) {
    // First, fetch the ad details
    fetch(`/api/admin/ads/${adId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load ad details');
            }
            return response.json();
        })
        .then(ad => {
            // Set up the modal
            const modalTitle = document.querySelector('#edit-modal .modal-title');
            const modalBody = document.querySelector('#edit-modal .modal-body');
            
            if (modalTitle && modalBody) {
                modalTitle.textContent = `Edit Ad: ${ad.name}`;
                
                // Create the edit form
                modalBody.innerHTML = `
                    <form id="edit-ad-form">
                        <input type="hidden" name="adId" value="${ad.id}">
                        <div class="form-group">
                            <label for="edit-ad-name">Ad Name</label>
                            <input type="text" id="edit-ad-name" name="name" class="form-control" value="${ad.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-ad-code">Ad Code</label>
                            <textarea id="edit-ad-code" name="adCode" class="form-control" rows="5" required>${ad.adCode}</textarea>
                            <small class="text-muted">Enter the HTML/JS code for this ad.</small>
                        </div>
                    </form>
                `;
                
                // Update the footer buttons
                const modalFooter = document.querySelector('#edit-modal .modal-footer');
                if (modalFooter) {
                    modalFooter.innerHTML = `
                        <button type="button" class="btn btn-secondary" onclick="closeModal('edit-modal')">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-ad-btn">Save Changes</button>
                    `;
                    
                    // Add event listener to save button
                    document.getElementById('save-ad-btn').addEventListener('click', function() {
                        saveAdChanges();
                    });
                }
                
                // Show the modal
                showModal('edit-modal');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message, 'error');
        });
}

/**
 * Save changes to an ad
 */
function saveAdChanges() {
    const form = document.getElementById('edit-ad-form');
    
    if (!form) return;
    
    // Get form data
    const adId = form.querySelector('[name="adId"]').value;
    const name = form.querySelector('[name="name"]').value;
    const adCode = form.querySelector('[name="adCode"]').value;
    
    // Validate form
    if (!name || !adCode) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('save-ad-btn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Send update request
    fetch(`/api/admin/ads/${adId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            adCode
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to update ad');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('edit-modal');
        
        // Show success message
        showToast('Ad updated successfully', 'success');
        
        // Reload ads
        loadAdsAdmin();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    });
}

/**
 * Confirm deletion of an ad
 * @param {string} adId - ID of the ad to delete
 */
function confirmDeleteAd(adId) {
    if (confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
        deleteAd(adId);
    }
}

/**
 * Delete an ad
 * @param {string} adId - ID of the ad to delete
 */
function deleteAd(adId) {
    fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to delete ad');
            });
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('Ad deleted successfully', 'success');
        
        // Reload ads
        loadAdsAdmin();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message, 'error');
    });
}
