/**
 * Simple MIDI writer that converts a MIDI JSON object to a binary MIDI file.
 * This implementation is based on the specification at https://www.midi.org/specifications/file-format-specifications/standard-midi-files
 */

// Convert string to UTF-8 byte array
function stringToBytes(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    bytes[i] = utf8.charCodeAt(i);
  }
  return bytes;
}

// Convert an integer to a variable-length quantity
function intToVLQ(value) {
  if (value < 0) {
    throw new Error("Cannot encode negative values");
  }
  
  if (value === 0) {
    return new Uint8Array([0]);
  }
  
  const bytes = [];
  let v = value;
  
  while (v > 0) {
    let b = v & 0x7f;
    v >>= 7;
    if (v > 0) {
      b |= 0x80;
    }
    bytes.push(b);
  }
  
  return new Uint8Array(bytes.reverse());
}

// Write an unsigned 16-bit integer (big endian)
function writeUint16(value) {
  return new Uint8Array([
    (value >> 8) & 0xff,
    value & 0xff
  ]);
}

// Write an unsigned 32-bit integer (big endian)
function writeUint32(value) {
  return new Uint8Array([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff
  ]);
}

// Combine multiple Uint8Arrays into one
function concatBytes(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

// Write a MIDI header chunk
function writeHeaderChunk(format, tracks, division) {
  const chunkId = stringToBytes("MThd");
  const chunkSize = writeUint32(6); // Header chunks are always 6 bytes
  const formatBytes = writeUint16(format);
  const tracksBytes = writeUint16(tracks);
  const divisionBytes = writeUint16(division);
  
  return concatBytes(chunkId, chunkSize, formatBytes, tracksBytes, divisionBytes);
}

// Write a MIDI track chunk
function writeTrackChunk(events) {
  const trackEvents = [];
  let runningStatus = null;
  
  // Make sure events is iterable
  if (!events || !Array.isArray(events)) {
    // Handle track without events or with different structure
    // Create a minimal track with just end of track event
    return concatBytes(
      stringToBytes("MTrk"),
      writeUint32(4),
      new Uint8Array([0x00, 0xff, 0x2f, 0x00])
    );
  }
  
  // Process each event
  for (const event of events) {
    // Write delta time
    trackEvents.push(intToVLQ(event.delta || 0));
    
    // Handle meta events
    if (event.type === 'meta') {
      trackEvents.push(new Uint8Array([0xff, event.subtype]));
      const data = event.data instanceof Uint8Array ? event.data : 
                  (typeof event.data === 'string' ? stringToBytes(event.data) : new Uint8Array(event.data));
      trackEvents.push(intToVLQ(data.length));
      trackEvents.push(data);
    }
    // Handle channel events
    else if (event.type === 'channel') {
      const statusByte = (event.subtype << 4) | (event.channel & 0x0f);
      
      // If the status byte is different from the running status, write it
      if (statusByte !== runningStatus) {
        trackEvents.push(new Uint8Array([statusByte]));
        runningStatus = statusByte;
      }
      
      // Write the event data
      switch (event.subtype) {
        case 0x8: // Note off
        case 0x9: // Note on
          trackEvents.push(new Uint8Array([event.noteNumber & 0x7f, event.velocity & 0x7f]));
          break;
        case 0xa: // Note aftertouch
          trackEvents.push(new Uint8Array([event.noteNumber & 0x7f, event.amount & 0x7f]));
          break;
        case 0xb: // Controller
          trackEvents.push(new Uint8Array([event.controllerType & 0x7f, event.value & 0x7f]));
          break;
        case 0xc: // Program change
          trackEvents.push(new Uint8Array([event.programNumber & 0x7f]));
          break;
        case 0xd: // Channel aftertouch
          trackEvents.push(new Uint8Array([event.amount & 0x7f]));
          break;
        case 0xe: // Pitch bend
          const value = event.value + 0x2000; // Convert from -8192-8191 to 0-16383
          trackEvents.push(new Uint8Array([value & 0x7f, (value >> 7) & 0x7f]));
          break;
      }
    }
    // Handle system exclusive events
    else if (event.type === 'sysex') {
      trackEvents.push(new Uint8Array([0xf0]));
      const data = event.data instanceof Uint8Array ? event.data : new Uint8Array(event.data);
      trackEvents.push(intToVLQ(data.length + 1)); // +1 for the terminating 0xf7
      trackEvents.push(data);
      trackEvents.push(new Uint8Array([0xf7]));
    }
  }
  
  // Add end of track event if not present
  const hasEndOfTrack = events.some(e => e.type === 'meta' && e.subtype === 0x2f);
  if (!hasEndOfTrack) {
    trackEvents.push(new Uint8Array([0x00, 0xff, 0x2f, 0x00]));
  }
  
  // Combine all events
  const trackData = concatBytes(...trackEvents);
  
  // Create track chunk
  const chunkId = stringToBytes("MTrk");
  const chunkSize = writeUint32(trackData.length);
  
  return concatBytes(chunkId, chunkSize, trackData);
}

/**
 * Convert a MIDI JSON object to a binary MIDI file
 * @param {Object} midiJson - The MIDI JSON object
 * @return {Blob} - The binary MIDI file as a Blob
 */
export async function writeMidiFile(midiJson) {
  // Verify the incoming object is valid
  if (!midiJson) {
    throw new Error("No MIDI data provided");
  }
  
  // Normalize the format of the MIDI data
  let format = 1; // Default to format 1 (multiple tracks, synchronous)
  let division = 480; // Default ticks per quarter note
  let tracks = [];
  
  if (midiJson.format !== undefined) {
    format = midiJson.format;
  }
  
  if (midiJson.division !== undefined) {
    division = midiJson.division;
  }
  
  // Process tracks based on input format
  if (Array.isArray(midiJson.tracks)) {
    tracks = midiJson.tracks;
  } else if (midiJson.tracks) {
    // If tracks is an object but not an array, try to convert to array
    tracks = Object.values(midiJson.tracks);
  } else {
    // Handle Verovio converter format which might not have a 'tracks' property
    // or might have a different structure
    
    // Create at least one track with available events
    let trackEvents = [];
    
    // Check if the MIDI data has a different structure (Verovio format)
    if (midiJson.track) {
      // Some converters might use 'track' (singular) instead of 'tracks'
      if (Array.isArray(midiJson.track)) {
        tracks = midiJson.track;
      } else {
        tracks = [{ events: midiJson.track }];
      }
    } else {
      // Create a default track if no track information is available
      tracks = [{ events: [] }];
    }
  }
  
  // Normalize tracks to ensure they all have an events property
  tracks = tracks.map(track => {
    if (!track) return { events: [] };
    if (!track.events && Array.isArray(track)) {
      // If the track itself is an array, assume it's an array of events
      return { events: track };
    }
    if (!track.events) {
      // If track has no events property, provide an empty array
      return { ...track, events: [] };
    }
    return track;
  });
  
  // Write the header chunk
  const headerChunk = writeHeaderChunk(format, tracks.length, division);
  
  // Write each track chunk
  const trackChunks = tracks.map(track => {
    // Handle track with events property
    if (track.events) {
      return writeTrackChunk(track.events);
    }
    // Fallback for any other structure
    return writeTrackChunk([]);
  });
  
  // Combine all chunks
  const midiData = concatBytes(headerChunk, ...trackChunks);
  
  // Create a blob with the MIDI data
  return new Blob([midiData], { type: 'audio/midi' });
} 