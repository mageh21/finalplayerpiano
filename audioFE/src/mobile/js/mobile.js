// Mobile-specific functionality for MusicXML Player

// Constants
const MOBILE_BREAKPOINT = 768;
const LANDSCAPE_HEIGHT = 600;

// Mobile detection
const isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.iOS());
    }
};

// Mobile-specific event handlers
document.addEventListener('DOMContentLoaded', () => {
    if (isMobile.any()) {
        initializeMobileView();
        setupTouchEvents();
        handleOrientationChange();
    }
});

// Initialize mobile-specific view adjustments
function initializeMobileView() {
    const sheetContainer = document.getElementById('sheet-container');
    const player = document.getElementById('player');
    
    // Adjust container heights for mobile
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        sheetContainer.style.height = `calc(100vh - ${player.offsetHeight}px - 180px)`;
    }

    // Enable mobile-specific controls
    setupMobileControls();
}

// Setup touch events for mobile interaction
function setupTouchEvents() {
    const sheetContainer = document.getElementById('sheet-container');
    let startX, startY, initialScale = 1;

    // Touch events for pan and zoom
    sheetContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialScale = getCurrentScale();
            e.preventDefault();
        } else if (e.touches.length === 1) {
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
        }
    });

    sheetContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            handlePinchZoom(e, initialScale);
        } else if (e.touches.length === 1) {
            handlePan(e, startX, startY);
        }
    });
}

// Handle orientation changes
function handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            initializeMobileView();
            adjustNotationSize();
        }, 100);
    });
}

// Setup mobile-specific controls
function setupMobileControls() {
    // Add mobile-specific UI elements
    const controlsContainer = document.querySelector('.controls-grid');
    if (!controlsContainer.querySelector('.mobile-controls')) {
        const mobileControls = document.createElement('div');
        mobileControls.className = 'mobile-controls';
        mobileControls.innerHTML = `
            <button id="fullscreenBtn" class="control-btn">
                <i class="fas fa-expand"></i>
            </button>
            <button id="resetZoomBtn" class="control-btn">
                <i class="fas fa-search"></i>
            </button>
        `;
        controlsContainer.appendChild(mobileControls);

        // Setup fullscreen toggle
        document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
        document.getElementById('resetZoomBtn').addEventListener('click', resetZoom);
    }
}

// Helper functions
function getCurrentScale() {
    const sheet = document.querySelector('.system');
    if (!sheet) return 1;
    const transform = window.getComputedStyle(sheet).transform;
    const matrix = new DOMMatrix(transform);
    return matrix.a;
}

function handlePinchZoom(e, initialScale) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const dist = Math.hypot(
        touch2.pageX - touch1.pageX,
        touch2.pageY - touch1.pageY
    );

    const sheet = document.querySelector('.system');
    if (!sheet) return;

    const newScale = Math.min(Math.max(initialScale * (dist / initialDist), 0.5), 2);
    sheet.style.transform = `scale(${newScale})`;
}

function handlePan(e, startX, startY) {
    const container = document.getElementById('sheet-container');
    const deltaX = e.touches[0].pageX - startX;
    const deltaY = e.touches[0].pageY - startY;

    container.scrollLeft -= deltaX;
    container.scrollTop -= deltaY;

    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function resetZoom() {
    const sheet = document.querySelector('.system');
    if (sheet) {
        sheet.style.transform = 'scale(0.9)';
    }
}

function adjustNotationSize() {
    const sheet = document.querySelector('.system');
    if (sheet) {
        const scale = window.innerWidth <= MOBILE_BREAKPOINT ? 0.9 : 1;
        sheet.style.transform = `scale(${scale})`;
    }
}

// Export mobile functionality
export {
    isMobile,
    initializeMobileView,
    setupTouchEvents,
    handleOrientationChange,
    setupMobileControls
}; 