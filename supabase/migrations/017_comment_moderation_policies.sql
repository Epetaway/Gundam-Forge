-- Migration 017: Comment moderation policies
-- Admins and moderators can delete any comment for moderation

create policy "Moderators can delete any comment"
  on public.comments for delete
  to authenticated
  using (public.has_role('moderator'));

-- Note: "Users can delete their own comments" already exists from migration 010.
-- PostgreSQL RLS uses OR logic across all policies for the same operation,
-- so a user can delete their own comment OR a moderator/admin can delete any.
