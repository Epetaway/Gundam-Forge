-- Migration 016: Admin-only policies for event and archetype management
-- Only admins/moderators can create/update/delete events and archetypes

-- ============================================================
-- Archetypes: admin/moderator write access
-- ============================================================
create policy "Admins can create archetypes"
  on public.archetypes for insert
  to authenticated
  with check (public.has_role('moderator'));

create policy "Admins can update archetypes"
  on public.archetypes for update
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));

create policy "Admins can delete archetypes"
  on public.archetypes for delete
  to authenticated
  using (public.has_role('admin'));

-- ============================================================
-- Events: admin/moderator write access
-- ============================================================
create policy "Admins can create events"
  on public.events for insert
  to authenticated
  with check (public.has_role('moderator'));

create policy "Admins can update events"
  on public.events for update
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));

create policy "Admins can delete events"
  on public.events for delete
  to authenticated
  using (public.has_role('admin'));

-- ============================================================
-- Event placements: admin/moderator write access
-- ============================================================
create policy "Admins can create event placements"
  on public.event_placements for insert
  to authenticated
  with check (public.has_role('moderator'));

create policy "Admins can update event placements"
  on public.event_placements for update
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));

create policy "Admins can delete event placements"
  on public.event_placements for delete
  to authenticated
  using (public.has_role('admin'));

-- ============================================================
-- Tags: admin/moderator write access
-- ============================================================
create policy "Admins can create tags"
  on public.tags for insert
  to authenticated
  with check (public.has_role('moderator'));

create policy "Admins can update tags"
  on public.tags for update
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));

create policy "Admins can delete tags"
  on public.tags for delete
  to authenticated
  using (public.has_role('admin'));
