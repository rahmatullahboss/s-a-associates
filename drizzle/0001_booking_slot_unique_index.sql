--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_date_timeslot_unique` ON `bookings` (`date`, `time_slot`) WHERE `status` != 'cancelled';
