/* eslint-disable react-refresh/only-export-components */
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "./site-settings.types";
import { API_BASE } from "./api";
import { initPixelScript, initGoogleAnalytics, initClarity } from "./pixel";

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/site-settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (mounted && data && typeof data === "object") {
          // Merge with defaults so empty DB response doesn't wipe out default values
          const raw = data as Record<string, unknown>;
          const merged = { ...DEFAULT_SITE_SETTINGS, ...(raw.settings as Partial<SiteSettings> ?? raw) };
          setSettings(merged as SiteSettings);

          // Initialize tracking scripts once settings are loaded
          if (merged.facebookPixelId) {
            initPixelScript(merged.facebookPixelId);
          }
          if (merged.googleAnalyticsId) {
            initGoogleAnalytics(merged.googleAnalyticsId);
          }
          if (merged.clarityProjectId) {
            initClarity(merged.clarityProjectId);
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
