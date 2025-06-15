const BASE = import.meta.env.VITE_API_URL;

export const apiFetch = (path, options = {}) => {
  return fetch(`${BASE}${path}`, {
     credentials: "include",
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
};
