#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CardDefinition, CardColor, CardType } from '../packages/shared/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_BASE_URL = 'https://www.gundam-gcg.com';
const DEFAULT_CARDS_URL = `${DEFAULT_BASE_URL}/en/cards/index.php`;
const USE_PLAYWRIGHT = process.env.GUNDAM_GCG_USE_PLAYWRIGHT !== 'false';

const CARD_ID_PATTERN = /^(?:[A-Z]{2,4}\d{2}|[A-Z]{2,4})-\d{3,4}$/;

const ID_KEYS = ['card_no', 'cardNo', 'card_id', 'cardId', 'card_number', 'cardNumber', 'cardcode', 'cardCode', 'id', 'no', 'number'];
const NAME_KEYS = ['name', 'card_name', 'cardName', 'card_title', 'cardTitle', 'title'];
const COLOR_KEYS = ['color', 'card_color', 'cardColor', 'colour'];
const TYPE_KEYS = ['type', 'card_type', 'cardType'];
const COST_KEYS = ['cost', 'card_cost', 'cardCost', 'level', 'resource'];
const AP_KEYS = ['ap', 'attack', 'atk', 'attack_points', 'attackPoints', 'power'];
const HP_KEYS = ['hp', 'defense', 'def', 'defense_points', 'defensePoints', 'health'];
const TEXT_KEYS = ['text', 'effect', 'card_text', 'cardText', 'skill', 'ability'];
const SET_KEYS = ['set', 'set_name', 'setName', 'series', 'product'];
const SET_CODE_KEYS = ['set_code', 'setCode', 'set_id', 'setId'];
const IMAGE_KEYS = ['image', 'image_url', 'imageUrl', 'image_path', 'img', 'thumb', 'thumbnail', 'card_image', 'cardImage'];
const TRAITS_KEYS = ['traits', 'trait', 'attribute', 'attributes', 'tags'];

interface OfficialCardCandidate {
  id?: string;
  name?: string;
  color?: string;
  type?: string;
  cost?: number;
  ap?: number;
  hp?: number;
  text?: string;
  set?: string;
  setCode?: string;
  imageUrl?: string;
  traits?: string[];
}

