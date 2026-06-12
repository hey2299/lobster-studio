// Web Fetch Shim - wraps fetch for use in both Node.js and Electron
// Provides a simple fetch-like interface for platform rule updates

async function webFetch(url) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LobsterStudio/1.0' },
      timeout: 5000,
    });
    const text = await response.text();
    return { text, status: response.status };
  } catch (e) {
    throw new Error(`Fetch failed: ${e.message}`);
  }
}

module.exports = { webFetch };
