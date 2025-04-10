import { Factory, StaveNote, Accidental, Voice, Formatter, Annotation, Barline } from 'vexflow';
import { CONST } from "../data/CONST.js"; // Import CONST for MIDI_NOTE_TO_KEY

export class SheetMusicRender {
    constructor(containerId) {
        this.containerId = containerId;
        this.vf = null;
        this.context = null;
        this.stave = null;
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Sheet music container #${this.containerId} not found.`);
            return;
        }
        // Clear previous content if any
        container.innerHTML = '';

        // Create VexFlow Factory
        this.vf = new Factory({
            renderer: { 
                elementId: this.containerId, 
                width: container.offsetWidth, 
                height: 200 // Initial height, adjust as needed
            }
        });
        this.context = this.vf.getContext();

        // Basic stave setup (example)
        this.stave = this.vf.Stave(10, 40, container.offsetWidth - 20); // x, y, width
        this.stave.addClef("treble").addTimeSignature("4/4");
        this.stave.setEndBarType(Barline.type.SINGLE); // Use imported Barline
        this.stave.setContext(this.context).draw();

        console.log("VexFlow initialized for sheet music.");
    }

    render(songData, currentTime, bpm, timeSignature) {
        if (!this.vf || !songData || currentTime === undefined) {
            return; 
        }

        this.context.clear(); 
        this.stave.draw();

        // --- Basic Note Conversion (Pitch AND Duration) ---
        const notesToDraw = [];
        const currentTimeMillis = currentTime * 1000;
        const timeWindowStart = currentTime - 0.5; // Look slightly behind
        const timeWindowEnd = currentTime + 4; // Look ahead a few seconds

        const notesInWindow = songData.getNotes(timeWindowStart, timeWindowEnd) || [];
        // Alternative if getNotesInTimeWindow doesn't exist:
        // Iterate through songData.notesBySeconds or songData.getNoteSequence()

        console.log(`[SheetMusic] Time: ${currentTime.toFixed(2)}, Notes in Window: ${notesInWindow.length}`); // DEBUG LOG

        notesInWindow.forEach(note => {
            const key = this.midiNoteToVexflowKey(note.noteNumber);
            if (key) {
                let vexDuration = 'q'; // Declare outside the try block with a default
                try {
                    vexDuration = this.midiDurationToVexflowDuration(note.duration, bpm, timeSignature);
                    const isPlaying = currentTimeMillis >= note.timestamp && currentTimeMillis < note.offTime;

                    const vfNote = this.vf.StaveNote({
                        keys: [key],
                        duration: vexDuration
                    });

                    // Add accidental if needed
                    if (key.includes("#") || key.includes("b")) {
                        const accidentalType = key.includes("#") ? "#" : "b";
                        vfNote.addAccidental(0, this.vf.Accidental({ type: accidentalType }));
                    }

                    // Add Note Name Annotation
                    const noteNameOnly = this.midiNoteToVexflowKey(note.noteNumber)?.split('/')[0]?.replace(/[0-9]/g, '').toUpperCase();
                    if (noteNameOnly) {
                         // Explicitly create annotation via factory
                         const annotation = this.vf.Annotation({ text: noteNameOnly, vJustify: 'below' });
                         vfNote.addModifier(annotation, 0);
                    }

                    // Highlight if playing
                    if (isPlaying) {
                        vfNote.setStyle({ fillStyle: "red", strokeStyle: "red" }); // Example highlight style
                    }

                    notesToDraw.push(vfNote);
                } catch (e) {
                    console.warn("VexFlow error creating note:", key, vexDuration, e);
                }
            }
        });

        console.log(`[SheetMusic] Notes to Draw: ${notesToDraw.length}`); // DEBUG LOG

        // --- Format and Draw --- 
        if (notesToDraw.length > 0) {
             try {
                // Attempt to format and draw - might fail if durations don't fit measure
                // Use time signature from song data
                const beats = timeSignature.numerator || 4;
                const beatValue = timeSignature.denominator || 4;
                const voice = this.vf.Voice({ num_beats: beats, beat_value: beatValue });
                voice.setStrict(false); // Allow potentially overflowing measures for now
                voice.addTickables(notesToDraw);
                
                // Create a formatter and format the notes
                const formatter = this.vf.Formatter();
                formatter.joinVoices([voice]).format([voice], this.stave.width - 50); // Adjust width as needed

                // Draw the voice
                voice.draw(this.context, this.stave);
            } catch(e) {
                console.error("VexFlow formatting/drawing error:", e)
                // Clear notes if formatting fails badly
                this.context.clear(); 
                this.stave.draw();
            }
        }
        // --- End Note Conversion ---
    }

    // New helper function to convert milliseconds to VexFlow duration string
    midiDurationToVexflowDuration(durationMillis, bpm, timeSignature) {
        if (!bpm || bpm <= 0) bpm = 120; // Default BPM if invalid
        const beatsPerMinute = bpm;
        const quarterNoteMillis = (60 * 1000) / beatsPerMinute;

        // Calculate duration in terms of quarter notes
        const durationInQuarterNotes = durationMillis / quarterNoteMillis;

        // Find the closest VexFlow duration (simplistic approach)
        // Based on powers of 2 relative to a whole note (4 quarter notes)
        // TODO: This needs refinement for dotted notes, ties, triplets etc.
        const durations = {
            'w': 4, // Whole
            'h': 2, // Half
            'q': 1, // Quarter
            '8': 0.5, // 8th
            '16': 0.25, // 16th
            '32': 0.125 // 32nd
        };

        let closestDurationCode = 'q'; // Default to quarter
        let minDiff = Infinity;

        for (const code in durations) {
            const diff = Math.abs(durations[code] - durationInQuarterNotes);
            if (diff < minDiff) {
                minDiff = diff;
                closestDurationCode = code;
            }
        }
        // Basic dot check (if duration is ~1.5x a standard duration)
        const standardDurationValue = durations[closestDurationCode];
        if (Math.abs(durationInQuarterNotes - standardDurationValue * 1.5) < standardDurationValue * 0.25) { 
            return closestDurationCode + 'd'; // Add 'd' for dotted
        }


        return closestDurationCode;
    }

    // Helper function to convert MIDI note number to VexFlow key string
    midiNoteToVexflowKey(noteNumber) {
        if (!CONST || !CONST.MIDI_NOTE_TO_KEY) {
            console.error("CONST.MIDI_NOTE_TO_KEY is not defined!");
            return null;
        }
        // Add the + 21 offset back (as determined necessary earlier)
        const keyData = CONST.MIDI_NOTE_TO_KEY[noteNumber + 21]; 
        if (!keyData) return null;

        const noteName = keyData.slice(0, -1); // e.g., "C#", "D", "Eb"
        const octave = keyData.slice(-1);

        // Convert to VexFlow format (e.g., "c#/4", "d/4", "eb/4")
        let vexKey = noteName.toLowerCase() + "/" + octave;
        return vexKey;
    }

    resize(width) {
        if(this.vf) {
            console.log("Resizing sheet music container.");
            // Re-initialize to handle resize correctly for now
            this.init(); 
        }
    }
} 