interface DiscoveredCardLink {
  id: string;
  name?: string;
  detailUrl?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getEnv = (key: string, fallback: string): string => process.env[key] || fallback;

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Gundam-Forge-Sync/1.0 (+https://github.com/Epetaway/Gundam-Forge)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return await response.text();
};

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Gundam-Forge-Sync/1.0 (+https://github.com/Epetaway/Gundam-Forge)',
      'Accept': 'application/json,text/plain,*/*',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}`);
  }
};

const fetchRenderedPayloads = async (url: string): Promise<unknown[]> => {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const payloads: unknown[] = [];

    page.on('response', async (response) => {
      try {
        const resourceType = response.request().resourceType();
        const contentType = response.headers()['content-type'] || '';
        if ((resourceType === 'xhr' || resourceType === 'fetch') && contentType.includes('application/json')) {
          const json = await response.json();
          payloads.push(json);
        }
      } catch {
        // ignore response parsing errors
      }
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const globals = await page.evaluate(() => {
      const win = window as any;
      return {
        nuxt: win.__NUXT__ ?? null,
        next: win.__NEXT_DATA__ ?? null,
        state: win.__INITIAL_STATE__ ?? win.__STATE__ ?? null,
      };
    });

    if (globals.nuxt) payloads.push(globals.nuxt);
    if (globals.next) payloads.push(globals.next);
    if (globals.state) payloads.push(globals.state);

    const html = await page.content();
    payloads.push(...extractJsonPayloads(html));

    await browser.close();
    return payloads;
  } catch (error) {
    console.warn(`  ⚠️  Playwright render failed: ${error}`);
    return [];
  }
};

interface DetailCardData {
  detailUrl: string;
  detailSearch?: string;
  cardNo?: string;
  name?: string;
  rarity?: string;
  imageUrl?: string;
  overview?: string;
  pairs: Array<{ label: string; value: string }>;
}

const normalizeDetailValue = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === '-') return undefined;
  return trimmed;
};

const normalizeEffectText = (value?: string): string | undefined => {
  const trimmed = normalizeDetailValue(value);
  if (!trimmed) return undefined;
  return trimmed.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
};

const normalizeSetFromWhere = (value?: string): string | undefined => {
  const trimmed = normalizeDetailValue(value);
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(.*)\[(.+)\]$/);
  if (match) {
    const setName = match[1].trim();
    const setCode = match[2].trim();
    return `${setCode} - ${setName}`;
  }
  return trimmed;
};

const normalizeCardNoFromDetail = (cardNo?: string, detailSearch?: string): string | undefined => {
  const direct = normalizeDetailValue(cardNo);
  if (direct) return direct;
  if (!detailSearch) return undefined;
  const base = detailSearch.split('_')[0];
  return normalizeDetailValue(base);
};

const mapDetailToCard = (detail: DetailCardData): CardDefinition | null => {
  const cardNo = normalizeCardNoFromDetail(detail.cardNo, detail.detailSearch);
  const name = normalizeDetailValue(detail.name);
  if (!cardNo || !name) return null;

  const labelMap = new Map<string, string>();
  for (const pair of detail.pairs) {
    if (pair.label) labelMap.set(pair.label, pair.value);
  }

  const level = asNumber(labelMap.get('Lv.') ?? labelMap.get('Lv') ?? labelMap.get('Level'));
  const cost = asNumber(labelMap.get('COST') ?? labelMap.get('Cost')) ?? 0;
  const colorRaw = normalizeDetailValue(labelMap.get('COLOR') ?? labelMap.get('Color'));
  const typeRaw = normalizeDetailValue(labelMap.get('TYPE') ?? labelMap.get('Type'));
  const ap = asNumber(labelMap.get('AP'));
  const hp = asNumber(labelMap.get('HP'));
  const zone = normalizeDetailValue(labelMap.get('Zone'));
  const traitRaw = normalizeDetailValue(labelMap.get('Trait'));
  const linkCondition = normalizeDetailValue(labelMap.get('Link'));
  const sourceTitle = normalizeDetailValue(labelMap.get('Source Title'));
  const where = normalizeDetailValue(labelMap.get('Where to get it'));

  const traits = normalizeTraits(traitRaw) || [];
  if (sourceTitle && !traits.includes(sourceTitle)) {
    traits.push(sourceTitle);
  }

  const set = normalizeSetFromWhere(where) || sourceTitle || 'Unknown Set';

  return {
    id: cardNo,
    name,
    color: normalizeColor(colorRaw),
    cost,
    type: normalizeType(typeRaw),
    set,
    text: normalizeEffectText(detail.overview),
    ap: ap ?? undefined,
    hp: hp ?? undefined,
    level: level ?? undefined,
    traits: traits.length > 0 ? traits : undefined,
    zone,
    linkCondition,
    imageUrl: normalizeImageUrl(detail.imageUrl, detail.detailUrl),
    placeholderArt: buildPlaceholderArt(name),
  };
};

const fetchDetailCardsWithPlaywright = async (listUrl: string, limit?: number): Promise<CardDefinition[]> => {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 45000 });
    const detailLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.cardItem .cardStr')) as HTMLAnchorElement[];
      return links
        .map((link) => link.getAttribute('data-src') || link.getAttribute('href') || '')
        .filter((value) => value.length > 0)
        .map((value) => new URL(value, window.location.href).toString());
    });

    const uniqueLinks = Array.from(new Set(detailLinks));
    const limitedLinks = limit ? uniqueLinks.slice(0, limit) : uniqueLinks;
    const results: CardDefinition[] = [];

    for (const detailUrl of limitedLinks) {
      await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 45000 });
      const detailSearch = new URL(detailUrl).searchParams.get('detailSearch') || undefined;
      const detailData = await page.evaluate(() => {
        const cardNoEl = document.querySelector('.cardNo');
        const nameEl = document.querySelector('h1');
        const rarityEl = document.querySelector('.cardRarity, .rarity');

        const pairs = Array.from(document.querySelectorAll('dl')).flatMap((dl) =>
          Array.from(dl.querySelectorAll('dt')).map((dt) => ({
            label: dt.textContent?.trim() || '',
            value: dt.nextElementSibling?.textContent?.trim() || '',
          }))
        );

        const overview = document.querySelector('.cardDataRow.overview .dataTxt')?.textContent?.trim() || '';
        const imageUrl =
          document.querySelector('.cardStr img')?.getAttribute('src') ||
          document.querySelector('.cardImg img')?.getAttribute('src') ||
          document.querySelector('.cardImage img')?.getAttribute('src') ||
          document.querySelector('img')?.getAttribute('src') || '';

        return {
          cardNo: cardNoEl?.textContent?.trim() || '',
          name: nameEl?.textContent?.trim() || '',
          rarity: rarityEl?.textContent?.trim() || '',
          imageUrl,
          overview,
          pairs,
        };
      });

      const mapped = mapDetailToCard({
        detailUrl,
        detailSearch,
        cardNo: detailData.cardNo,
        name: detailData.name,
        rarity: detailData.rarity,
        imageUrl: detailData.imageUrl,
        overview: detailData.overview,
        pairs: detailData.pairs,
      });

      if (mapped) {
        results.push(mapped);
      }

      await sleep(80);
    }

    await browser.close();
    return results;
  } catch (error) {
    console.warn(`  ⚠️  Playwright detail scrape failed: ${error}`);
    return [];
  }
};

const resolveUrl = (source: string, baseUrl: string): string => {
  try {
    return new URL(source, baseUrl).toString();
  } catch {
    return source;
  }
};

const extractScriptSources = (html: string, baseUrl: string): string[] => {
  const results: string[] = [];
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>/gi;
  let match = scriptRegex.exec(html);
  while (match) {
    const src = match[1];
    if (src) results.push(resolveUrl(src, baseUrl));
    match = scriptRegex.exec(html);
  }
  return results;
};

const extractEndpointHints = (html: string, baseUrl: string): string[] => {
  const results = new Set<string>();
  const attrRegex = /(data-api|data-url|data-endpoint)="([^"]+)"/gi;
  let match = attrRegex.exec(html);
  while (match) {
    results.add(resolveUrl(match[2], baseUrl));
    match = attrRegex.exec(html);
  }
  const urlRegex = /(\/[^\s"']*cards[^\s"']*)/gi;
  match = urlRegex.exec(html);
  while (match) {
    results.add(resolveUrl(match[1], baseUrl));
    match = urlRegex.exec(html);
  }
  return Array.from(results);
};

const extractFetchEndpoints = (scriptText: string, baseUrl: string): string[] => {
  const results = new Set<string>();
  const fetchRegex = /(fetch|axios\.(?:get|post)|axios)\(\s*['"`]([^'"`]+)['"`]/gi;
  let match = fetchRegex.exec(scriptText);
  while (match) {
    const endpoint = match[2];
    if (endpoint.includes('card')) {
      results.add(resolveUrl(endpoint, baseUrl));
    }
    match = fetchRegex.exec(scriptText);
  }
  return Array.from(results);
};

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return `${value}`;
  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
};

