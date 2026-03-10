-- Migration: Add Microsoft Clarity project ID column to site_settings
ALTER TABLE site_settings ADD COLUMN clarity_project_id TEXT;
