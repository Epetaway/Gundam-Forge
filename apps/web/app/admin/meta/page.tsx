'use client';

import { useMemo, useState } from 'react';

type ApiResponse = {
  ok: boolean;
  error?: string;
  mode?: string;
  dryRunReport?: {
    enabled: boolean;
    sources: string[];
    snapshotDate: string;
    archetypeCount: number;
    cardPerformanceCount: number;
  };
  validationErrors?: string[];
  mergedPayload?: unknown;
  ingested?: {
    source: string;
    snapshotDate: string;
    archetypes: number;
    cardPerformance: number;
  };
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId?: string;
};

const EXAMPLE_PAYLOAD = {
  payload: {
    source: 'manual-admin',
    version: 'v1',
    snapshotDate: '2026-03-06',
    topArchetypes: ['wing-zero', 'zeon-rush'],
    archetypes: [
      { archetypeId: 'wing-zero', rank: 1, winRate: 0.62, playRate: 0.31, trendDirection: 'up' },
      { archetypeId: 'zeon-rush', rank: 2, winRate: 0.58, playRate: 0.27, trendDirection: 'flat' },
    ],
    cardPerformance: [
      { cardId: 'GD02-079', archetypeId: 'wing-zero', inclusionRate: 0.84, winImpact: 0.12, sampleSize: 120 },
    ],
    notes: 'Admin dashboard seed payload',
  },
};

export default function AdminMetaPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [payloadText, setPayloadText] = useState(JSON.stringify(EXAMPLE_PAYLOAD, null, 2));

  const headers = useMemo(() => {
    const nextHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token.trim()) {
      nextHeaders['x-meta-admin-token'] = token.trim();
    }
    return nextHeaders;
  }, [token]);

  async function runAutoDetectDryRun() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/meta', {
        method: 'POST',
        headers,
        body: JSON.stringify({ dryRun: true }),
      });
      const json = (await res.json()) as ApiEnvelope<ApiResponse>;
      setResponse(json.data ?? { ok: false, error: json.error ?? 'Unknown API error' });
    } finally {
      setLoading(false);
    }
  }

  async function submitPayload() {
    setLoading(true);
    try {
      const parsed = JSON.parse(payloadText);
      const res = await fetch('/api/admin/meta', {
        method: 'POST',
        headers,
        body: JSON.stringify(parsed),
      });
      const json = (await res.json()) as ApiEnvelope<ApiResponse>;
      setResponse(json.data ?? { ok: false, error: json.error ?? 'Unknown API error' });
    } catch (error) {
      setResponse({ ok: false, error: `Invalid JSON payload: ${String(error)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-surface-foreground">Meta Admin Dashboard</h1>
      <p className="mt-2 text-sm text-surface-foreground/80">
        Phase 16.5 tooling for meta ingestion. Run auto-detect dry runs or submit validated payloads.
      </p>

      <section className="mt-6 rounded-lg border border-steel-700 bg-surface-900/70 p-4">
        <label className="mb-2 block text-sm text-surface-foreground/90" htmlFor="token-input">
          Admin Token (optional)
        </label>
        <input
          id="token-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="x-meta-admin-token"
          className="w-full rounded-md border border-steel-700 bg-surface-950 px-4 py-2 text-sm text-surface-foreground"
        />

        <div className="mt-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={runAutoDetectDryRun}
            disabled={loading}
            className="rounded-md bg-cobalt-600 px-4 py-2 text-sm font-medium text-white hover:bg-cobalt-500 disabled:opacity-60"
          >
            Run Auto-Detect Dry Run
          </button>
          <button
            type="button"
            onClick={submitPayload}
            disabled={loading}
            className="rounded-md bg-steel-700 px-4 py-2 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            Submit Payload
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-steel-700 bg-surface-900/70 p-4">
        <h2 className="text-lg font-medium text-surface-foreground">Payload Editor</h2>
        <textarea
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          className="mt-4 h-72 w-full rounded-md border border-steel-700 bg-surface-950 p-4 font-mono text-xs text-surface-foreground"
          spellCheck={false}
        />
      </section>

      <section className="mt-6 rounded-lg border border-steel-700 bg-surface-900/70 p-4">
        <h2 className="text-lg font-medium text-surface-foreground">Latest Response</h2>
        <pre className="mt-4 max-h-[28rem] overflow-auto rounded-md bg-surface-950 p-4 text-xs text-surface-foreground">
          {JSON.stringify(response ?? { ok: true, note: 'No requests yet.' }, null, 2)}
        </pre>
      </section>
    </main>
  );
}