const firstString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    if (key in obj) {
      const val = asString(obj[key]);
      if (val) return val;
    }
  }
  return undefined;
};

const firstNumber = (obj: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in obj) {
      const val = asNumber(obj[key]);
      if (val !== undefined) return val;
    }
  }
  return undefined;
};

const normalizeColor = (value?: string): CardColor | undefined => {
  if (!value) return undefined;
  const cleaned = value.trim().toLowerCase();
  const mapping: Record<string, CardColor> = {
    blue: 'Blue',
    green: 'Green',
    red: 'Red',
    white: 'White',
    purple: 'Purple',
    colorless: 'Colorless',
    yellow: 'White',
    black: 'Colorless',
  };
  return mapping[cleaned];
};

const normalizeType = (value?: string): CardType | undefined => {
  if (!value) return undefined;
  const cleaned = value.trim().toLowerCase();
  const mapping: Record<string, CardType> = {
    unit: 'Unit',
    pilot: 'Pilot',
    command: 'Command',
    base: 'Base',
    resource: 'Resource',
  };
  return mapping[cleaned];
};

const normalizeTraits = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'string') {
    return value
      .split(/[\/|,]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return undefined;
};

const normalizeSet = (setCode?: string, setName?: string): string | undefined => {
  if (setCode && setName) return `${setCode} - ${setName}`;
  if (setName) return setName;
  if (setCode) return setCode;
  return undefined;
};

const normalizeImageUrl = (value?: string, baseUrl: string = DEFAULT_BASE_URL): string | undefined => {
  if (!value) return undefined;
  return resolveUrl(value, baseUrl);
};

const normalizeCandidate = (raw: Record<string, unknown>): OfficialCardCandidate | null => {
  const id = firstString(raw, ID_KEYS)?.toUpperCase();
  if (!id || !CARD_ID_PATTERN.test(id)) {
    return null;
  }

  const name = firstString(raw, NAME_KEYS);
  const color = firstString(raw, COLOR_KEYS);
  const type = firstString(raw, TYPE_KEYS);
  const cost = firstNumber(raw, COST_KEYS);
  const ap = firstNumber(raw, AP_KEYS);
  const hp = firstNumber(raw, HP_KEYS);
  const text = firstString(raw, TEXT_KEYS);
  const setName = firstString(raw, SET_KEYS);
  const setCode = firstString(raw, SET_CODE_KEYS);
  const imageUrl = normalizeImageUrl(firstString(raw, IMAGE_KEYS), DEFAULT_BASE_URL);
  const traits = normalizeTraits(raw[TRAITS_KEYS.find((key) => key in raw) ?? '']);

  return {
    id,
    name,
    color,
    type,
    cost,
    ap,
    hp,
    text,
    set: normalizeSet(setCode, setName),
    setCode,
    imageUrl,
    traits,
  };
};

const scoreCardArray = (cards: Record<string, unknown>[]): number => {
  let score = 0;
  for (const card of cards) {
    if (firstString(card, ID_KEYS)) score += 3;
    if (firstString(card, NAME_KEYS)) score += 2;
    if (firstString(card, TYPE_KEYS)) score += 1;
    if (firstString(card, COLOR_KEYS)) score += 1;
  }
  return score;
};

const findCardArrays = (value: unknown, depth = 0, maxDepth = 6): Record<string, unknown>[][] => {
  if (depth > maxDepth) return [];
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((item) => typeof item === 'object' && item !== null)) {
      return [value as Record<string, unknown>[]];
    }
    return value.flatMap((item) => findCardArrays(item, depth + 1, maxDepth));
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) => findCardArrays(item, depth + 1, maxDepth));
  }
  return [];
};

