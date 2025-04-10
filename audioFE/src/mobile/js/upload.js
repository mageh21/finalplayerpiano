// Import the MusicXML Player and API Service
import { MusicXMLPlayer } from '../../../build/musicxml-player.js';
import { ApiService } from '../../../src/ApiService.js';

// Initialize the player
const player = new MusicXMLPlayer();

// DOM Elements
const addButton = document.getElementById('add-button');
const uploadModal = document.getElementById('upload-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const uploadOptions = document.querySelectorAll('.upload-option');
const songList = document.querySelector('.song-list'); // For adding new songs to the list

// Create error toast container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

// Error handling function
function showError(message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        <button class="close-toast">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add slide-in animation
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });
    
    // Close button handler
    toast.querySelector('.close-toast').addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

function removeToast(toast) {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
        if (toast.parentElement === toastContainer) {
            toastContainer.removeChild(toast);
        }
    }, 300); // Match transition duration
}

// Modal Functionality
function openModal() {
    console.log('Opening modal from upload.js');
    uploadModal.classList.add('active');
    setTimeout(() => {
        document.body.style.overflow = 'hidden';
    }, 300);
}

function closeModal() {
    console.log('Closing modal');
    uploadModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Add button click event - we'll handle this with direct inline JS
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up add button in upload.js');
    if (addButton) {
        // Remove any existing event listeners (doesn't work directly but helps avoid duplicates in future)
        addButton.replaceWith(addButton.cloneNode(true));
        
        // Get the new button after replacing
        const newAddButton = document.getElementById('add-button');
        
        if (newAddButton) {
            console.log('Add button found and will be set up');
            newAddButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Add button clicked from upload.js');
                openModal();
                return false;
            });
        }
    }
});

// Close modal when clicking overlay
if (modalOverlay) {
    modalOverlay.addEventListener('click', function() {
        closeModal();
    });
}

// Prevent clicks inside modal from closing it
if (uploadModal && uploadModal.querySelector('.modal-content')) {
    uploadModal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Handle file upload options
if (uploadOptions) {
    uploadOptions.forEach(option => {
        const subscribeBtn = option.querySelector('.subscribe-btn');
        
        option.addEventListener('click', async function() {
            const optionId = option.getAttribute('id');
            console.log('Upload option clicked:', optionId);
            try {
                await handleUploadOption(optionId, subscribeBtn);
            } catch (error) {
                showError(error.message);
            }
        });
        
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Subscribe clicked');
            });
        }
    });
}

// Handle different upload options
function handleUploadOption(optionId, subscribeBtn) {
    switch (optionId) {
        case 'take-photo':
            // Logic for camera access
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(function(stream) {
                        console.log('Camera access granted');
                        // Implement camera functionality
                    })
                    .catch(function(err) {
                        console.log('Error accessing camera: ', err);
                    });
            }
            break;
            
        case 'upload-photo':
            createFileInput('image/*', handlePhotoUpload);
            break;
            
        case 'upload-pdf':
            createFileInput('application/pdf', handlePdfUpload);
            break;
            
        case 'upload-musicxml':
            createFileInput('.xml,.musicxml,application/xml', handleMusicXmlUpload);
            break;
    }
}

// Create and trigger file input
function createFileInput(accept, callback) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = accept;
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', callback);
    document.body.appendChild(fileInput);
    fileInput.click();
    
    // Remove the input after selection
    setTimeout(() => {
        document.body.removeChild(fileInput);
    }, 5000);
}

// File handlers with error handling
async function handlePdfUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 4 * 1024 * 1024) {
        showError('File too large. Maximum size is 4MB.');
        return;
    }
    
    try {
        await processPdfUpload(file);
    } catch (error) {
        showError(error.message);
    }
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 4 * 1024 * 1024) { // 4MB limit
        processImageUpload(file);
    } else {
        alert('File too large. Maximum size is 4MB.');
    }
}

function handleMusicXmlUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 4 * 1024 * 1024) { // 4MB limit
        processMusicXmlUpload(file);
    } else {
        alert('File too large. Maximum size is 4MB.');
    }
}

// Process uploads with API integration
async function processPdfUpload(file) {
    console.log('Processing PDF upload:', file.name);
    try {
        const blob = await ApiService.convertFile(file);
        console.log('PDF processed successfully');
        closeModal();
        return blob;
    } catch (error) {
        console.error('PDF processing failed:', error);
        throw error; // Re-throw to be caught by the handler
    }
}

function processImageUpload(file) {
    console.log('Processing image upload:', file.name);
    // Use API to process image upload
    uploadToAPI('image', file);
}

function processMusicXmlUpload(file) {
    console.log('Processing MusicXML upload:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Attempt to load MusicXML content
            const xmlContent = e.target.result;
            player.loadMusicXMLString(xmlContent);
            console.log('MusicXML loaded successfully');
            
            // Also upload to API
            uploadToAPI('musicxml', file);
            
            // Close modal after successful upload
            closeModal();
        } catch (error) {
            console.error('Error loading MusicXML:', error);
            alert('Invalid MusicXML file. Please check the file and try again.');
        }
    };
    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
}

// Function to get songs from library.js
function getSongsFromGallery() {
    // Try to access songs from library.js if available
    if (window.galleryAPI && window.galleryAPI.getSongs && window.galleryAPI.renderSongs) {
        return {
            songs: window.galleryAPI.getSongs(),
            renderSongs: window.galleryAPI.renderSongs
        };
    }
    
    // Fallback if gallery API is not available
    return {
        songs: [],
        renderSongs: function() {
            console.log('Gallery render function not available');
        }
    };
}

// Upload to API with proper error handling
async function uploadToAPI(type, file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const response = await fetch(`${ApiService.API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText} (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Upload success:', data);
        closeModal();
        
        // Add the new song to the list
        addSongToList({
            id: 'uploaded-' + Date.now(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Uploaded',
            thumbnail: 'assets/defaults/default-cover.jpg',
            difficulty: 'medium',
            isPremium: false,
            instruments: ['piano'],
            genre: 'other',
            isNew: true
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Error uploading file. Please try again.');
    }
}

// Debug logging
console.log('Upload module loaded');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded in upload.js');
    console.log('Add button available:', !!addButton);
    console.log('Upload modal available:', !!uploadModal);
    console.log('Modal overlay available:', !!modalOverlay);
    console.log('Upload options available:', uploadOptions?.length);
    
    // Add direct click handler to the plus button in the DOM
    document.querySelector('a#add-button').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Direct add button click handler');
        openModal();
    });
    
    // Add test debug button 
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Test Upload Modal';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '100px';
    debugButton.style.right = '20px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '10px';
    debugButton.style.background = '#00BFA5';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    
    debugButton.addEventListener('click', function() {
        console.log('Debug button clicked');
        openModal();
    });
    
    document.body.appendChild(debugButton);
});

// Add CSS for error toast
const style = document.createElement('style');
style.textContent = `
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
    }
    
    .error-toast {
        display: flex;
        align-items: center;
        background: #ff5252;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transform: translateX(100%);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    .error-icon {
        margin-right: 12px;
        font-size: 20px;
    }
    
    .error-message {
        flex-grow: 1;
        margin-right: 12px;
    }
    
    .close-toast {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .close-toast:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style); 