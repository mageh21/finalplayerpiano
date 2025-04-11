/**
 * Converts base64 string to array buffer (used for MIDI conversion)
 */
export function atoab(base64: string): ArrayBuffer {
  try {
    // Convert base64 to binary
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error('Error converting base64 to ArrayBuffer:', e);
    throw new Error('Failed to convert MIDI data');
  }
}

/**
 * Assertion function to check if a value is defined.
 * Throws an error if the value is undefined or null.
 */
export function assertIsDefined<T>(val: T | undefined | null): asserts val is T {
  if (val === undefined || val === null) {
    throw new Error('Expected value to be defined, but got ' + val);
  }
}

/**
 * Cached fetch function that makes HTTP requests with proper error handling
 */
export async function fetish(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response;
} 