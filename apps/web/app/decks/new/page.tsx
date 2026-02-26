import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseDeckList } from '@/app/forge/parseDeckList';
import { matchDeckEntries, CardMatchResult } from '@/app/forge/cardMatching';
import { ImportResultsSummary } from '@/app/forge/ImportResultsSummary';
// import { createDeckApi } from '@/lib/api/decks'; // TODO: implement or adapt to your API

export default function CreateDeckPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    visibility: 'private',
    archetype: '',
    description: '',
    pasteList: '',
  });
  const [importResults, setImportResults] = useState<CardMatchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const parsed = parseDeckList(form.pasteList);
    // TODO: fetch cardDb from API or context
    const cardDb: any[] = [];
    const results = matchDeckEntries(parsed, cardDb);
    setImportResults(results);
    // TODO: implement deck creation and navigation if all matched
    setSubmitting(false);
  }

  return (
    <form className="max-w-xl mx-auto p-6" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold mb-4">Create New Deck</h1>
      <label className="block mb-2 font-semibold">Deck Name *</label>
      <input className="w-full mb-4 p-2 border rounded" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <label className="block mb-2 font-semibold">Visibility *</label>
      <select className="w-full mb-4 p-2 border rounded" required value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
        <option value="private">Private</option>
        <option value="unlisted">Unlisted</option>
        <option value="public">Public</option>
      </select>
      <label className="block mb-2 font-semibold">Archetype</label>
      <input className="w-full mb-4 p-2 border rounded" value={form.archetype} onChange={e => setForm(f => ({ ...f, archetype: e.target.value }))} />
      <label className="block mb-2 font-semibold">Description</label>
      <textarea className="w-full mb-4 p-2 border rounded" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <label className="block mb-2 font-semibold">Paste Deck List *</label>
      <textarea className="w-full mb-4 p-2 border rounded h-40" required value={form.pasteList} onChange={e => setForm(f => ({ ...f, pasteList: e.target.value }))} placeholder="e.g.\n4 Sinanju\n2 Zaku II" />
      <button className="w-full bg-cobalt-600 text-white font-bold py-2 rounded" type="submit" disabled={submitting}>Create Deck</button>
      {importResults && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Import Results</h2>
          <ImportResultsSummary results={importResults} />
        </div>
      )}
    </form>
  );
}
