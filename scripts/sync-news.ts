#!/usr/bin/env tsx
/**
 * sync-news.ts — Fetch news articles and tournament results from gundam-gcg.com
 *
 * Primary source: https://www.gundam-gcg.com/en/news
 * Tournament/event source: https://www.gundam-gcg.com/en/event (or /en/tournament)
 *
 * Outputs:
 *   apps/web/lib/data/news.json          — article catalog (lib-accessible)
 *   apps/web/public/data/news.json       — article catalog (static-served)
 *   apps/web/lib/data/tournament.json    — tournament results
 *   apps/web/public/data/tournament.json — tournament results (static-served)
 *
 * Usage:
 *   npm run sync-news
 *
 * Environment variables:
 *   GUNDAM_GCG_NEWS_URL       Override news page URL (default: https://www.gundam-gcg.com/en/news)
 *   GUNDAM_GCG_EVENT_URL      Override event page URL (default: https://www.gundam-gcg.com/en/event)
 *   GUNDAM_GCG_USE_PLAYWRIGHT Enable headless rendering (default: true)
 *   GUNDAM_GCG_FETCH_TIMEOUT_MS Request timeout in ms (default: 30000)
 *   GUNDAM_GCG_NEWS_LIMIT     Max articles to fetch (0 = all, default: 0)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const OFFICIAL_BASE = 'https://www.gundam-gcg.com';
const DEFAULT_NEWS_URL = `${OFFICIAL_BASE}/en/news`;
const DEFAULT_EVENT_URL = `${OFFICIAL_BASE}/en/event`;

const USE_PLAYWRIGHT = process.env.GUNDAM_GCG_USE_PLAYWRIGHT !== 'false';
const FETCH_TIMEOUT_MS = Number(process.env.GUNDAM_GCG_FETCH_TIMEOUT_MS ?? '30000');
const NEWS_LIMIT = Number(process.env.GUNDAM_GCG_NEWS_LIMIT ?? '0');

// ── Types ──────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  url: string;
  imageUrl?: string;
  tags: string[];
  source: 'official';
}

export interface TournamentPlacement {
  placement: number;
  player?: string;
  deckName?: string;
  archetype?: string;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface TournamentResult {
  id: string;
  name: string;
  date: string;
  location?: string;
  format?: string;
  playerCount?: number;
  placements: TournamentPlacement[];
  url: string;
  source: 'official';
}

// ── Utilities ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const cleanText = (value: string): string =>
  decodeHtmlEntities(value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Gundam-Forge-Sync/1.0 (+https://github.com/Epetaway/Gundam-Forge)',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function extractJsonBlobs(html: string): unknown[] {
  const results: unknown[] = [];

  const scriptJsonRe = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m = scriptJsonRe.exec(html);
  while (m) {
    try { results.push(JSON.parse(m[1])); } catch { /* ignore */ }
    m = scriptJsonRe.exec(html);
  }

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try { results.push(JSON.parse(nextDataMatch[1])); } catch { /* ignore */ }
  }

  const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*([\s\S]*?);\s*<\/script>/i);
  if (nuxtMatch) {
    try { results.push(JSON.parse(nuxtMatch[1])); } catch { /* ignore */ }
  }

  return results;
}

// ── News extraction ────────────────────────────────────────────────────────

