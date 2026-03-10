CREATE TABLE `availability_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `availability_overrides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`is_off` integer DEFAULT true,
	`start_time` text,
	`end_time` text,
	`note` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `availability_overrides_date_unique` ON `availability_overrides` (`date`);
--> statement-breakpoint
-- Add new columns to site_settings
ALTER TABLE `site_settings` ADD `slot_duration` integer DEFAULT 60;
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `buffer_time` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `max_bookings_per_day` integer DEFAULT 8;
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `advance_booking_days` integer DEFAULT 14;
--> statement-breakpoint
-- Seed default weekly schedule: Mon-Fri 10:00-17:00
INSERT INTO `availability_schedules` (`day_of_week`, `start_time`, `end_time`, `is_active`) VALUES
  (1, '10:00', '17:00', 1),
  (2, '10:00', '17:00', 1),
  (3, '10:00', '17:00', 1),
  (4, '10:00', '17:00', 1),
  (5, '10:00', '17:00', 1);
