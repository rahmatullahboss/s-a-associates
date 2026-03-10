-- Migration: Add tracking & analytics columns to site_settings
ALTER TABLE site_settings ADD COLUMN facebook_pixel_id TEXT;
ALTER TABLE site_settings ADD COLUMN meta_access_token TEXT;
ALTER TABLE site_settings ADD COLUMN meta_test_event_code TEXT;
ALTER TABLE site_settings ADD COLUMN google_analytics_id TEXT;