function extractArticlesFromHtml(html: string, baseUrl: string): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Common patterns for news list items on TCG/Bandai sites
  // Pattern 1: article/news list items with links
  const itemPatterns = [
    // <li class="...newsItem..."> or <article ...>
    /<(?:li|article|div)[^>]*class="[^"]*(?:news|article|post)[^"]*"[^>]*>([\s\S]*?)<\/(?:li|article|div)>/gi,
    // Generic list items with dates and titles
    /<li[^>]*>([\s\S]*?<a[^>]*href="[^"]*news[^"]*"[^>]*>[\s\S]*?<\/a>[\s\S]*?)<\/li>/gi,
  ];

  for (const pattern of itemPatterns) {
    let match = pattern.exec(html);
    while (match) {
      const block = match[1];

      // Extract href
      const hrefMatch = block.match(/href="([^"]+)"/i);
      if (!hrefMatch) { match = pattern.exec(html); continue; }
      const url = resolveUrl(hrefMatch[1], baseUrl);

      // Extract title (prefer <h2>, <h3>, or .title element)
      const titleMatch = block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)
        || block.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i)
        || block.match(/>([\w][\s\S]{5,100}?)</i);
      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      if (!title) { match = pattern.exec(html); continue; }

      // Extract date
      const dateMatch = block.match(/<time[^>]*(?:datetime="([^"]+)")?[^>]*>([\s\S]*?)<\/time>/i)
        || block.match(/(\d{4}[-./]\d{2}[-./]\d{2})/);
      const rawDate = dateMatch?.[1] || dateMatch?.[2] || '';
      const date = rawDate.replace(/\//g, '-').replace(/\./g, '-').slice(0, 10);

      // Extract category
      const catMatch = block.match(/class="[^"]*(?:cat|category|tag)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i);
      const category = catMatch ? cleanText(catMatch[1]) : 'news';

      // Extract summary
      const summaryMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const summary = summaryMatch ? cleanText(summaryMatch[1]).slice(0, 300) : '';

      // Extract thumbnail
      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const imageUrl = imgMatch ? resolveUrl(imgMatch[1], baseUrl) : undefined;

      const id = slugify(`${date}-${title}`) || `article-${articles.length}`;

      articles.push({
        id,
        title,
        date,
        category: category.toLowerCase(),
        summary,
        url,
        imageUrl,
        tags: inferTags(title + ' ' + summary),
        source: 'official',
      });

      match = pattern.exec(html);
    }
    if (articles.length > 0) break;
  }

  return articles;
}

function inferTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (/tournament|championship|qualifier|regional/i.test(lower)) tags.push('tournament');
  if (/new card|card release|set release|expansion/i.test(lower)) tags.push('new-cards');
  if (/ban|restrict|limit|forbidden/i.test(lower)) tags.push('banlist');
  if (/rule|errata|faq|ruling/i.test(lower)) tags.push('rules');
  if (/meta|tier|deck/i.test(lower)) tags.push('meta');
  if (/promo|exclusive|special/i.test(lower)) tags.push('promo');
  return tags;
}

// ── News via Playwright ────────────────────────────────────────────────────

async function fetchNewsWithPlaywright(newsUrl: string, limit?: number): Promise<NewsArticle[]> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(newsUrl, { waitUntil: 'networkidle', timeout: 45000 });

    const articles = await page.evaluate((baseUrl) => {
      const results: Array<{
        title: string; date: string; category: string; summary: string;
        url: string; imageUrl?: string;
      }> = [];

      // Try common selectors for news listing pages
      const selectors = [
        '.newsItem', '.news-item', '.news__item', 'article.news',
        'li.news', '.postItem', '.article-item', '.topicItem',
      ];

      for (const sel of selectors) {
        const items = Array.from(document.querySelectorAll(sel));
        if (items.length === 0) continue;

        for (const item of items) {
          const a = item.querySelector('a[href]') as HTMLAnchorElement | null;
          const href = a?.href || '';
          const titleEl = item.querySelector('h1, h2, h3, h4, .title, .headline');
          const title = titleEl?.textContent?.trim() || '';
          const timeEl = item.querySelector('time');
          const date = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '';
          const catEl = item.querySelector('.category, .cat, .tag');
          const category = catEl?.textContent?.trim() || 'news';
          const summaryEl = item.querySelector('p, .summary, .excerpt');
          const summary = summaryEl?.textContent?.trim().slice(0, 300) || '';
          const imgEl = item.querySelector('img') as HTMLImageElement | null;
          const imageUrl = imgEl?.src;

          if (title && href) {
            results.push({ title, date, category, summary, url: href, imageUrl });
          }
        }
        if (results.length > 0) break;
      }

      // Fallback: grab all news-like links
      if (results.length === 0) {
        const links = Array.from(document.querySelectorAll('a[href*="news"]')) as HTMLAnchorElement[];
        for (const link of links) {
          const title = link.textContent?.trim() || '';
          if (title.length > 5) {
            results.push({ title, date: '', category: 'news', summary: '', url: link.href });
          }
        }
      }

      return results;
    }, OFFICIAL_BASE);

    await browser.close();

    const limited = limit ? articles.slice(0, limit) : articles;
    return limited.map((a, i) => ({
      id: slugify(`${a.date}-${a.title}`) || `article-${i}`,
      title: a.title,
      date: a.date.replace(/\//g, '-').replace(/\./g, '-').slice(0, 10),
      category: a.category.toLowerCase(),
      summary: a.summary,
      url: a.url,
      imageUrl: a.imageUrl,
      tags: inferTags(a.title + ' ' + a.summary),
      source: 'official' as const,
    }));
  } catch (error) {
    console.warn(`  ⚠️  Playwright news fetch failed: ${error}`);
    return [];
  }
}

