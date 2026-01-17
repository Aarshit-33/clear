// take backend_URL from .env

const BASE_URL = import.meta.env.BACKEND_URL || '';

// const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    console.log(BASE_URL);
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };


    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    return response;
}
