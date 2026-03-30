'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { StarterDeckTemplate } from '@/lib/deck/starterTemplates';

interface StarterDeckPickerProps {
  templates: StarterDeckTemplate[];
  selectedSlug: string | null;
  onSelect: (template: StarterDeckTemplate | null) => void;
}

export default function StarterDeckPicker({
  templates,
  selectedSlug,
  onSelect,
}: StarterDeckPickerProps): JSX.Element | null {
  if (templates.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-foreground">
        Start From Official Starter Deck <span className="font-normal text-steel-600">(optional)</span>
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'rounded-md border px-3 py-2 text-left text-sm transition-colors',
            selectedSlug === null
              ? 'border-cobalt-400/60 bg-cobalt-500/10 text-foreground'
              : 'border-border bg-surface-interactive text-steel-600 hover:text-foreground',
          )}
        >
          Start from scratch
        </button>

        {templates.map((template) => {
          const selected = selectedSlug === template.slug;
          const cardCount = template.entries.reduce((sum, entry) => sum + entry.qty, 0);

          return (
            <button
              key={template.slug}
              type="button"
              onClick={() => onSelect(template)}
              className={cn(
                'rounded-md border text-left transition-all',
                selected
                  ? 'border-cobalt-400/70 bg-cobalt-500/10'
                  : 'border-border bg-surface-interactive hover:border-cobalt-400/40',
              )}
              aria-pressed={selected}
            >
              <Card className="overflow-hidden border-0 bg-transparent shadow-none">
                <img
                  src={template.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-24 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <CardContent className="space-y-2 px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{template.name}</p>
                  <p className="text-xs text-steel-600 line-clamp-2">{template.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
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
  );
}
