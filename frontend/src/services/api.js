export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error('Cannot reach the server. Start the API and MongoDB, then try again.');
  }
  if (response.status === 204) return null;
  const body = await response.text();
  if (!body) {
    const error = new Error(response.ok
      ? 'The server returned an empty response.'
      : response.status >= 500
        ? 'Cannot reach the API server. Start the API and MongoDB, then try again.'
        : `The request could not be completed (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    const error = new Error(`The server returned an invalid response (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(data.message || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const jsonBody = (value) => JSON.stringify(value);
