// Import CSS files for Webpack to bundle
import '../css/bootstrap.min.css';
import '../css/bootstrap-theme.min.css';
import '../css/nano.min.css'; // pickr theme
import '../css/Interface.css';
import '../css/Inputs.css';
import '../css/Settings.css';

import { Render } from "./Rendering/Render.js"
import { UI } from "./ui/UI.js"
import { InputListeners } from "./InputListeners.js"
import { getPlayer, getPlayerState } from "./player/Player.js"
import { loadJson } from "./Util.js"
import { FileLoader } from "./player/FileLoader.js"
import { setSetting, getSetting } from "./settings/Settings.js"

/**
 *
 *
 * TODOs:
 *
 * UI:
 * - Accessability
 * - Mobile
 * - Load from URL / circumvent CORS.. Extension?
 * - channel menu
 * - added song info to "loaded songs"
 * - fix the minimize button
 * - Fix fullscreen on mobile
 *
 * Audio
 * - Figure out how to handle different ADSR envelopes / release times for instruments
 * - implement control messages for
 * 		- sostenuto pedal
 * 			- only keys that are pressed while pedal is hit are sustained
 * 		- soft pedal
 * 			- how does that affect sound?
 * - implement pitch shift
 * - settings for playalong:
 * 		- accuracy needed
 * 		- different modes
 *
 * MISC
 * - add starting songs from piano-midi
 * - make instrument choosable for tracks
 * - Metronome
 * - Update readme - new screenshot, install/ run instructions
 * - Choose License
 * -
 * -
 *
 *
 *
 * bugs:
 * - Fix iOS
 * - too long notes disappear too soon
 */
let ui
let loading = false
let listeners
let render

// Setup message handler for communication with parent window
window.addEventListener('message', function(event) {
	const message = event.data;
	
	if (!message || !message.action) return;
	
	console.log('Received message:', message.action);
	
	switch(message.action) {
		case 'loadMIDI':
			if (message.data && message.data.buffer) {
				loading = true;
				notifyParent('loading');
				
				const arrayBuffer = message.data.buffer;
				const fileName = message.data.fileName || 'Unknown MIDI';
				
				// Load the MIDI file
				getPlayer().loadSong(arrayBuffer, fileName, fileName);
				loading = false;
				notifyParent('loaded');
			}
			break;
			
		case 'play':
			getPlayer().play();
			notifyParent('playing');
			break;
			
		case 'pause':
			getPlayer().pause();
			notifyParent('paused');
			break;
			
		case 'stop':
			getPlayer().stop();
			notifyParent('stopped');
			break;
			
		case 'setTempo':
			if (message.data && message.data.tempo) {
				getPlayer().setSpeed(message.data.tempo);
			}
			break;
	}
});

// Function to notify parent window of status changes
function notifyParent(status) {
	if (window.parent !== window) {
		window.parent.postMessage({
			type: 'playerStatus',
			status: status
		}, '*');
	}
}

window.onload = async function () {
	await init()
	loading = false
	
	// Notify parent that player is ready
	notifyParent('ready')
	
	// Home button is now handled directly in the HTML file
	// No need to call setupHomeButton() anymore
}

async function init() {
	render = new Render()
	ui = new UI(render)
	listeners = new InputListeners(ui, render)
	
	// Explicitly disable metronome when the app initializes
	if (typeof setSetting === 'function') {
		setSetting("enableMetronome", false);
		console.log("Metronome disabled in init");
	}
	
	renderLoop()

	// Load a default song quietly
	loadStartingSong()

	// Set up player state change listeners
	const player = getPlayer()
	
	// Create a wrapper for player methods to notify parent
	const originalPlay = player.play
	player.play = function() {
		originalPlay.call(player)
		notifyParent('playing')
	}
	
	const originalPause = player.pause
	player.pause = function() {
		originalPause.call(player)
		notifyParent('paused')
	}
	
	const originalStop = player.stop
	player.stop = function() {
		originalStop.call(player)
		notifyParent('stopped')
	}

	loadJson("./js/data/exampleSongs.json", json =>
		ui.setExampleSongs(JSON.parse(json))
	)
}

function renderLoop() {
	render.render(getPlayerState())
	window.requestAnimationFrame(renderLoop)
}

async function loadStartingSong() {
	let url = "sample.mid" // Set URL to the local file

	FileLoader.loadSongFromURL(url, (response, fileName) =>
		getPlayer().loadSong(response, fileName, "Sample MIDI File") // Update song title
	) // Local: "../mz_331_3.mid")
}
