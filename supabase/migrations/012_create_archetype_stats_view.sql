-- Migration 012: Create archetype_stats materialized view
-- Aggregates event placement data into per-archetype win rates and scores

create materialized view if not exists public.archetype_stats as
select
  a.id as archetype_id,
  a.name,
  a.colors,
  a.tier as base_tier,
  count(ep.id) as total_placements,
  count(ep.id) filter (where ep.placement = 1) as first_place_count,
  count(ep.id) filter (where ep.placement <= 3) as top_3_count,
  coalesce(avg(ep.placement)::numeric(5,2), 0) as avg_placement,
  case
    when sum(ep.wins + ep.losses + ep.draws) > 0
    then (sum(ep.wins)::numeric / sum(ep.wins + ep.losses + ep.draws))::numeric(5,4)
    else 0
  end as win_rate,
  -- Weight recent events (90-day window) more heavily
  coalesce(sum(
    case
      when e.date > current_date - interval '90 days' then 1.0
      when e.date > current_date - interval '180 days' then 0.5
      else 0.25
    end
  ), 0)::numeric(8,2) as weighted_score,
  -- Count of events in last 90 days
  count(distinct e.id) filter (where e.date > current_date - interval '90 days') as recent_event_count
from public.archetypes a
left join public.event_placements ep on ep.archetype_id = a.id
left join public.events e on e.id = ep.event_id
group by a.id, a.name, a.colors, a.tier;

-- Unique index required for CONCURRENTLY refresh
create unique index if not exists idx_archetype_stats_id
  on public.archetype_stats(archetype_id);

-- RPC function to refresh the materialized view (call from cron or admin)
create or replace function public.refresh_archetype_stats()
returns void as $$
begin
  refresh materialized view concurrently public.archetype_stats;
end;
$$ language plpgsql security definer;
