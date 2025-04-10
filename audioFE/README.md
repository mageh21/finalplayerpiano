# Music Mobile

A web-based MusicXML player with mobile support and PDF conversion capabilities. This application allows you to view and play MusicXML files, convert PDFs to MusicXML, and provides both web and mobile interfaces.

## Features

- MusicXML file viewing and playback
- PDF to MusicXML conversion
- MIDIano piano roll visualization for MIDI files
- Mobile-friendly interface
- Real-time music notation rendering
- MIDI playback support
- Responsive design for both desktop and mobile

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mageh21/music_mobile.git
cd music_mobile
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

The application consists of two parts: the web version and the mobile version. Both can be run simultaneously using the following commands:

### Build the Application
```bash
npm run build
```

### Create Symbolic Link for MJS File
After building, create a symbolic link from musicxml-player.js to musicxml-player.mjs:
```bash
cd build
ln -sf musicxml-player.js musicxml-player.mjs
cd ..
```

### Copy Manifest File to Root Directory
Ensure the manifest.json file is accessible from the root:
```bash
cp public/manifest.json .
```

### Start Both Web and Mobile Servers
```bash
npm start
```

This will start:
- Web version at http://localhost:8080
- Mobile version at http://localhost:8081

### Running Separately

To run only the web version:
```bash
npm run demo:develop
```

To run only the mobile version:
```bash
npm run mobile
```

## Troubleshooting

If you encounter 404 errors for resources like `musicxml-player.css`, `musicxml-player.mjs`, or `manifest.json`, follow these steps:

1. Check if the build process created the correct files:
   - The application expects `musicxml-player.css` and `musicxml-player.mjs` in the `/build` directory
   - Verify files exist in the build directory with `ls -la build/`

2. If you see files named `index.js` and `player.css` instead of the expected names:
   - Update the `esbuild.mjs` file to use correct output filenames:
     - Change `entryNames: '[name]'` to `entryNames: 'musicxml-player'`
     - Change `assetNames: '[name]'` to `assetNames: 'musicxml-player'`

3. For the `.mjs` extension requirement:
   - Create a symbolic link: `ln -sf musicxml-player.js musicxml-player.mjs` in the build directory

4. For manifest.json errors:
   - Copy the file from public directory: `cp public/manifest.json .`

5. After making these changes, run the build and start commands again:
   ```bash
   npm run build
   npm start
   ```

## Development

### Directory Structure
- `/src` - Source code
  - `/mobile` - Mobile interface code
  - `/js` - JavaScript/TypeScript source files
- `/demo` - Web interface demo
- `/build` - Built files
- `/data` - Sample music files and assets

### Testing
Run the test suite:
```bash
npm test
```

Run linting:
```bash
npm run test:lint
```

## Usage

1. Web Version (http://localhost:8080):
   - Upload MusicXML files directly
   - Convert PDF files to MusicXML
   - Play and view music notation
   - Adjust playback settings

2. Mobile Version (http://localhost:8081):
   - Touch-optimized interface
   - Responsive music notation display
   - Mobile-friendly controls
   - Gesture support for navigation

## MIDIano Player

MIDIano is an integrated MIDI player that offers a piano roll visualization of MIDI files. Access it directly from the main application.

### Features
- Interactive piano roll visualization with falling notes
- MIDI file playback with SoundFont support
- Play, pause, and stop controls
- Master volume adjustment
- Tracks view for individual track management
- MIDI setup for external device connections

### How to Use MIDIano
1. **Access MIDIano**: Navigate to the MIDI Player option from the main navigation menu or go directly to http://localhost:8080/midiano/index.html

2. **Loading MIDI Files**:
   - Click the home icon in the top-left corner to return to the main app
   - Use the "Upload MIDI" button to select and load a MIDI file from your device
   - Alternatively, use the "Loaded Songs" button to select from previously loaded files

3. **Playback Controls**:
   - Play: Start playback of the loaded MIDI file
   - Pause: Temporarily stop playback while maintaining position
   - Stop: Completely stop playback and return to the beginning

4. **Volume Control**:
   - Use the volume slider in the top-right corner to adjust the master volume
   - The percentage value shows the current volume level

5. **Tracks Management**:
   - Click the "Tracks" button to view and manage individual MIDI tracks
   - Toggle tracks on/off to customize which parts are played and displayed

6. **MIDI Setup**:
   - Use the "MIDI-Setup" button to configure MIDI input devices 
   - Connect external MIDI keyboards or controllers for interactive play-along

7. **Performance Indicators**:
   - The BPM (Beats Per Minute) is displayed in the piano roll view
   - Current time position is shown in the format 00:00.00 / Total Duration

8. **Keyboard Interaction**:
   - The virtual piano at the bottom responds to played notes
   - Keys light up when played by the MIDI file or by connected MIDI devices

### Integrating with the MusicXML Player
MIDIano complements the main MusicXML player by providing:
- An alternative visualization focused on piano roll and keyboard
- Support for standard MIDI files which may not be available in MusicXML format
- Interactive piano keyboard display for learning and performance
- Different perspective on the same musical content when both MusicXML and MIDI versions are available

You can switch between the MusicXML notation view and MIDIano's piano roll view depending on your preferences for learning or performing music.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
