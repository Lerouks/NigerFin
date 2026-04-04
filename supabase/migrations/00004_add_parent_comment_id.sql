-- Add parent_comment_id column for threaded replies
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE;

-- Index for efficient reply lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
