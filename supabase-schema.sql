-- Run this in the Supabase SQL editor to create the progress table
-- (No auth required — uses a device_id stored in the browser)

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(device_id, topic_id)
);

CREATE INDEX idx_user_progress_device_id ON user_progress(device_id);

-- Allow public access (since there's no auth)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read all progress"
  ON user_progress FOR SELECT
  USING (true);

CREATE POLICY "Public can insert progress"
  ON user_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update progress"
  ON user_progress FOR UPDATE
  USING (true);
