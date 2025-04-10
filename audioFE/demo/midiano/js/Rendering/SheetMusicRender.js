import { Factory, StaveNote, Accidental, Voice, Formatter, Annotation, Barline } from 'vexflow';
import { CONST } from "../data/CONST.js"; // Import CONST for MIDI_NOTE_TO_KEY

export class SheetMusicRender {
    constructor(containerId) {
        // No-op constructor
        console.log("SheetMusicRender disabled as requested");
    }

    init() {
        // Silently handle missing container - no warnings needed
        return;
    }

    render(songData, currentTime, bpm, timeSignature) {
        // No-op function
        return;
    }

    // Helper function to convert MIDI note number to VexFlow key string
    midiNoteToVexflowKey(noteNumber) {
        // No-op function
        return null;
    }

    resize(width) {
        // No-op function
        return;
    }
} 