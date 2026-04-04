-- Add parent_comment_id column for threaded replies in discussion_comments
ALTER TABLE discussion_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES discussion_comments(id) ON DELETE CASCADE;

-- Index for efficient reply lookups
CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent_id ON discussion_comments(parent_comment_id);
