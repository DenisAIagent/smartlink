// --- Authentication API ---

/**
 * Sends a login request to the backend.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - A promise that resolves to the JSON response from the server.
 */
export async function loginUser(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(response);
}


// --- Odesli/Songlink API ---

/**
 * Fetches song metadata from the public Odesli API.
 * @param {string} songUrl - The URL of the song on a streaming platform.
 * @returns {Promise<object>}
 */
export async function fetchOdesliData(songUrl) {
    const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(songUrl)}`);
    return handleResponse(response);
}


// --- Smartlink API ---

/**
 * Creates a new smartlink in the backend.
 * @param {object} linkData - The data for the new smartlink.
 * @returns {Promise<object>}
 */
export async function createSmartlink(linkData) {
    return fetchAuthenticated('/api/smartlinks', {
        method: 'POST',
        body: JSON.stringify(linkData),
    });
}


// --- Authenticated Fetch Helper ---

/**
 * A wrapper around fetch that automatically includes the JWT access token.
 * It also handles token expiration by redirecting to the login page.
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options to pass to fetch.
 * @returns {Promise<object>} - A promise that resolves to the JSON response from the server.
 */
export async function fetchAuthenticated(url, options = {}) {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  if (!token) {
    window.location.href = '/login.html';
    throw new Error('No authentication token found.');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token is invalid or expired
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    window.location.href = '/login.html';
    throw new Error('Session expired. Please log in again.');
  }

  return handleResponse(response);
}


// --- Generic Response Handler ---

async function handleResponse(response) {
  const responseBody = await response.json().catch(() => ({})); // Gracefully handle empty responses

  if (!response.ok) {
    const error = new Error(responseBody.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.body = responseBody;
    throw error;
  }

  return responseBody;
}
