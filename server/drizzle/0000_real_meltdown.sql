CREATE TABLE `daily_focus` (
	`date` text PRIMARY KEY NOT NULL,
	`top_task_1` text,
	`top_task_2` text,
	`top_task_3` text,
	`avoided_task` text,
	`daily_directive` text,
	`accepted` integer DEFAULT false,
	`override_used` integer DEFAULT false,
	FOREIGN KEY (`top_task_1`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`top_task_2`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`top_task_3`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`avoided_task`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dump_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`processed` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`date` text NOT NULL,
	`activity_type` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_text` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`last_seen_at` integer DEFAULT (unixepoch()),
	`repeat_count` integer DEFAULT 1,
	`pressure_score` real DEFAULT 0,
	`leverage_score` real DEFAULT 0,
	`neglect_score` real DEFAULT 0,
	`scheduled_date` text,
	`status` text DEFAULT 'open'
);
