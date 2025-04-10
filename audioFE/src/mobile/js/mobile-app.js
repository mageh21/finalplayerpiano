// Import the MusicXML Player
import { MusicXMLPlayer } from '../../build/musicxml-player.js';

// Initialize the player
const player = new MusicXMLPlayer();

// DOM Elements
const practiceCounter = document.querySelector('.stats-counter');
const progressBar = document.querySelector('.progress');

// Initialize practice time
let practiceTime = 0;
let practiceInterval;

// Update practice time
function updatePracticeTime() {
    practiceTime++;
    practiceCounter.textContent = practiceTime;
    
    // Update progress bar (assuming weekly goal is 60 minutes)
    const progress = (practiceTime / 60) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

// Handle navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
    });
});

// Handle playlist selection
document.querySelectorAll('.playlist-item').forEach(item => {
    item.addEventListener('click', () => {
        // Add selection effect
        document.querySelectorAll('.playlist-item').forEach(pl => pl.classList.remove('selected'));
        item.classList.add('selected');
    });
});

// Initialize the practice timer when a song starts playing
function startPracticeTimer() {
    if (!practiceInterval) {
        practiceInterval = setInterval(updatePracticeTime, 60000); // Update every minute
    }
}

// Stop the practice timer when a song stops playing
function stopPracticeTimer() {
    if (practiceInterval) {
        clearInterval(practiceInterval);
        practiceInterval = null;
    }
}

// Export for testing
export { player, startPracticeTimer, stopPracticeTimer }; 