// In development Vite forwards /api to the local Flask server. Production
// builds talk directly to the deployed API.
export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://destination-planner-backend.onrender.com').replace(/\/$/, '');

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      message = (await response.json()).error || message;
    } catch {
      // The error body was not JSON; keep the status message.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}
