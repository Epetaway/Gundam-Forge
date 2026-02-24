-- Migration 013: Create get_trending_decks RPC function
-- Trending score = (recent_likes * 3 + view_count) / age_hours^1.5
-- Surfaces decks that are gaining traction recently

create or replace function public.get_trending_decks(lim integer default 20)
returns table(
  id uuid,
  name text,
  description text,
  colors text[],
  is_public boolean,
  view_count integer,
  like_count integer,
  archetype text,
  source text,
  source_url text,
  slug text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  trending_score numeric
) as $$
select
  d.id,
  d.name,
  d.description,
  d.colors,
  d.is_public,
  d.view_count,
  d.like_count,
  d.archetype,
  d.source,
  d.source_url,
  d.slug,
  d.created_at,
  d.updated_at,
  d.user_id,
  (
    (select count(*) from public.deck_likes dl
     where dl.deck_id = d.id
       and dl.created_at > now() - interval '7 days') * 3
    + d.view_count
  )::numeric
  / power(extract(epoch from now() - d.created_at) / 3600 + 2, 1.5)
  as trending_score
from public.decks d
where d.is_public = true
order by trending_score desc
limit lim;
$$ language sql stable;