// ── Tournament extraction ──────────────────────────────────────────────────

function extractTournamentsFromHtml(html: string, baseUrl: string): TournamentResult[] {
  const results: TournamentResult[] = [];

  // Look for event/tournament list items
  const patterns = [
    /<(?:li|article|div)[^>]*class="[^"]*(?:event|tournament|result)[^"]*"[^>]*>([\s\S]*?)<\/(?:li|article|div)>/gi,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(html);
    while (match) {
      const block = match[1];

      const hrefMatch = block.match(/href="([^"]+)"/i);
      const url = hrefMatch ? resolveUrl(hrefMatch[1], baseUrl) : baseUrl;

      const titleMatch = block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)
        || block.match(/class="[^"]*(?:title|name)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i);
      const name = titleMatch ? cleanText(titleMatch[1]) : '';
      if (!name) { match = pattern.exec(html); continue; }

      const dateMatch = block.match(/<time[^>]*(?:datetime="([^"]+)")?[^>]*>([\s\S]*?)<\/time>/i)
        || block.match(/(\d{4}[-./]\d{2}[-./]\d{2})/);
      const date = (dateMatch?.[1] || dateMatch?.[2] || '').replace(/[./]/g, '-').slice(0, 10);

      const countMatch = block.match(/(\d+)\s*(?:players?|participants?|entries)/i);
      const playerCount = countMatch ? Number(countMatch[1]) : undefined;

      const locationMatch = block.match(/(?:location|venue|place)[:\s]+([^<\n]+)/i);
      const location = locationMatch ? cleanText(locationMatch[1]) : undefined;

      results.push({
        id: slugify(`${date}-${name}`) || `event-${results.length}`,
        name,
        date,
        location,
        format: inferFormat(name),
        playerCount,
        placements: [],
        url,
        source: 'official',
      });

      match = pattern.exec(html);
    }
    if (results.length > 0) break;
  }

  return results;
}

function inferFormat(name: string): string {
  const lower = name.toLowerCase();
  if (/championship/i.test(lower)) return 'championship';
  if (/regional/i.test(lower)) return 'regional';
  if (/qualifier/i.test(lower)) return 'qualifier';
  if (/invitational/i.test(lower)) return 'invitational';
  return 'standard';
}

async function fetchTournamentsWithPlaywright(eventUrl: string, limit?: number): Promise<TournamentResult[]> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(eventUrl, { waitUntil: 'networkidle', timeout: 45000 });

    const events = await page.evaluate(() => {
      const results: Array<{
        name: string; date: string; location?: string; playerCount?: number; url: string;
      }> = [];

      const selectors = [
        '.eventItem', '.event-item', '.event__item', 'article.event',
        'li.event', '.tournamentItem', '.result-item',
      ];

      for (const sel of selectors) {
        const items = Array.from(document.querySelectorAll(sel));
        if (items.length === 0) continue;

        for (const item of items) {
          const a = item.querySelector('a[href]') as HTMLAnchorElement | null;
          const url = a?.href || window.location.href;
          const titleEl = item.querySelector('h1, h2, h3, h4, .title, .name');
          const name = titleEl?.textContent?.trim() || '';
          const timeEl = item.querySelector('time');
          const date = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '';
          const locEl = item.querySelector('.location, .venue, .place');
          const location = locEl?.textContent?.trim();
          const countEl = item.querySelector('.count, .participants, .players');
          const rawCount = countEl?.textContent?.trim() || '';
          const playerCount = /(\d+)/.test(rawCount) ? Number(rawCount.match(/(\d+)/)?.[1]) : undefined;

          if (name) results.push({ name, date, location, playerCount, url });
        }
        if (results.length > 0) break;
      }

      return results;
    });

    await browser.close();

    const limited = limit ? events.slice(0, limit) : events;
    return limited.map((e, i) => ({
      id: slugify(`${e.date}-${e.name}`) || `event-${i}`,
      name: e.name,
      date: e.date.replace(/[./]/g, '-').slice(0, 10),
      location: e.location,
      format: inferFormat(e.name),
      playerCount: e.playerCount,
      placements: [],
      url: e.url,
      source: 'official' as const,
    }));
  } catch (error) {
    console.warn(`  ⚠️  Playwright tournament fetch failed: ${error}`);
    return [];
  }
}

