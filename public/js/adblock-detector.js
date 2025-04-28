/**
 * Adblock detector
 * Detects if the user has an adblocker active and displays a warning message
 */
function detectAdblock() {
    // Create a bait element
    const bait = document.createElement('div');
    bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner';
    bait.style.cssText = 'position: absolute; left: -999em; top: -999em; width: 1px; height: 1px;';
    document.body.appendChild(bait);
    
    // Check if the bait is hidden (which would indicate an adblocker)
    setTimeout(function() {
        let isAdblockActive = false;
        
        // Get bait element style
        const baitStyle = window.getComputedStyle(bait);
        
        // Check if adblock might be active
        if (baitStyle.getPropertyValue('display') === 'none' || 
            baitStyle.getPropertyValue('visibility') === 'hidden' ||
            baitStyle.getPropertyValue('opacity') === '0') {
            isAdblockActive = true;
        }
        
        // Remove the bait element
        document.body.removeChild(bait);
        
        // Show warning if adblock is detected
        if (isAdblockActive) {
            showAdblockWarning();
        }
    }, 100);
}

/**
 * Shows adblock warning message
 */
function showAdblockWarning() {
    // Find adblock warning element
    const warningElement = document.querySelector('.adblock-warning');
    
    // Create one if it doesn't exist
    if (!warningElement) {
        const warning = document.createElement('div');
        warning.className = 'adblock-warning show';
        warning.innerHTML = `
            <strong>Adblock Detected!</strong> Our website is supported by displaying online advertisements. 
            Please consider disabling your ad blocker on our website to support us!
            <button class="btn btn-sm btn-warning ml-3" id="dismiss-adblock">Dismiss</button>
        `;
        
        // Insert warning at the top of the main content
        const mainContent = document.querySelector('main') || document.querySelector('.container');
        if (mainContent) {
            mainContent.insertBefore(warning, mainContent.firstChild);
            
            // Add event listener to dismiss button
            const dismissBtn = document.getElementById('dismiss-adblock');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', function() {
                    warning.style.display = 'none';
                });
            }
        }
    } else {
        // Show the existing warning
        warningElement.classList.add('show');
    }
}
