// Requests to the Flask backend. In development Vite forwards /api to it
// (see vite.config.js).
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    signal,
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
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}
