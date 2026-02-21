import { API_BASE } from "@/lib/api";

export async function getProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateProfile(data: Record<string, string>) {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return { success: false, error: errorData.error || 'Failed to update profile' };
    }
    
    return { success: true };
  } catch (error: Error | unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}
