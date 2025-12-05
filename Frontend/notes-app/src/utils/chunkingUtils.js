/**
 * Get accurate byte length of UTF-8 string
 * Uses TextEncoder to properly count multi-byte characters
 */
export const getByteLength = (str) => {
  if (!str) return 0;
  return new TextEncoder().encode(str).length;
};

/**
 * Split string into chunks of max 64 bytes
 * Handles UTF-8 multi-byte characters properly (emojis, special chars)
 * @param {string} str - The string to chunk
 * @param {number} maxBytes - Maximum bytes per chunk (default 64)
 * @returns {array} - Array of string chunks
 */
export const chunkString = (str, maxBytes = 64) => {
  if (!str) return [];
  
  const byteLength = getByteLength(str);
  
  // CASE 1: SHORT STRING (FITS IN ONE CHUNK)
  if (byteLength <= maxBytes) {
    return [str];
  }

  // CASE 2: LONG STRING (NEEDS SPLITTING)
  // Must handle UTF-8 multi-byte characters properly
  const chunks = [];
  let currentChunk = '';
  
  for (const char of str) {
    const testChunk = currentChunk + char;
    const testBytes = getByteLength(testChunk);
    
    if (testBytes <= maxBytes) {
      currentChunk = testChunk;
    } else {
      // Current chunk is full, save it and start new chunk
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = char;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

/**
 * Chunk all fields in note metadata
 * Splits long strings into 64-byte chunks
 * @param {object} noteData - Note data object with title, content, category
 * @param {string} operation - Operation type (CREATE, UPDATE, DELETE)
 * @returns {object} - Chunked metadata object
 */
export const chunkMetadata = (noteData, operation = 'CREATE') => {
  const chunkedData = {
    operation,
    timestamp: new Date().toISOString(),
    app: 'NotesApp',
  };

  if (noteData.id) {
    chunkedData.noteId = String(noteData.id);
  }

  // Chunk title if needed (using byte length)
  const titleBytes = getByteLength(noteData.title || '');
  if (titleBytes <= 64) {
    chunkedData.title = noteData.title || '';
  } else {
    chunkedData.title = chunkString(noteData.title, 64);
  }

  // Chunk content if needed (using byte length)
  const contentBytes = getByteLength(noteData.content || '');
  if (contentBytes <= 64) {
    chunkedData.content = noteData.content || '';
  } else {
    chunkedData.content = chunkString(noteData.content, 64);
  }

  // Category usually small enough (but chunk if needed)
  const categoryBytes = getByteLength(noteData.category || 'Personal');
  if (categoryBytes <= 64) {
    chunkedData.category = noteData.category || 'Personal';
  } else {
    chunkedData.category = chunkString(noteData.category || 'Personal', 64);
  }
  
  if (noteData.isPinned !== undefined) {
    chunkedData.isPinned = noteData.isPinned;
  }

  return chunkedData;
};

/**
 * Validate all chunks are <= 64 bytes
 * Throws error if any chunk exceeds the limit
 * @param {object} chunkedData - Chunked metadata object
 * @returns {boolean} - True if valid
 * @throws {Error} - If any chunk exceeds 64 bytes
 */
export const validateChunkedMetadata = (chunkedData) => {
  for (const [key, value] of Object.entries(chunkedData)) {
    if (Array.isArray(value)) {
      // Check each chunk in array
      for (let i = 0; i < value.length; i++) {
        const chunk = value[i];
        const chunkBytes = getByteLength(chunk);
        if (chunkBytes > 64) {
          throw new Error(
            `Chunk ${i} in field "${key}" exceeds 64 bytes: ${chunkBytes} bytes (content: "${chunk.substring(0, 20)}...")`
          );
        }
      }
    } else if (typeof value === 'string') {
      // Check single string value
      const valueBytes = getByteLength(value);
      if (valueBytes > 64) {
        throw new Error(
          `Field "${key}" exceeds 64 bytes: ${valueBytes} bytes (content: "${value.substring(0, 20)}...")`
        );
      }
    }
  }
  return true;
};

/**
 * Reconstruct chunked string for display
 * Joins array chunks back into original string
 * @param {string|array} chunks - Single string or array of chunks
 * @returns {string} - Reconstructed string
 */
export const reconstructChunkedString = (chunks) => {
  if (!chunks) return '';
  if (typeof chunks === 'string') return chunks;
  if (Array.isArray(chunks)) return chunks.join('');
  return '';
};

/**
 * Calculate total metadata size in bytes
 * Estimates the total size of all metadata fields
 * @param {object} chunkedData - Chunked metadata object
 * @returns {number} - Total size in bytes
 */
export const estimateMetadataSize = (chunkedData) => {
  let totalBytes = 0;
  
  for (const [key, value] of Object.entries(chunkedData)) {
    // Add key size
    totalBytes += getByteLength(key);
    
    if (Array.isArray(value)) {
      // Add size of all chunks
      for (const chunk of value) {
        if (typeof chunk === 'string') {
          totalBytes += getByteLength(chunk);
        }
      }
    } else if (typeof value === 'string') {
      // Add value size
      totalBytes += getByteLength(value);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      // Booleans and numbers are small (approximate)
      totalBytes += 4;
    }
  }
  
  return totalBytes;
};
