import { useAuthStore } from '@/store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { token } = useAuthStore.getState();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || response.statusText);
  }

  return response.json();
}

export const privacyApi = {
  softDelete: () => fetchWithAuth('/privacy/memories/soft', { method: 'DELETE' }),
  hardDelete: () => fetchWithAuth('/privacy/memories/hard', { method: 'DELETE' }),
  exportData: () => fetchWithAuth('/privacy/export', { method: 'GET' }),
};

export const authApi = {
  sendOtp: (email: string) => 
    fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(res => res.json()),
    
  linkAccount: (deviceId: string, email: string, code: string) =>
    fetch(`${API_BASE_URL}/auth/link-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, email, code }),
    }).then(res => res.json()),
};