// ── Deduplication & merge ──────────────────────────────────────────────────

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    if (!seen.has(item.id)) seen.set(item.id, item);
  }
  return Array.from(seen.values());
}

async function loadExisting<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const newsUrl = process.env.GUNDAM_GCG_NEWS_URL || DEFAULT_NEWS_URL;
  const eventUrl = process.env.GUNDAM_GCG_EVENT_URL || DEFAULT_EVENT_URL;
  const limit = NEWS_LIMIT > 0 ? NEWS_LIMIT : undefined;

  const libDataDir = path.join(projectRoot, 'apps', 'web', 'lib', 'data');
  const pubDataDir = path.join(projectRoot, 'apps', 'web', 'public', 'data');

  const newsLibPath = path.join(libDataDir, 'news.json');
  const newsPubPath = path.join(pubDataDir, 'news.json');
  const tournamentLibPath = path.join(libDataDir, 'tournament.json');
  const tournamentPubPath = path.join(pubDataDir, 'tournament.json');

  console.log('🗞  Gundam Forge — News & Tournament Sync');
  console.log(`   News source    : ${newsUrl}`);
  console.log(`   Event source   : ${eventUrl}`);
  console.log(`   Playwright     : ${USE_PLAYWRIGHT}`);
  console.log();

  // ── Fetch news ────────────────────────────────────────────────────────────
  console.log('📰 Fetching news articles...');
  let newsArticles: NewsArticle[] = [];

  try {
    const html = await fetchText(newsUrl);
    newsArticles = extractArticlesFromHtml(html, OFFICIAL_BASE);
    console.log(`   HTML parse: ${newsArticles.length} article(s) found`);
  } catch (err) {
    console.warn(`   HTML fetch failed: ${err}`);
  }

  if (newsArticles.length === 0 && USE_PLAYWRIGHT) {
    console.log('   Trying Playwright rendering...');
    newsArticles = await fetchNewsWithPlaywright(newsUrl, limit);
    console.log(`   Playwright: ${newsArticles.length} article(s) found`);
  }

  // Load existing and merge
  const existingNews = await loadExisting<NewsArticle>(newsLibPath);
  const mergedNews = deduplicateById([...newsArticles, ...existingNews])
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  await writeJson(newsLibPath, mergedNews);
  await writeJson(newsPubPath, mergedNews);
  console.log(`   ✓ Saved ${mergedNews.length} article(s) (${newsArticles.length} new/updated)`);

  await sleep(500);

  // ── Fetch tournaments ─────────────────────────────────────────────────────
  console.log('\n🏆 Fetching tournament results...');
  let tournaments: TournamentResult[] = [];

  try {
    const html = await fetchText(eventUrl);
    tournaments = extractTournamentsFromHtml(html, OFFICIAL_BASE);
    console.log(`   HTML parse: ${tournaments.length} tournament(s) found`);
  } catch (err) {
    console.warn(`   HTML fetch failed: ${err}`);
  }

  if (tournaments.length === 0 && USE_PLAYWRIGHT) {
    console.log('   Trying Playwright rendering...');
    tournaments = await fetchTournamentsWithPlaywright(eventUrl, limit);
    console.log(`   Playwright: ${tournaments.length} tournament(s) found`);
  }

  // Load existing and merge
  const existingTournaments = await loadExisting<TournamentResult>(tournamentLibPath);
  const mergedTournaments = deduplicateById([...tournaments, ...existingTournaments])
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  await writeJson(tournamentLibPath, mergedTournaments);
  await writeJson(tournamentPubPath, mergedTournaments);
  console.log(`   ✓ Saved ${mergedTournaments.length} tournament(s) (${tournaments.length} new/updated)`);

  console.log('\n✅ Sync complete.');
  console.log(`   News       → ${newsLibPath}`);
  console.log(`   News       → ${newsPubPath}`);
  console.log(`   Tournaments→ ${tournamentLibPath}`);
  console.log(`   Tournaments→ ${tournamentPubPath}`);
}

main().catch((err) => {
  console.error('❌ sync-news failed:', err);
  process.exit(1);
});
