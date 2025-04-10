export class ApiService {
  private static API_BASE_URL = 'http://ec2-54-252-145-103.ap-southeast-2.compute.amazonaws.com:8000';

  /**
   * Check if a PDF file is encrypted or password protected
   * @param file The PDF file to check
   * @returns Promise<boolean> True if the file is encrypted, false otherwise
   */
  private static async isPdfEncrypted(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // First check: Look for PDF header
          const header = String.fromCharCode.apply(null, Array.from(content.slice(0, 8)));
          if (!header.startsWith('%PDF-')) {
            throw new Error('Invalid PDF file format');
          }
          
          // Convert a larger portion for thorough checking (increased from 2048 to 4096)
          const fileContent = String.fromCharCode.apply(null, Array.from(content.slice(0, 4096)));
          
          // Enhanced encryption detection patterns
          const encryptionPatterns = [
            /\/Encrypt\s*\d+\s*\d+\s*R/,      // Standard encryption dictionary reference
            /\/Encrypt\s*<<.*?>>/,             // Inline encryption dictionary
            /\/Encrypt/,                       // Basic encryption marker
            /\/Encryption/,                    // Alternative encryption marker
            /\/FileAccess/,                    // Access restrictions
            /\/EncryptMetadata/,               // Metadata encryption
            /\/StandardSecurityHandler/,        // Security handler
            /\/Perms/,                         // Permissions dictionary
            /\/SecuritySettings/,               // Security settings
            /\/ID\s*\[/,                       // File ID (often used with encryption)
            /\/U\s*\(/,                        // User password
            /\/O\s*\(/,                        // Owner password
            /\/R\s*\d/,                        // Revision number (encryption-related)
            /\/V\s*\d/,                        // Version number (encryption-related)
            /\/Length\s*\d+/,                  // Encryption key length
            /\/CF\s*<<.*?>>/,                  // Crypt filters
            /\/StmF\s*\//,                     // Stream filter (encryption-related)
            /\/StrF\s*\//,                     // String filter (encryption-related)
            /\/AuthEvent/,                     // Authentication event
            /\/SubFilter/                      // Encryption subfilter
          ];

          // Check for any encryption patterns
          const hasEncryption = encryptionPatterns.some(pattern => pattern.test(fileContent));
          
          // Additional binary analysis for encryption markers
          const binaryCheck = content.some((byte, index, array) => {
            if (index < array.length - 3) {
              // Look for potential encryption key sequences
              return (byte === 0x2F && array[index + 1] === 0x45 && array[index + 2] === 0x6E) || // '/En'
                     (byte === 0x2F && array[index + 1] === 0x43 && array[index + 2] === 0x72);    // '/Cr'
            }
            return false;
          });

          console.log('PDF Security Check:', {
            fileName: file.name,
            fileSize: file.size,
            hasEncryption,
            hasBinaryEncryptionMarkers: binaryCheck,
            headerValid: header.startsWith('%PDF-'),
            firstBytes: fileContent.substring(0, 100) // Log first 100 chars for debugging
          });

          resolve(hasEncryption || binaryCheck);
        } catch (error) {
          console.error('Error checking PDF security:', error);
          // If we can't determine encryption status, assume it's encrypted for safety
          resolve(true);
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error('Failed to read PDF file for security check'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Check the health status of the API
   */
  static async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText} (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Server health check failed. Please try again later.');
    }
  }

  /**
   * Convert a file using the API
   * @param file The file to convert
   * @returns A Blob containing the converted MusicXML file
   * @throws Error if the PDF is encrypted or password protected
   */
  static async convertFile(file: File): Promise<Blob> {
    try {
      // Check if the file is a PDF
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log('Processing PDF file:', file.name);
        const isEncrypted = await this.isPdfEncrypted(file);
        
        if (isEncrypted) {
          throw new Error('This PDF file appears to be encrypted or password-protected. Please provide an unencrypted PDF file.');
        }
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending file to server:', file.name);
      const response = await fetch(`${this.API_BASE_URL}/convert`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `Conversion failed: ${response.statusText}`;
        
        // Try to get more detailed error message from response
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error response, use the status text
          if (response.status === 404) {
            errorMessage = 'The conversion service is currently unavailable. Please try again later.';
          } else if (response.status === 413) {
            errorMessage = 'The file is too large. Please try a smaller file.';
          } else if (response.status === 415) {
            errorMessage = 'This file type is not supported.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error) {
      console.error('File conversion failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred during conversion');
    }
  }

  /**
   * Subscribe to conversion progress updates
   * @param onProgress Callback function to handle progress updates
   * @returns The EventSource instance
   */
  static subscribeToProgress(
    onProgress: (status: string, message: string) => void
  ): EventSource {
    const evtSource = new EventSource(`${this.API_BASE_URL}/convert/stream`);
    
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data.status, data.message);
      } catch (error) {
        console.error('Error parsing progress update:', error);
        onProgress('error', 'Failed to parse progress update');
      }
    };

    evtSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      onProgress('error', 'Lost connection to conversion service');
      evtSource.close();
    };

    return evtSource;
  }
} 