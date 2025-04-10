# MusicXML and MIDI Player Application

A comprehensive web-based application for playing and visualizing musical scores in both MusicXML and MIDI formats.

## Overview

This application provides two integrated players:
1. **MusicXML Player** - For playing and visualizing MusicXML sheet music with soundfont support
2. **MIDIano MIDI Player** - For MIDI file playback with piano roll visualization

## Features

### MusicXML Player
- Upload and play MusicXML files (.musicxml, .mxl, .xml)
- Sample scores included
- Instrument selection from 128 General MIDI instruments
- Tempo, pitch, and tuning controls
- Beautiful sheet music rendering
- PDF score conversion capabilities

### MIDIano MIDI Player
- Upload and play MIDI files with piano roll visualization
- Falling notes display with accurate timing
- Playback controls with speed adjustment
- Customizable appearance settings
- Keyboard visualization

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```
git clone https://github.com/mageh21/music_mobile.git
cd music_mobile
```

2. Install dependencies:
```
cd audioFE
npm install
```

## Running the Application

There are two ways to start the application:

### Method 1: Using the start script (Recommended)

From the root directory, run:
```
./start.sh
```

This will:
1. Check if ports 8080 and 8081 are in use
2. Offer to kill any conflicting processes
3. Start both servers concurrently

### Method 2: Using npm directly

```
cd audioFE
npm run start
```

Either method will start two web servers:
- Main application server on port 8080
- Mobile interface server on port 8081

The application will be accessible at:
- Main application: http://localhost:8080/
- MIDIano player: http://localhost:8080/midiano/index.html
- Mobile interface: http://localhost:8081/

## Usage

### MusicXML Player (Home)
1. Open http://localhost:8080/ in your web browser
2. Upload a MusicXML file using the "Upload MusicXML File" button or select one of the sample scores
3. Use the playback controls at the bottom to play, pause, and rewind
4. Adjust tempo, pitch, and tuning as needed
5. Select different instruments from the dropdown menu

### MIDIano Player
1. Click on "MIDI Player" in the navigation menu
2. Upload a MIDI file using the "Choose MIDI File" button
3. Use the playback controls to control playback
4. Adjust the playback speed using the slider
5. Return to the main application using the "Back to Home" button in the top right

### Mobile Interface
1. Open http://localhost:8081/ on your mobile device (ensure your device is on the same network)
2. Browse the library of available music
3. Upload and play your own music files
4. Navigate through the mobile-optimized interface

## Technical Details

The application consists of two main components:
1. **MusicXML Player**: Built with custom JavaScript renderer and SoundFont support
2. **MIDIano Player**: Integrated from the MIDIano project

The application uses a simple web server (local-web-server) to serve both components:
- Demo server (port 8080): Serves the main application with MIDIano integration
- Mobile server (port 8081): Serves the mobile-optimized interface

## Server Configuration

The servers are configured in the package.json file:
```json
"scripts": {
  "demo:develop": "ws -d demo --rewrite '/mma/(.*) -> http://localhost:3000/$1' -p ${PORT:-8080}",
  "mobile": "ws -d src/mobile -p ${PORT:-8081}",
  "start": "concurrently \"npm run demo:develop\" \"npm run mobile\""
}
```

## Troubleshooting

### Port already in use
If you see "EADDRINUSE" errors when starting the application:
1. Use the start.sh script which will offer to kill conflicting processes
2. Or manually kill the processes:
```
lsof -i :8080 -i :8081 | grep LISTEN
kill -9 [PID]  # Replace [PID] with the process IDs from the output above
```

### Audio not playing
1. Make sure your browser is not muted
2. Try clicking on the page first (some browsers require user interaction before playing audio)
3. Check browser console for errors
4. Allow autoplay in your browser settings

### MIDI Player not loading
1. Check the browser console for any JavaScript errors
2. Try refreshing the page
3. Ensure all dependencies are installed correctly

## License

This project is licensed under the MIT License.

## Credits

- MIDIano MIDI Player: Piano roll visualization and MIDI playback
- Custom MusicXML implementation for sheet music rendering and audio playback 