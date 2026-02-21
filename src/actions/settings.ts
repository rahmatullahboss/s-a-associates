import type { SiteSettings } from "@/lib/site-settings.types";
import { API_BASE } from "@/lib/api";

export async function saveSiteSettingsAction(settings: SiteSettings) {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });
    if (!res.ok) return { success: false, error: 'Failed' };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function uploadCeoPhotoAction(fd: FormData) {
  try {
    fd.append('type', 'ceo');
    const res = await fetch(`${API_BASE}/api/settings/upload-asset`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (!res.ok) return { success: false, error: 'Failed' };
    const data = await res.json() as { url?: string };
    return { success: true, url: data.url };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function uploadUniversityLogoAction(fd: FormData) {
  try {
    fd.append('type', 'university');
    const res = await fetch(`${API_BASE}/api/settings/upload-asset`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (!res.ok) return { success: false, error: 'Failed' };
    const data = await res.json() as { url?: string };
    return { success: true, url: data.url };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
