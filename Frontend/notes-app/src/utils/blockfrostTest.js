/**
 * Blockfrost Connection Test Utility
 * Use this to diagnose Blockfrost API connectivity issues
 */

/**
 * Test Blockfrost API connection
 * @param {string} projectId - Blockfrost project ID
 * @param {string} network - Network name (preview, preprod, mainnet)
 * @returns {Promise<object>} - Test results
 */
export const testBlockfrostConnection = async (projectId, network = 'preview') => {
  const results = {
    projectIdValid: false,
    networkReachable: false,
    apiResponding: false,
    error: null,
    details: {}
  };

  try {
    // Validate project ID format
    if (!projectId || typeof projectId !== 'string') {
      results.error = 'Invalid project ID format';
      return results;
    }

    results.projectIdValid = true;

    // Construct the Blockfrost API endpoint
    const baseUrl = `https://cardano-${network}.blockfrost.io/api/v0`;
    const endpoint = `${baseUrl}/network`;

    console.log('🧪 Testing Blockfrost connection:', { projectId, network, endpoint });

    // Test basic fetch to Blockfrost
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'project_id': projectId
      }
    });

    results.networkReachable = true;
    results.details.status = response.status;
    results.details.statusText = response.statusText;

    if (response.ok) {
      const data = await response.json();
      results.apiResponding = true;
      results.details.network = data.network;
      console.log('✅ Blockfrost API is responding:', data);
    } else {
      const errorText = await response.text();
      results.error = `API returned ${response.status}: ${errorText}`;
      console.error('❌ Blockfrost API error:', results.error);
    }

  } catch (error) {
    results.error = error.message;
    console.error('❌ Blockfrost connection test failed:', error);

    // Provide specific guidance based on error type
    if (error.message.includes('Failed to fetch')) {
      results.error = 'Failed to fetch from Blockfrost. Possible causes:\n' +
        '1. Network connectivity issues\n' +
        '2. CORS restrictions (Blockfrost should allow CORS from any origin)\n' +
        '3. Blockfrost service is down\n' +
        '4. Browser blocking the request';
    }
  }

  return results;
};

/**
 * Test Blockfrost using the SDK (Blaze method)
 * @param {string} projectId - Blockfrost project ID
 * @param {string} network - Network name
 * @returns {Promise<object>} - Test results
 */
export const testBlockfrostWithSDK = async (projectId, network = 'preview') => {
  const results = {
    success: false,
    error: null,
    parameters: null
  };

  try {
    // Dynamically import to avoid issues if SDK is not available
    const { Blockfrost } = await import('@blaze-cardano/sdk');

    console.log('🧪 Testing Blockfrost with SDK...');
    const provider = new Blockfrost({
      network: `cardano-${network}`,
      projectId
    });

    // Try to fetch protocol parameters (this is what Blaze.from() does internally)
    const params = await provider.getParameters();
    results.success = true;
    results.parameters = params;
    console.log('✅ Blockfrost SDK test successful');

  } catch (error) {
    results.error = error.message;
    console.error('❌ Blockfrost SDK test failed:', error);
  }

  return results;
};

/**
 * Run comprehensive Blockfrost diagnostics
 * @returns {Promise<object>} - Diagnostic results
 */
export const runBlockfrostDiagnostics = async () => {
  const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
  const network = import.meta.env.VITE_BLOCKCHAIN_NETWORK || 'preview';

  console.group('🔍 Blockfrost Diagnostics');
  console.log('Project ID:', projectId ? `${projectId.substring(0, 10)}...` : 'MISSING');
  console.log('Network:', network);

  const diagnostics = {
    config: {
      projectId: !!projectId,
      network
    },
    basicTest: null,
    sdkTest: null
  };

  // Test 1: Basic HTTP fetch
  diagnostics.basicTest = await testBlockfrostConnection(projectId, network);

  // Test 2: SDK method
  diagnostics.sdkTest = await testBlockfrostWithSDK(projectId, network);

  console.log('Diagnostics complete:', diagnostics);
  console.groupEnd();

  return diagnostics;
};

/**
 * Quick diagnostic summary for user display
 * @param {object} diagnostics - Results from runBlockfrostDiagnostics
 * @returns {string} - User-friendly summary
 */
export const getDiagnosticSummary = (diagnostics) => {
  if (!diagnostics.config.projectId) {
    return 'Blockfrost project ID is not configured. Please set VITE_BLOCKFROST_PROJECT_ID in your .env file.';
  }

  if (diagnostics.sdkTest?.success) {
    return '✅ Blockfrost connection is working properly.';
  }

  if (!diagnostics.basicTest?.networkReachable) {
    return '❌ Cannot reach Blockfrost API. Please check your internet connection. If you are behind a firewall or proxy, ensure https://cardano-preview.blockfrost.io is accessible.';
  }

  if (diagnostics.basicTest?.details?.status === 403) {
    return '❌ Blockfrost API key is invalid or unauthorized. Please verify your project ID.';
  }

  if (diagnostics.basicTest?.details?.status === 429) {
    return '❌ Blockfrost rate limit exceeded. Please wait a moment and try again.';
  }

  if (diagnostics.sdkTest?.error) {
    return `❌ Blockfrost SDK error: ${diagnostics.sdkTest.error}`;
  }

  return '❌ Unknown Blockfrost connection issue. Check console for details.';
};