const extractJsonPayloads = (html: string): unknown[] => {
  const payloads: unknown[] = [];

  const jsonScriptRegex = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match = jsonScriptRegex.exec(html);
  while (match) {
    try {
      payloads.push(JSON.parse(match[1]));
    } catch {
      // ignore
    }
    match = jsonScriptRegex.exec(html);
  }

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      payloads.push(JSON.parse(nextDataMatch[1]));
    } catch {
      // ignore
    }
  }

  const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*([\s\S]*?);<\/script>/i);
  if (nuxtMatch) {
    try {
      payloads.push(JSON.parse(nuxtMatch[1]));
    } catch {
      // ignore
    }
  }

  return payloads;
};

const extractCardLinksFromHtml = (html: string, baseUrl: string): DiscoveredCardLink[] => {
  const results: DiscoveredCardLink[] = [];
  const hrefRegex = /href="([^"]*?)"/gi;
  let match = hrefRegex.exec(html);
  while (match) {
    const href = match[1];
    const idMatch = href.match(/(?:card_no|cardNo|cardid|card_id|id)=([A-Z0-9-]{4,})/i);
    if (idMatch) {
      const id = idMatch[1].toUpperCase();
      if (!CARD_ID_PATTERN.test(id)) {
        match = hrefRegex.exec(html);
        continue;
      }
      const detailUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
      const nameWindow = html.slice(Math.max(0, match.index - 200), Math.min(html.length, match.index + 200));
      const nameMatch = nameWindow.match(/alt="([^"]+)"|data-name="([^"]+)"|data-card-name="([^"]+)"/i);
      const name = nameMatch?.[1] || nameMatch?.[2] || nameMatch?.[3];
      results.push({ id, name, detailUrl });
    }
    match = hrefRegex.exec(html);
  }

  const dataIdRegex = /data-card-id="([A-Z0-9-]{4,})"/gi;
  match = dataIdRegex.exec(html);
  while (match) {
    const id = match[1].toUpperCase();
    if (CARD_ID_PATTERN.test(id)) {
      results.push({ id });
    }
    match = dataIdRegex.exec(html);
  }

  return results;
};

