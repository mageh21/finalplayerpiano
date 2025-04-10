# MIDIano - MIDI Player with Piano Roll and Sheet Music

MIDIano is a web-based MIDI player that visualizes MIDI files using an interactive piano roll and basic sheet music display. It allows users to load MIDI files, view the notes playing on a virtual keyboard and falling notes display, and see the corresponding musical notation.

## Features

*   **MIDI Playback:** Loads and plays standard MIDI files (.mid).
*   **Piano Roll Visualization:** Displays MIDI notes as falling blocks over a piano keyboard.
*   **Sheet Music Display (Basic):** Renders basic musical notation for the loaded MIDI file using VexFlow.
    *   Shows note pitches and calculated durations.
    *   Highlights currently playing notes.
*   **Interactive Controls:** Play, pause, stop, volume control, and track selection (basic).
*   **SoundFont Support:** Uses SoundFonts (like Musyng Kite) for audio playback.
*   **MIDI Input (Setup):** Includes setup for handling MIDI input devices (functionality may vary).

## Technologies Used

*   **JavaScript (ES6+ Modules):** Core application logic.
*   **HTML5 Canvas:** For rendering the piano roll and sheet music.
*   **VexFlow:** Library for rendering musical notation.
*   **Node.js:** Required for the development environment and build process.
*   **npm:** Package management.
*   **Webpack:** Used to bundle JavaScript modules and CSS for the browser.
*   **(Potentially others based on your `package.json`)**

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mageh21/midi_plyaer.git
    cd midi_plyaer
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Building

This project uses Webpack to bundle its assets. To build the project after making changes to the source files (like in the `js/` directory), run:

```bash
npm run build
```

This will generate the necessary files (e.g., `dist/bundle.js`) in the `dist/` directory.

## Running

After building the project, you can run it by opening the `index.html` file in your web browser.

For the best experience and to avoid potential issues with file loading (like CORS), it's recommended to use a simple local web server:

1.  **Using `npx` (no installation needed):**
    ```bash
    npx http-server .
    ```
2.  **Using Python's built-in server (if Python is installed):**
    *   Python 3: `python -m http.server`
    *   Python 2: `python -m SimpleHTTPServer`

Then, navigate to the local address provided by the server (usually `http://localhost:8080` or similar) in your browser.

## Contributing

_(Optional: Add guidelines if you want others to contribute)_

## License

_(Optional: Add a license, e.g., MIT, Apache 2.0)_