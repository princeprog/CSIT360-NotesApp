/**
 * Testing Utilities
 * Helper functions for testing chunking, wallet operations, and transactions
 */

import { TRANSACTION_STATUS, TRANSACTION_OPERATIONS } from '../config/blockchain.js';

/**
 * Generate test strings of various sizes for chunking tests
 * @returns {object} - Object containing test strings
 */
export const generateTestStrings = () => {
  return {
    // Small string (under 64 bytes)
    small: "Hello World",
    
    // Exactly 64 bytes
    exact64: "A".repeat(64),
    
    // Just over 64 bytes
    over64: "B".repeat(65),
    
    // Large string requiring multiple chunks
    large: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    
    // String with emojis (multi-byte characters)
    withEmojis: "Hello 👋 World 🌍! Testing emojis 🚀✨🎉 in metadata chunks 📝",
    
    // String with various Unicode characters
    unicode: "Héllo Wörld! 你好世界 مرحبا بالعالم Привет мир 🌟",
    
    // String with special characters
    special: "Special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/~`\"\\",
    
    // Multi-line string
    multiline: `First line of text
Second line with more content
Third line with even more content to test chunking
Fourth line to ensure multiple chunks are created`,
    
    // Empty string
    empty: "",
    
    // String with only spaces
    spaces: "   ",
    
    // Very long single word
    longWord: "Supercalifragilisticexpialidocious" + "X".repeat(100),
    
    // Mixed content (text + emojis + numbers + special chars)
    mixed: "Note #123: Testing 🧪 with €50.99 & 25% discount! 🎁 Date: 2025-12-06 ⏰",
    
    // String with newlines and tabs
    whitespace: "Text\twith\ttabs\nand\nnewlines\r\nand\rcarriage\rreturns",
    
    // Japanese characters (3 bytes each in UTF-8)
    japanese: "こんにちは世界！これはテストです。日本語の文字列をチャンク化します。",
    
    // Arabic text (right-to-left)
    arabic: "مرحبا بكم في تطبيق الملاحظات. هذا اختبار للنص العربي والتقسيم إلى أجزاء.",
    
    // Very large string (requires many chunks)
    veryLarge: "A".repeat(500),
  };
};

/**
 * Generate test strings with specific byte sizes
 * @param {number} byteSize - Desired byte size
 * @param {string} char - Character to repeat (default 'A')
 * @returns {string} - String with specified byte size
 */
export const generateStringWithByteSize = (byteSize, char = 'A') => {
  const encoder = new TextEncoder();
  let str = '';
  
  while (encoder.encode(str).length < byteSize) {
    str += char;
  }
  
  // Trim to exact size if needed
  while (encoder.encode(str).length > byteSize) {
    str = str.slice(0, -1);
  }
  
  return str;
};

/**
 * Mock Wallet API for testing
 * Simulates Cardano wallet API methods
 * @param {object} options - Configuration options
 * @returns {object} - Mock wallet API object
 */
export const mockWalletApi = (options = {}) => {
  const {
    shouldFail = false,
    failureMessage = 'User declined',
    delay = 100,
    walletName = 'MockWallet',
    addresses = ['addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp'],
  } = options;

  return {
    // Get network ID (0 = testnet, 1 = mainnet)
    getNetworkId: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return 0;
    },

    // Get wallet balance
    getBalance: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return '10000000'; // 10 ADA in lovelace
    },

    // Get used addresses
    getUsedAddresses: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return addresses.map(addr => {
        // Convert bech32 to hex (simplified mock)
        return Buffer.from(addr).toString('hex');
      });
    },

    // Get unused addresses
    getUnusedAddresses: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return [];
    },

    // Get UTXOs
    getUtxos: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return [
        {
          txHash: 'mock_tx_hash_123456',
          outputIndex: 0,
          amount: [{ unit: 'lovelace', quantity: '10000000' }],
        },
      ];
    },

    // Sign transaction
    signTx: async (tx, partialSign = false) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return 'mock_signed_tx_' + tx.slice(0, 10);
    },

    // Submit transaction
    submitTx: async (signedTx) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return 'mock_tx_hash_' + Math.random().toString(36).substring(7);
    },

    // Get collateral
    getCollateral: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) throw new Error(failureMessage);
      return [];
    },

    // Wallet name and icon
    name: walletName,
    icon: 'data:image/png;base64,mock_icon',
    apiVersion: '1.0.0',
    isEnabled: async () => true,
  };
};

/**
 * Generate mock transaction object
 * @param {object} options - Transaction options
 * @returns {object} - Mock transaction object
 */
export const mockTransaction = (options = {}) => {
  const {
    id = Math.random().toString(36).substring(2, 15),
    noteId = Math.floor(Math.random() * 1000),
    operation = TRANSACTION_OPERATIONS.CREATE,
    status = TRANSACTION_STATUS.PENDING,
    txHash = 'mock_tx_hash_' + Math.random().toString(36).substring(2, 15),
    walletAddress = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp',
    metadata = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    confirmations = 0,
  } = options;

  return {
    id,
    noteId,
    operation,
    status,
    txHash,
    walletAddress,
    metadata: metadata || mockChunkedMetadata({
      title: `Test Note ${noteId}`,
      content: 'This is a test note content for transaction simulation.',
      category: 'Testing',
    }),
    createdAt,
    updatedAt,
    confirmations,
  };
};

