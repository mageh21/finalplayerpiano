import { AudioContext } from 'standardized-audio-context';
import Soundfont from 'soundfont-player';
import type {
  IMidiFile,
  IMidiProgramChangeEvent,
  IMidiNoteOnEvent,
  IMidiNoteOffEvent,
} from 'midi-json-parser-worker';
import { setTimeout } from 'worker-timers';
import type { IMidiOutput } from 'midi-player';
import { parseMidiEvent } from './helpers';

// Using the gleitz soundfont CDN which has FluidR3_GM soundfonts
const SOUNDFONT_HOST = 'https://gleitz.github.io/midi-js-soundfonts';

interface SoundfontInstrument {
  play(note: string, when: number, options: { gain: number }): () => void;
}

type InstrumentMap = Record<number, {
  instrument?: SoundfontInstrument;
  programNumber: number;
  name: string;
}>;

// GM instrument names mapping
const GM_INSTRUMENTS = [
  'acoustic_grand_piano', 'bright_acoustic_piano', 'electric_grand_piano', 'honkytonk_piano',
  'electric_piano_1', 'electric_piano_2', 'harpsichord', 'clavinet',
  'celesta', 'glockenspiel', 'music_box', 'vibraphone',
  'marimba', 'xylophone', 'tubular_bells', 'dulcimer',
  'drawbar_organ', 'percussive_organ', 'rock_organ', 'church_organ',
  'reed_organ', 'accordion', 'harmonica', 'tango_accordion',
  'acoustic_guitar_nylon', 'acoustic_guitar_steel', 'electric_guitar_jazz', 'electric_guitar_clean',
  'electric_guitar_muted', 'overdriven_guitar', 'distortion_guitar', 'guitar_harmonics',
  'acoustic_bass', 'electric_bass_finger', 'electric_bass_pick', 'fretless_bass',
  'slap_bass_1', 'slap_bass_2', 'synth_bass_1', 'synth_bass_2',
  'violin', 'viola', 'cello', 'contrabass',
  'tremolo_strings', 'pizzicato_strings', 'orchestral_harp', 'timpani',
  'string_ensemble_1', 'string_ensemble_2', 'synth_strings_1', 'synth_strings_2',
  'choir_aahs', 'voice_oohs', 'synth_choir', 'orchestra_hit',
  'trumpet', 'trombone', 'tuba', 'muted_trumpet',
  'french_horn', 'brass_section', 'synth_brass_1', 'synth_brass_2',
  'soprano_sax', 'alto_sax', 'tenor_sax', 'baritone_sax',
  'oboe', 'english_horn', 'bassoon', 'clarinet',
  'piccolo', 'flute', 'recorder', 'pan_flute',
  'blown_bottle', 'shakuhachi', 'whistle', 'ocarina',
  'lead_1_square', 'lead_2_sawtooth', 'lead_3_calliope', 'lead_4_chiff',
  'lead_5_charang', 'lead_6_voice', 'lead_7_fifths', 'lead_8_bass_lead',
  'pad_1_new_age', 'pad_2_warm', 'pad_3_polysynth', 'pad_4_choir',
  'pad_5_bowed', 'pad_6_metallic', 'pad_7_halo', 'pad_8_sweep',
  'fx_1_rain', 'fx_2_soundtrack', 'fx_3_crystal', 'fx_4_atmosphere',
  'fx_5_brightness', 'fx_6_goblins', 'fx_7_echoes', 'fx_8_sci_fi',
  'sitar', 'banjo', 'shamisen', 'koto',
  'kalimba', 'bagpipe', 'fiddle', 'shanai',
  'tinkle_bell', 'agogo', 'steel_drums', 'woodblock',
  'taiko_drum', 'melodic_tom', 'synth_drum', 'reverse_cymbal',
  'guitar_fret_noise', 'breath_noise', 'seashore', 'bird_tweet',
  'telephone_ring', 'helicopter', 'applause', 'gunshot'
];

type Note = {
  channel: number;
  pitch: number;
  velocity: number;
  timestamp: number;
  stop: () => void;
};

export class SoundFontOutput implements IMidiOutput {
  protected _audioContext: AudioContext;
  protected _instruments: InstrumentMap;
  protected _activeNotes: Array<Note>;

  constructor(midiJson: IMidiFile) {
    // @ts-ignore - AudioContext types mismatch between libraries
    this._audioContext = new AudioContext();
    this._instruments = {};
    this._activeNotes = [];

    // Scan the MIDI for program change events and prepare instruments
    midiJson.tracks.forEach(track => {
      const pc = track.find(e => 'programChange' in e) as IMidiProgramChangeEvent | undefined;
      if (pc) {
        this._instruments[pc.channel] = {
          programNumber: pc.programChange.programNumber,
          name: GM_INSTRUMENTS[pc.programChange.programNumber]
        };
      }
    });
  }

