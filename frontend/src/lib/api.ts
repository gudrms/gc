const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    request<{ id: string; email: string; name: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; user: { id: string; email: string; name: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) },
    ),
};

// Movies
export const movieApi = {
  findAll: () => request<any[]>('/movies'),
  findOne: (id: string) => request<any>(`/movies/${id}`),
};

// Screenings
export const screeningApi = {
  findByMovie: (movieId: string) => request<any[]>(`/movies/${movieId}/screenings`),
  getSeats: (screeningId: string) => request<any[]>(`/screenings/${screeningId}/seats`),
};

// Reservations
export const reservationApi = {
  create: (data: { screeningId: string; seatId: string }) =>
    request<any>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  findMine: () => request<any[]>('/reservations'),
  cancel: (id: string) =>
    request<any>(`/reservations/${id}/cancel`, { method: 'PATCH' }),
};
