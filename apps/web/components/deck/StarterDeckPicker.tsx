'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { StarterDeckTemplate } from '@/lib/deck/starterTemplates';
import type { StarterDeckRecommendation } from '@/lib/deck/starterTemplates';

interface StarterDeckPickerProps {
  templates: StarterDeckTemplate[];
  recommendations?: StarterDeckRecommendation[];
  selectedSlug: string | null;
  onSelect: (template: StarterDeckTemplate | null) => void;
}

export default function StarterDeckPicker({
  templates,
  recommendations = [],
  selectedSlug,
  onSelect,
}: StarterDeckPickerProps): JSX.Element | null {
  if (templates.length === 0) return null;

  const featuredRecommendation = recommendations[0] ?? null;
  const secondaryRecommendations = recommendations.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-semibold text-foreground">
        Start From Official Starter Deck <span className="font-normal text-steel-600">(optional)</span>
      </label>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-lg px-4 py-2 text-left transition-colors',
          selectedSlug === null
            ? 'bg-cobalt-500/20 text-foreground ring-1 ring-cobalt-300/60'
            : 'bg-background/30 text-steel-500 hover:bg-cobalt-500/10 hover:text-foreground',
        )}
      >
        <p className="text-sm font-semibold">Start from scratch</p>
        <p className="text-xs text-steel-600">Begin with an empty shell and build from your intent.</p>
      </button>

      {featuredRecommendation && (
        <button
          type="button"
          onClick={() => onSelect(featuredRecommendation.template)}
          className={cn(
            'overflow-hidden rounded-xl text-left transition-all',
            selectedSlug === featuredRecommendation.template.slug
              ? 'ring-2 ring-cobalt-300/70'
              : 'hover:ring-1 hover:ring-cobalt-500/50',
          )}
        >
          <div className="relative h-28 w-full overflow-hidden">
            <img
              src={featuredRecommendation.template.imageUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute left-3 top-3 inline-flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                  featuredRecommendation.confidence === 'strong'
                    ? 'bg-green-900/65 text-green-300'
                    : 'bg-amber-900/70 text-amber-200',
                )}
              >
                {featuredRecommendation.confidence} match
              </span>
              <span className="rounded-full bg-cobalt-900/70 px-2 py-0.5 text-[10px] font-semibold text-cobalt-100">
                {featuredRecommendation.score}% fit
              </span>
            </div>
          </div>

          <div className="space-y-2 bg-surface/70 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{featuredRecommendation.template.name}</p>
              <Badge variant="accent" className="text-[10px]">Top pick</Badge>
            </div>

            <p className="line-clamp-2 text-xs text-steel-600">{featuredRecommendation.template.description}</p>

            <div className="flex flex-wrap gap-1">
              {featuredRecommendation.reasons.map((reason) => (
                <span
                  key={`${featuredRecommendation.template.slug}-${reason}`}
                  className="rounded bg-cobalt-900/35 px-2 py-0.5 text-[10px] text-cobalt-200"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </button>
      )}

      {secondaryRecommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-cobalt-300">More matches</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {secondaryRecommendations.map((item) => {
              const selected = selectedSlug === item.template.slug;
              return (
                <button
                  key={`recommended-${item.template.slug}`}
                  type="button"
                  onClick={() => onSelect(item.template)}
                  className={cn(
                    'rounded-md px-2 py-2 text-left transition-colors',
                    selected
                      ? 'bg-cobalt-500/15 ring-1 ring-cobalt-300/60'
                      : 'bg-background/30 hover:bg-cobalt-500/10',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-semibold text-foreground">{item.template.name}</p>
                    <span className="text-[10px] font-semibold text-cobalt-300">{item.score}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.reasons.map((reason) => (
                      <span
                        key={`${item.template.slug}-${reason}`}
                        className="rounded bg-surface px-2 py-0.5 text-[10px] text-steel-500"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">All official starters</p>
        <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((template) => {
          const selected = selectedSlug === template.slug;
          const cardCount = template.entries.reduce((sum, entry) => sum + entry.qty, 0);

          return (
            <button
              key={template.slug}
              type="button"
              onClick={() => onSelect(template)}
              className={cn(
                'rounded-lg text-left transition-all',
                selected
                  ? 'bg-cobalt-500/12 ring-1 ring-cobalt-300/60'
                  : 'bg-background/30 hover:bg-cobalt-500/10',
              )}
              aria-pressed={selected}
            >
              <Card className="overflow-hidden border-0 bg-transparent shadow-none">
                <img
                  src={template.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-28 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <CardContent className="space-y-2 px-4 py-2">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{template.name}</p>
                  <p className="text-xs text-steel-600 line-clamp-2">{template.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent" className="text-[10px]">{template.archetype}</Badge>
                    {template.colors.slice(0, 2).map((color) => (
                      <Badge key={`${template.slug}-${color}`} className="text-[10px]">{color}</Badge>
                    ))}
                    <span className="text-[10px] text-steel-600">{cardCount} cards</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