/**
 * Generate mock chunked metadata
 * Simulates how metadata would be chunked for blockchain
 * @param {object} noteData - Note data to convert to metadata
 * @returns {object} - Mock chunked metadata object
 */
export const mockChunkedMetadata = (noteData = {}) => {
  const {
    title = 'Test Note',
    content = 'This is a test note content that may need to be chunked into smaller pieces for blockchain storage.',
    category = 'General',
    action = 'CREATE',
  } = noteData;

  // Simple chunking simulation (64 character chunks)
  const chunkString = (str, size = 64) => {
    if (str.length <= size) return str;
    
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  };

  const chunkedTitle = chunkString(title);
  const chunkedContent = chunkString(content);
  const chunkedCategory = chunkString(category);

  return {
    action,
    title: Array.isArray(chunkedTitle) ? chunkedTitle : chunkedTitle,
    content: Array.isArray(chunkedContent) ? chunkedContent : chunkedContent,
    category: Array.isArray(chunkedCategory) ? chunkedCategory : chunkedCategory,
    created_at: new Date().toISOString(),
    app: 'NotesApp',
  };
};

/**
 * Generate multiple mock transactions for testing lists
 * @param {number} count - Number of transactions to generate
 * @param {object} baseOptions - Base options to apply to all transactions
 * @returns {Array} - Array of mock transactions
 */
export const mockTransactionList = (count = 5, baseOptions = {}) => {
  const statuses = [
    TRANSACTION_STATUS.PENDING,
    TRANSACTION_STATUS.CONFIRMED,
    TRANSACTION_STATUS.FAILED,
  ];
  
  const operations = [
    TRANSACTION_OPERATIONS.CREATE,
    TRANSACTION_OPERATIONS.UPDATE,
    TRANSACTION_OPERATIONS.DELETE,
  ];

  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (count - index) * 5);

    return mockTransaction({
      ...baseOptions,
      noteId: index + 1,
      status: statuses[index % statuses.length],
      operation: operations[index % operations.length],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      confirmations: statuses[index % statuses.length] === TRANSACTION_STATUS.CONFIRMED 
        ? Math.floor(Math.random() * 100) + 1 
        : 0,
    });
  });
};

/**
 * Mock delay for simulating async operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
export const mockDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate test cases for chunking validation
 * @returns {Array} - Array of test case objects
 */
export const generateChunkingTestCases = () => {
  return [
    {
      name: 'Empty string',
      input: '',
      expectedChunks: 0,
      shouldPass: true,
    },
    {
      name: 'Small string (under 64 bytes)',
      input: 'Hello World',
      expectedChunks: 1,
      shouldPass: true,
    },
    {
      name: 'Exactly 64 bytes',
      input: 'A'.repeat(64),
      expectedChunks: 1,
      shouldPass: true,
    },
    {
      name: 'Just over 64 bytes',
      input: 'A'.repeat(65),
      expectedChunks: 2,
      shouldPass: true,
    },
    {
      name: 'Multiple chunks needed',
      input: 'A'.repeat(200),
      expectedChunks: 4,
      shouldPass: true,
    },
    {
      name: 'String with emojis',
      input: '👋'.repeat(20),
      expectedChunks: 2, // Emojis are 4 bytes each
      shouldPass: true,
    },
    {
      name: 'Mixed Unicode characters',
      input: 'Hello 世界 مرحبا',
      expectedChunks: 1,
      shouldPass: true,
    },
    {
      name: 'Very large string',
      input: 'X'.repeat(1000),
      expectedChunks: 16,
      shouldPass: true,
    },
  ];
};

/**
 * Validate test results
 * @param {*} actual - Actual result
 * @param {*} expected - Expected result
 * @param {string} testName - Name of the test
 * @returns {object} - Test result object
 */
export const validateTestResult = (actual, expected, testName = 'Test') => {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  
  return {
    testName,
    passed,
    actual,
    expected,
    message: passed 
      ? `✅ ${testName} passed` 
      : `❌ ${testName} failed: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  };
};

/**
 * Mock Blockfrost API response
 * @param {string} txHash - Transaction hash
 * @param {object} options - Response options
 * @returns {object} - Mock Blockfrost response
 */
export const mockBlockfrostResponse = (txHash, options = {}) => {
  const {
    status = 'confirmed',
    block = 'mock_block_hash',
    blockHeight = 1234567,
    blockTime = Math.floor(Date.now() / 1000),
    slot = 9876543,
    index = 0,
    outputAmount = [{ unit: 'lovelace', quantity: '10000000' }],
    fees = '170000',
  } = options;

  return {
    hash: txHash,
    block,
    block_height: blockHeight,
    block_time: blockTime,
    slot,
    index,
    output_amount: outputAmount,
    fees,
    deposit: '0',
    size: 450,
    invalid_before: null,
    invalid_hereafter: null,
    utxo_count: 2,
    withdrawal_count: 0,
    mir_cert_count: 0,
    delegation_count: 0,
    stake_cert_count: 0,
    pool_update_count: 0,
    pool_retire_count: 0,
    asset_mint_or_burn_count: 0,
    redeemer_count: 0,
    valid_contract: true,
  };
};
