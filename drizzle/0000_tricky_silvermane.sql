CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`university` text NOT NULL,
	`course` text NOT NULL,
	`status` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `booking_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` integer NOT NULL,
	`actor_user_id` integer,
	`event_type` text NOT NULL,
	`from_status` text,
	`to_status` text,
	`payload_json` text,
	`created_at` integer,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`student_user_id` integer,
	`lead_id` integer,
	`source` text DEFAULT 'homepage',
	`date` text NOT NULL,
	`time_slot` text NOT NULL,
	`timezone` text DEFAULT 'Asia/Dhaka',
	`status` text DEFAULT 'pending',
	`assigned_agent_id` integer,
	`meet_link` text,
	`student_note` text,
	`agent_note` text,
	`requested_new_date` text,
	`requested_new_time_slot` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`type` text,
	`mime_type` text,
	`size` integer,
	`status` text DEFAULT 'Pending',
	`reviewed_by_user_id` integer,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`program` text NOT NULL,
	`budget` text NOT NULL,
	`country_interest` text,
	`message` text,
	`source` text DEFAULT 'website',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`from_user_id` integer,
	`to_user_id` integer,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`channel` text DEFAULT 'in_app',
	`booking_id` integer,
	`application_id` integer,
	`is_read` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`company_email` text NOT NULL,
	`company_phone` text NOT NULL,
	`company_address` text,
	`company_logo` text,
	`company_favicon` text,
	`primary_color` text,
	`whatsapp_number` text NOT NULL,
	`facebook_url` text NOT NULL,
	`hero_headline` text NOT NULL,
	`hero_subheadline` text NOT NULL,
	`ceo_profile` text,
	`metrics` text,
	`countries` text,
	`default_meet_link` text,
	`university_logos` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `student_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_user_id` integer NOT NULL,
	`agent_user_id` integer NOT NULL,
	`assigned_by_user_id` integer,
	`assigned_at` integer,
	`active` integer DEFAULT true,
	FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`preferred_program` text,
	`budget_range` text,
	`country_interest` text,
	`phone` text,
	`address` text,
	`profile_completion` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_profiles_user_id_unique` ON `student_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'student',
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);