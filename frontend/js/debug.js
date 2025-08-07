const debugLog = document.getElementById('debug-log');

/**
 * Logs a message to the debug console on the login page.
 * @param {string} title - The title of the log entry (e.g., 'Network Request').
 * @param {string} body - The main content of the log.
 * @param {boolean} [isError=false] - If true, the body will be styled as an error.
 */
export function logToDebug(title, body, isError = false) {
  if (!debugLog) {
    console.warn('Debug log element not found. Cannot log to page.');
    return;
  }

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const titleEl = document.createElement('div');
  titleEl.className = 'log-title';
  titleEl.textContent = `[${new Date().toLocaleTimeString()}] ${title}`;

  const bodyEl = document.createElement('pre');
  bodyEl.className = isError ? 'log-error' : 'log-body';
  bodyEl.textContent = body;

  entry.appendChild(titleEl);
  entry.appendChild(bodyEl);
  debugLog.appendChild(entry);

  // Auto-scroll to the bottom
  debugLog.scrollTop = debugLog.scrollHeight;
}
