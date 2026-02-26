import React from 'react';
import type { CardMatchResult } from './cardMatching';

export function ImportResultsSummary({ results }: { results: CardMatchResult }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="font-bold text-green-700">Matched:</span>
        <ul className="list-disc ml-6 text-sm">
          {results.matched.map(({ entry, card }) => (
            <li key={entry.originalLine}>{entry.qty}x {card.name}</li>
          ))}
        </ul>
      </div>
      {results.ambiguous.length > 0 && (
        <div>
          <span className="font-bold text-yellow-700">Ambiguous:</span>
          <ul className="list-disc ml-6 text-sm">
            {results.ambiguous.map(({ entry, options }) => (
              <li key={entry.originalLine}>
                {entry.qty}x {entry.name} (multiple matches: {options.map(o => o.name).join(', ')})
              </li>
            ))}
          </ul>
        </div>
      )}
      {results.unmatched.length > 0 && (
        <div>
          <span className="font-bold text-red-700">Unmatched:</span>
          <ul className="list-disc ml-6 text-sm">
            {results.unmatched.map(entry => (
              <li key={entry.originalLine}>{entry.qty}x {entry.name} (from: "{entry.originalLine}")</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
