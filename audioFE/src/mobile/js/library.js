// Import the MusicXML Player
import { MusicXMLPlayer } from '../../../build/musicxml-player.js';

// Initialize the player
const player = new MusicXMLPlayer();

// DOM Elements
const searchInput = document.querySelector('.search-bar input');
const filterTabs = document.querySelectorAll('.filter-tab');
const songList = document.querySelector('.song-list');
const instrumentButton = document.querySelector('.filter-tab.instrument');

// Song data structure
const songs = [
    {
        id: 'eine-kleine',
        title: 'Eine Kleine Nachtmusik',
        artist: 'W. A. Mozart',
        thumbnail: 'assets/defaults/mozart.jpg',
        difficulty: 'easy',
        isPremium: true,
        instruments: ['piano'],
        genre: 'classic',
        isNew: false
    },
    {
        id: 'happy-birthday',
        title: 'Happy Birthday',
        artist: 'Traditional',
        thumbnail: 'assets/defaults/default-cover.jpg',
        difficulty: 'easy',
        isPremium: false,
        instruments: ['violin'],
        genre: 'traditional',
        isNew: true
    },
    {
        id: 'lagrimas',
        title: 'Lágrimas Negras',
        artist: 'Miguel Matamoros',
        thumbnail: 'assets/defaults/default-cover.jpg',
        difficulty: 'medium',
        isPremium: false,
        instruments: ['violin'],
        genre: 'jazz',
        isNew: true
    },
    {
        id: 'london-bridge',
        title: 'London Bridge Is Falling Down',
        artist: 'Traditional',
        thumbnail: 'assets/defaults/default-cover.jpg',
        difficulty: 'easy',
        isPremium: false,
        instruments: ['violin'],
        genre: 'traditional',
        isNew: true
    }
];

// Current filters
let currentFilter = 'all';
let currentInstrument = 'all';
let searchQuery = '';

// Filter songs based on current criteria
function filterSongs() {
    return songs.filter(song => {
        // Search query
        const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            song.artist.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Genre filter
        const matchesGenre = currentFilter === 'all' || song.genre === currentFilter.toLowerCase();
        
        // Instrument filter
        const matchesInstrument = currentInstrument === 'all' || 
                                song.instruments.includes(currentInstrument.toLowerCase());
        
        return matchesSearch && matchesGenre && matchesInstrument;
    });
}

// Render song list
function renderSongs() {
    const filteredSongs = filterSongs();
    songList.innerHTML = filteredSongs.map(song => `
        <div class="song-item" data-id="${song.id}">
            <img src="${song.thumbnail}" alt="${song.title}" class="song-thumbnail" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' viewBox=\\'0 0 80 80\\'><rect width=\\'80\\' height=\\'80\\' fill=\\'%23eaeaea\\'/><text x=\\'40\\' y=\\'40\\' font-family=\\'Arial\\' font-size=\\'10\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' fill=\\'%23333\\'>${song.title[0]}${song.artist[0]}</text></svg>'">
            <div class="song-details">
                <div class="song-badges">
                    ${song.isNew ? '<span class="badge new">NEW</span>' : ''}
                    <span class="badge ${song.difficulty}">${song.difficulty.toUpperCase()}</span>
                    ${song.isPremium ? `
                        <span class="badge premium">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                            </svg>
                        </span>
                    ` : ''}
                    ${song.instruments.map(instrument => `
                        <span class="badge ${instrument}">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="${instrument === 'piano' ? 
                                    'M20,3H4A1,1 0 0,0 3,4V20A1,1 0 0,0 4,21H20A1,1 0 0,0 21,20V4A1,1 0 0,0 20,3M20,19H4V4H20V19M6,5H8V15H6V5M10,5H12V15H10V5M14,5H16V15H14V5M18,5H20V15H18V5M6,17H8V19H6V17M10,17H12V19H10V17M14,17H16V19H14V17M18,17H20V19H18V17Z' : 
                                    'M21,3V15.5A3.5,3.5 0 0,1 17.5,19A3.5,3.5 0 0,1 14,15.5A3.5,3.5 0 0,1 17.5,12C18.04,12 18.55,12.12 19,12.34V6.47L9,8.6V17.5A3.5,3.5 0 0,1 5.5,21A3.5,3.5 0 0,1 2,17.5A3.5,3.5 0 0,1 5.5,14C6.04,14 6.55,14.12 7,14.34V6L21,3Z'}"/>
                            </svg>
                        </span>
                    `).join('')}
                </div>
                <h3 class="song-title">${song.title}</h3>
                <p class="song-artist">${song.artist}</p>
            </div>
        </div>
    `).join('');
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSongs();
});

filterTabs.forEach(tab => {
    if (!tab.classList.contains('instrument')) {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.textContent.toLowerCase();
            renderSongs();
        });
    }
});

// Instrument dropdown (to be implemented)
instrumentButton.addEventListener('click', () => {
    // Toggle instrument selection menu
    console.log('Instrument selection clicked');
});

// Song selection
songList.addEventListener('click', (e) => {
    const songItem = e.target.closest('.song-item');
    if (songItem) {
        const songId = songItem.dataset.id;
        const song = songs.find(s => s.id === songId);
        if (song) {
            if (song.isPremium) {
                // Show premium upgrade dialog
                console.log('Premium song clicked:', song.title);
            } else {
                // Load and play the song
                console.log('Playing song:', song.title);
                // player.loadMusicXML(`/songs/${songId}.musicxml`);
            }
        }
    }
});

// Initial render
renderSongs();

// Export API for upload.js to use
window.galleryAPI = {
    getSongs: function() {
        return songs;
    },
    renderSongs: renderSongs
};

// Debug logging 
console.log('Gallery module loaded'); 