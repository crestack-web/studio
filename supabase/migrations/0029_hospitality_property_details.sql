-- Extra hotel settings the owner can edit: contact and check-in times.
ALTER TABLE hospitality_settings
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '12:00';