const mergeCards = (existing: CardDefinition[], incoming: CardDefinition[]): CardDefinition[] => {
  const byId = new Map<string, CardDefinition>();
  for (const card of existing) {
    byId.set(card.id, card);
  }

  for (const card of incoming) {
    const prior = byId.get(card.id);
    if (prior) {
      const merged: CardDefinition = {
        ...prior,
        ...card,
        placeholderArt: card.placeholderArt || prior.placeholderArt,
        imageUrl: card.imageUrl || prior.imageUrl,
        price: prior.price,
      };
      byId.set(card.id, merged);
    } else {
      byId.set(card.id, card);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
};

const buildPlaceholderArt = (name: string): string => {
  const encoded = encodeURIComponent(name || 'Card');
  return `https://placehold.co/600x840/1f2937/f9fafb?text=${encoded}`;
};

const parseCardArray = (rawCards: Record<string, unknown>[]): OfficialCardCandidate[] => {
  const normalized: OfficialCardCandidate[] = [];
  for (const raw of rawCards) {
    const candidate = normalizeCandidate(raw);
    if (candidate) normalized.push(candidate);
  }
  return normalized;
};

const collectCardsFromJsonPayloads = (payloads: unknown[]): OfficialCardCandidate[] => {
  let best: Record<string, unknown>[] | null = null;
  let bestScore = 0;

  for (const payload of payloads) {
    const arrays = findCardArrays(payload);
    for (const array of arrays) {
      const score = scoreCardArray(array);
      if (score > bestScore) {
        bestScore = score;
        best = array;
      }
    }
  }

  if (!best || bestScore === 0) return [];
  return parseCardArray(best);
};

const toCardDefinition = (candidate: OfficialCardCandidate, fallback?: CardDefinition): CardDefinition | null => {
  if (!candidate.id || !candidate.name) return null;
  const color = normalizeColor(candidate.color) || fallback?.color || 'Colorless';
  const type = normalizeType(candidate.type) || fallback?.type || 'Unit';
  const cost = candidate.cost ?? fallback?.cost ?? 0;
  const set = candidate.set || fallback?.set || 'Unknown Set';

  return {
    id: candidate.id,
    name: candidate.name,
    color,
    cost,
    type,
    set,
    text: candidate.text || fallback?.text,
    ap: candidate.ap ?? fallback?.ap,
    hp: candidate.hp ?? fallback?.hp,
    traits: candidate.traits || fallback?.traits,
    imageUrl: candidate.imageUrl || fallback?.imageUrl,
    placeholderArt: fallback?.placeholderArt || buildPlaceholderArt(candidate.name),
    price: fallback?.price,
  };
};

const fetchDetailCandidates = async (
  links: DiscoveredCardLink[],
  detailTemplate?: string,
  delayMs = 200
): Promise<OfficialCardCandidate[]> => {
  const results: OfficialCardCandidate[] = [];
  for (const link of links) {
    const url = link.detailUrl || (detailTemplate ? detailTemplate.replace('{id}', link.id) : undefined);
    if (!url) continue;

    try {
      const html = await fetchText(url);
      const payloads = extractJsonPayloads(html);
      const candidates = collectCardsFromJsonPayloads(payloads);
      if (candidates.length > 0) {
        results.push(...candidates);
      } else {
        const name = link.name;
        results.push({ id: link.id, name });
      }
    } catch {
      results.push({ id: link.id, name: link.name });
    }

    await sleep(delayMs);
  }
  return results;
};

const main = async () => {
  const cardsUrl = getEnv('GUNDAM_GCG_CARDS_URL', DEFAULT_CARDS_URL);
  if (cardsUrl.includes('#')) {
    console.warn('  ⚠️  URL hash fragments are ignored during fetch.');
  }
  const detailTemplate = process.env.GUNDAM_GCG_CARD_DETAIL_TEMPLATE;
  const pageLimit = Number(process.env.GUNDAM_GCG_PAGE_LIMIT || '0');
  const detailLimit = Number(process.env.GUNDAM_GCG_DETAIL_LIMIT || '0');
  const outputPath = path.join(projectRoot, 'apps', 'web', 'src', 'data', 'cards.json');

  console.log('🔄 Syncing official cards');
  console.log(`  Source: ${cardsUrl}`);

  const listHtml = await fetchText(cardsUrl);
  const payloads = extractJsonPayloads(listHtml);
  let candidates = collectCardsFromJsonPayloads(payloads);

  let discoveredLinks: DiscoveredCardLink[] = [];
  if (candidates.length === 0) {
    discoveredLinks = extractCardLinksFromHtml(listHtml, DEFAULT_BASE_URL);
  }

  let discoveredEndpoints = extractEndpointHints(listHtml, DEFAULT_BASE_URL);
  if (candidates.length === 0 && discoveredEndpoints.length === 0) {
    const scriptSources = extractScriptSources(listHtml, DEFAULT_BASE_URL);
    for (const scriptUrl of scriptSources) {
      try {
        const scriptText = await fetchText(scriptUrl);
        discoveredEndpoints = discoveredEndpoints.concat(
          extractFetchEndpoints(scriptText, DEFAULT_BASE_URL)
        );
      } catch {
        // ignore script fetch failures
      }
      await sleep(50);
    }
  }

  if (candidates.length === 0 && USE_PLAYWRIGHT) {
    const renderedPayloads = await fetchRenderedPayloads(cardsUrl);
    if (renderedPayloads.length > 0) {
      candidates = collectCardsFromJsonPayloads(renderedPayloads);
    }
  }

  const pageMatch = listHtml.match(/(\d+)\s*\/\s*(\d+)/);
  const totalPages = pageMatch ? Number(pageMatch[2]) : 1;
  const pagesToFetch = pageLimit > 0 ? Math.min(pageLimit, totalPages) : totalPages;

  if (pagesToFetch > 1) {
    for (let page = 2; page <= pagesToFetch; page += 1) {
      const pageUrl = cardsUrl.includes('?') ? `${cardsUrl}&page=${page}` : `${cardsUrl}?page=${page}`;
      try {
        const html = await fetchText(pageUrl);
        const pagePayloads = extractJsonPayloads(html);
        const pageCandidates = collectCardsFromJsonPayloads(pagePayloads);
        if (pageCandidates.length > 0) {
          candidates = candidates.concat(pageCandidates);
        } else {
          discoveredLinks = discoveredLinks.concat(extractCardLinksFromHtml(html, DEFAULT_BASE_URL));
        }
      } catch (error) {
        console.warn(`  ⚠️  Failed to fetch page ${page}: ${error}`);
      }
      await sleep(150);
    }
  }

  if (candidates.length === 0 && discoveredEndpoints.length > 0) {
    for (const endpoint of discoveredEndpoints) {
      try {
        const json = await fetchJson(endpoint);
        const endpointCandidates = collectCardsFromJsonPayloads([json]);
        if (endpointCandidates.length > 0) {
          candidates = candidates.concat(endpointCandidates);
          break;
        }
      } catch {
        // continue
      }
      await sleep(50);
    }
  }

  if (candidates.length === 0 && discoveredLinks.length > 0) {
    candidates = await fetchDetailCandidates(discoveredLinks, detailTemplate);
  }

  if (candidates.length === 0 && USE_PLAYWRIGHT) {
    const detailCards = await fetchDetailCardsWithPlaywright(
      cardsUrl,
      detailLimit > 0 ? detailLimit : undefined
    );

    if (detailCards.length > 0) {
      const existingRaw = await fs.readFile(outputPath, 'utf-8');
      const existingCards = JSON.parse(existingRaw) as CardDefinition[];
      const merged = mergeCards(existingCards, detailCards);
      await fs.writeFile(outputPath, JSON.stringify(merged, null, 2) + '\n');
      console.log(`✅ Synced ${detailCards.length} cards. Total now: ${merged.length}`);
      return;
    }
  }

  if (candidates.length === 0) {
    const hint = discoveredEndpoints.length > 0 ? ` Tried endpoints: ${discoveredEndpoints.slice(0, 5).join(', ')}` : '';
    throw new Error(`No card data found. Set GUNDAM_GCG_CARDS_URL or GUNDAM_GCG_CARD_DETAIL_TEMPLATE.${hint}`);
  }

  const uniqueCandidates = new Map<string, OfficialCardCandidate>();
  for (const candidate of candidates) {
    if (!candidate.id) continue;
    if (!uniqueCandidates.has(candidate.id)) {
      uniqueCandidates.set(candidate.id, candidate);
    }
  }

  const existingRaw = await fs.readFile(outputPath, 'utf-8');
  const existingCards = JSON.parse(existingRaw) as CardDefinition[];
  const existingById = new Map(existingCards.map((card) => [card.id, card] as const));

  const normalized: CardDefinition[] = [];
  for (const candidate of uniqueCandidates.values()) {
    const fallback = candidate.id ? existingById.get(candidate.id) : undefined;
    const card = toCardDefinition(candidate, fallback);
    if (card) normalized.push(card);
  }

  const merged = mergeCards(existingCards, normalized);
  await fs.writeFile(outputPath, JSON.stringify(merged, null, 2) + '\n');

  console.log(`✅ Synced ${normalized.length} cards. Total now: ${merged.length}`);
};

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
