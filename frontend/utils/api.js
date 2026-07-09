import useAppStore from '../store/useAppStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Custom fetch request wrapper
 */
async function request(endpoint, options = {}) {
  const token = useAppStore.getState().token;
  
  const headers = {
    ...options.headers,
  };

  // Add JWT bearer token if present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If the body is FormData (Multer voice upload), let fetch set the boundaries automatically.
  // Otherwise, default to application/json.
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data = {};
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed at ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  get: (endpoint, headers = {}) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers = {}) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers
  }),
  put: (endpoint, body, headers = {}) => request(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers
  }),
  delete: (endpoint, headers = {}) => request(endpoint, { method: 'DELETE', headers })
};