  async initialize() {
    if (this._audioContext.state !== 'running') {
      await this._audioContext.resume();
    }

    console.log('Initializing SoundFontOutput with audio context:', this._audioContext.state);
    console.log('Loading instruments:', Object.entries(this._instruments).map(([ , data]) => `${data.name} (${data.programNumber})`));

    // Load all required instruments
    await Promise.all(
      Object.entries(this._instruments).map(async ([channel, data]) => {
        try {
          console.log(`Starting to load instrument: ${data.name} (program ${data.programNumber})`);
          // Convert instrument name to the correct format (e.g., "xylophone" -> "xylophone")
          const instrumentName = data.name.toLowerCase();
          const soundfontUrl = `${SOUNDFONT_HOST}/FluidR3_GM/${instrumentName}-mp3/instrument.js`;
          console.log(`Attempting to load FluidR3_GM soundfont from: ${soundfontUrl}`);
          
          // First try loading from FluidR3_GM
          // @ts-ignore - Soundfont types are not complete
          const instrument = await Soundfont.instrument(this._audioContext, instrumentName, {
            soundfont: 'FluidR3_GM',
            format: 'mp3',
            gain: 5.0,      // Increased gain for better volume
            attack: 0.001,  // Very fast attack for percussive instruments
            decay: 0.8,     // Moderate decay
            sustain: 0.2,   // Lower sustain for percussive instruments
            release: 0.4,   // Faster release for percussive instruments
            destination: this._audioContext.destination,
            hostname: SOUNDFONT_HOST + '/FluidR3_GM'
          });
          
          // @ts-ignore - Soundfont types are not complete
          this._instruments[Number(channel)].instrument = instrument;
          console.log(`Successfully loaded instrument: ${data.name} with FluidR3_GM`);
        } catch (error) {
          console.error(`Failed to load FluidR3_GM instrument: ${data.name}`, error);
          try {
            console.log(`Attempting to load from MusyngKite for ${data.name}`);
            // @ts-ignore - Soundfont types are not complete
            const instrument = await Soundfont.instrument(this._audioContext, instrumentName, {
              soundfont: 'MusyngKite',
              gain: 5.0,
              attack: 0.001,
              decay: 0.8,
              sustain: 0.2,
              release: 0.4,
              destination: this._audioContext.destination,
              hostname: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite'
            });
            // @ts-ignore - Soundfont types are not complete
            this._instruments[Number(channel)].instrument = instrument;
            console.log(`Successfully loaded fallback instrument: ${data.name} with MusyngKite`);
          } catch (fallbackError) {
            console.error(`Failed to load fallback instrument: ${data.name}`, fallbackError);
          }
        }
      })
    );
  }

  clear() {
    // Call each note's stop function directly
    for (const note of this._activeNotes) {
      try {
        if (typeof note.stop === 'function') {
          note.stop();
        }
      } catch (error) {
        console.warn('Failed to stop note:', error);
      }
    }
    this._activeNotes = [];
    
    // Also suspend the audio context to ensure all sound stops
    if (this._audioContext.state === 'running') {
      this._audioContext.suspend().catch(error => {
        console.warn('Failed to suspend audio context:', error);
      });
    }
  }

  send(data: number[] | Uint8Array, timestamp: number) {
    const event = parseMidiEvent(data);
    if ('noteOn' in event) {
      this._noteOn(event as IMidiNoteOnEvent, timestamp);
    } else if ('noteOff' in event) {
      this._noteOff(event as IMidiNoteOffEvent, timestamp);
    }
  }

  protected _noteOn(event: IMidiNoteOnEvent, timestamp: number) {
    const instrument = this._instruments[event.channel]?.instrument;
    if (!instrument) return;

    const delay = (timestamp - performance.now()) / 1000;
    const midiNote = event.noteOn.noteNumber.toString();
    const stop = instrument.play(
      midiNote,
      this._audioContext.currentTime + delay,
      { gain: event.noteOn.velocity / 127 }
    );

    this._activeNotes.push({
      channel: event.channel,
      pitch: event.noteOn.noteNumber,
      velocity: event.noteOn.velocity,
      timestamp,
      stop
    });
  }

  protected _noteOff(event: IMidiNoteOffEvent, timestamp: number) {
    const noteIndex = this._activeNotes.findIndex(
      note => note.pitch === event.noteOff.noteNumber && note.channel === event.channel
    );

    if (noteIndex >= 0) {
      const note = this._activeNotes[noteIndex];
      const delay = (timestamp - performance.now()) / 1000;
      
      // Schedule the note to stop
      setTimeout(() => {
        try {
          if (typeof note.stop === 'function') {
            note.stop();
          }
        } catch (error) {
          console.warn('Failed to stop note:', error);
        }
        this._activeNotes.splice(noteIndex, 1);
      }, delay * 1000);
    }
  }
} 