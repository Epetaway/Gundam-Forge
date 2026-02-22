# Card Database Governance & Compliance

**Version**: 1.0.0  
**Last Updated**: 2024-02-22  
**Status**: ACTIVE

---

## 1. Scope

This document governs:
- Card metadata collection and storage
- Data source selection and prioritization
- Intellectual property and licensing compliance
- Takedown/dispute processes
- Public data sharing policies

---

## 2. Data Governance

### 2.1 Ownership & Attribution

- **Card Metadata**: Non-copyrightable facts (ID, name, cost, etc.) sourced from official Bandai releases
- **Card Text**: Short excerpts used under fair use; always attributed to official source
- **Card Art**: Licensed CDN URLs only; no local copies
- **Card Names/Sets**: Bandai trademarks; used as-is without modification
- **Rulings**: Official Bandai text; cited with URL

**Attribution Model:**
Every card in the database includes:
- `source`: Origin (e.g., `bandai-official`, `community-wiki`)
- `sourceUrl`: Direct link to official or source document
- `illustrator`: Card artist credit (where available)

### 2.2 Data Quality Standards

**Validation Requirements:**
- All cards must pass Zod schema validation
- No null required fields
- Card IDs must be unique
- Cost/power values must be non-negative
- Art URLs must be valid and accessible
- Dates must be ISO 8601 format
- Sources must be in approved list

**QA Checklist:**
- [ ] Schema compliance (Zod)
- [ ] Unique card IDs
- [ ] Art URL 200 response
- [ ] Official source crosscheck (for Tier 1 cards)
- [ ] Naming consistency
- [ ] Tag validity

---

## 3. Intellectual Property Policy

### 3.1 What We Store

✅ **Allowed (Facts & Fair Use):**
- Card ID, name, cost, color, type, power
- Abbreviated card text (game mechanics)
- Card set code and release date
- Rarity classification
- Type categorization
- Illustrator credit
- Art URLs (links, not copies)
- Official ruling citations

❌ **Not Allowed (Copyright):**
- Full-resolution card art as local files
- Complete card illustration copies
- Verbatim card text without attribution
- Artistic elements (layout, design, fonts)
- Bandai proprietary algorithms
- Personal data (player rankings, PII)

### 3.2 Fair Use Justification

Our use of card text is fair use because:
1. **Transformative Purpose**: Database enables technical analysis, deck building, not commercial reproduction
2. **Amount Used**: Brief excerpts only; game mechanics, not artistic expression
3. **Market Effect**: No substitution for official product; complementary
4. **Nature of Work**: We cite rules/mechanics, factual content
5. **Attribution**: Every card links to official source

**Example:**
```json
{
  "text": "When this enters, draw 1.",
  "rulingUrl": "https://bandai.official/gundam-tcg/rulings/GD-001"
}
```

Properly attributed ✅

### 3.3 Art URL Policy

- **Store**: URLs only (hosted on official CDN)
- **Example**: `https://cdn.gundam-tcg.official/cards/GD-001-art.jpg`
- **Never**: Download, cache, or republish images locally
- **CDN**: Bandai's official CDN (respects rate limits, copyright)
- **Fallback**: Placeholder images during development (e.g., placehold.co)

---

## 4. Source Hierarchy & Compliance

### 4.1 Mandatory Tier 1 (Official)

| Source | Reliability | Why | Required |
|--------|-------------|-----|----------|
| Bandai Official API | Official | Authoritative | ✅ YES |
| Bandai Set PDFs | Official | Authoritative | ✅ YES |
| Bandai Rulings DB | Official | Authoritative | ✅ YES |

**Usage:**
- Card data validation: Must check Tier 1 first
- Conflicts: Tier 1 source always wins
- Updates: Publish within 1 week of official release

### 4.2 Optional Tier 2 (Licensed)

| Source | Reliability | When to Use |
|--------|-------------|-------------|
| Authorized Companion App | Licensed | If official API unavailable |
| Authorized Retailers | Licensed | Price/stock only; verify data |

**Usage:**
- Supplement Tier 1 when gaps exist
- Always cross-check against official sources
- Document discrepancies

### 4.3 Fallback Tier 3 (Community)

| Source | Reliability | When/Why |
|--------|-------------|----------|
| Community Wiki | Community | After verification by Tier 1 |
| Discord/Forums | Community | Tag creation, deck archetypes |

**Usage:**
- **Never** for core card stats
- **Always** cite source and verify
- Preferred for archetype tags, community consensus
- Experimental/playtest data only

---

## 5. Takedown & Dispute Process

### 5.1 Copyright/IP Takedown (Bandai)

If Bandai requests removal:

```
1. Receipt (same day)
   - Log request with timestamp & details
   - Create GitHub issue: "TAKEDOWN: [reason]"
   
2. Triage (within 24 hours)
   - Assess scope (full DB, specific cards, art URLs)
   - Determine if fair use applies
   - Propose alternative (removal, anonymization, etc.)
   
3. Compliance (within 48 hours max)
   - Remove disputed content immediately
   - Commit: `git commit --allow-empty -m "chore: DMCA takedown [date]"`
   - Notify users via GitHub releases
   - Keep evidence for audit trail
   
4. Follow-up (within 1 week)
   - Contact Bandai for official guidance
   - Update policy if needed
   - Provide alternative data source (official links)
```

### 5.2 Data Quality Dispute

If user reports incorrect card data:

```
1. Create issue: "DATA: [card ID] [issue description]"

2. Verify (24-48 hours)
   - Check against multiple Tier 1 sources
   - Confirm discrepancy
   
3. Correct & Document
   - Fix in seed/initial_cards.json
   - Update CHANGELOG.md with reference
   - Link to official source
   
4. Publish
   - Tag release (e.g., v1.0.1)
   - Notify in GitHub releases
```

### 5.3 Community Contribution Disputes

If community member claims data not properly attributed:

```
1. Review source attribution
   - Verify card.source field
   - Check card.sourceUrl validity
   
2. If error, correct:
   - Update source attribution
   - Commit: chore: fix attribution for [card ID]
   
3. Thank contributor & close
```

---

## 6. Data Retention & Deletion

### 6.1 Retention Policy

**Retain Indefinitely:**
- Official card data (core mechanics, stats, names)
- Source attribution & links
- ETL logs (for audit trail)
- CHANGELOG entries

**Retain 12 Months:**
- Daily incremental sync logs
- Validation reports

**Delete After 30 Days:**
- Temporary scraped data (after merge)
- Failed fetch attempts
- Debug logs

### 6.2 User Data

**We Do NOT Collect:**
- Player rankings or ratings
- Personal deck lists (users own their lists)
- IP addresses or browser data
- Authentication tokens beyond session

**If Accidentally Collected:**
- Delete within 48 hours
- Report in GitHub issue
- Update privacy guidance

---

## 7. Public Sharing & API Access

### 7.1 Database Export Policy

**Allowed:**
- Export full JSON for personal use (deck building, analysis)
- Share code snippets and examples on GitHub
- Reference card names in discussion/articles
- Link to official sources

**Not Allowed:**
- Republish full database without attribution
- Sell card database commercially
- Pass off as original work
- Include art without proper licensing

### 7.2 API Endpoints (Future)

When Gundam Forge provides public API:

```
GET /api/v1/cards                  # All cards (public)
GET /api/v1/cards/{id}             # Single card (public)
GET /api/v1/sets                   # Set list (public)
GET /api/v1/rulings/{id}           # Rulings (public, linked to official)
```

**Rate Limits:**
- Free tier: 100 req/min, 10k req/day
- Authenticated: 1k req/min, 100k req/day

**Attribution Required:**
```
X-Attribution: "Card data from Gundam Forge
(https://gundam-forge.io) sourced from official
Bandai TCG. Art URLs copyright © Bandai Namco."
```

---

## 8. Compliance Checklist

### Monthly Review

- [ ] Validate all card data against Zod schema (100% pass rate)
- [ ] Spot-check 10 random cards vs. official sources
- [ ] Verify all art URLs are accessible (200 response)
- [ ] Check for new Bandai rulings/errata
- [ ] Review community feedback (GitHub issues)
- [ ] Verify no personal data inadvertently collected
- [ ] Confirm all sources properly attributed

### Quarterly Review

- [ ] Audit Tier 1 source changes (API versions, format, etc.)
- [ ] Review IP policy compliance
- [ ] Check for new Bandai guidance on fan projects
- [ ] Update CHANGELOG & versioning
- [ ] Test disaster recovery (restore from backup)

### Annual Review

- [ ] Comprehensive licensing audit
- [ ] Contact Bandai: confirm policy alignment
- [ ] Community survey: data quality feedback
- [ ] Security audit: no data breaches?
- [ ] Plan next year's roadmap

---

## 9. Communication & Transparency

### 9.1 Public Documentation

Maintain these in repo root:
- `README.md` — How to use the database
- `docs/CARD_DB_GUIDE.md` — Technical guide (this doc)
- `CHANGELOG.md` — All updates & changes
- `LICENSE.md` — Licensing terms

### 9.2 Incident Response

**Data Breach or Incident:**
1. Assess: Scope, severity, data affected
2. Notify: GitHub security advisory (72 hours max)
3. Fix: Patch, remove, or rotate affected data
4. Follow-up: Post-mortem, updated policy

**Example GitHub Advisory:**
```
Title: "Data Collection Incident - 2024-03-15"
Severity: Low
Details: User IP addresses logged in debug (now deleted)
Action: Delete logs, disable debug logging
Impact: No user PII exposed
```

### 9.3 Community Feedback

**GitHub Discussions:**
- `card-requests`: Propose new cards/sets
- `data-issues`: Report incorrect data
- `licensing`: Questions about usage

**Discord/Forums:**
- Community curates archetypes & deck tech
- Gundam Forge team monitors for data quality
- User feedback feeds into monthly review

---

## 10. References

### Key Documents
- [Fair Use (U.S. Law)](https://www.copyright.gov/fair-use/)
- [DMCA Takedown Process](https://www.eff.org/issues/dmca)
- [Bandai Namco IP Policy](https://www.bandainamco.co.jp/copyright/)

### Internal Docs
- `packages/shared/src/card-schema.ts` — Schema definition
- `packages/shared/src/card-sources.ts` — Source registry
- `scripts/validate-cards.ts` — Validation tooling
- `scripts/fetch-cards.ts` — ETL pipeline
- `seed/initial_cards.json` — Seed data

### Tools
- Zod: Schema validation
- Node.js: CLI scripts
- GitHub Actions: CI/CD automation
- Puppeteer/Cheerio: Web scraping (future)

---

## 11. Conclusion

This governance policy ensures **Gundam Forge** is a:
- ✅ **Legally compliant** fan project
- ✅ **High-quality** card database
- ✅ **Transparent** open-source community
- ✅ **Respectful** of Bandai's IP rights

By following these standards, we maintain trust with Bandai, users, and the community.

---

**Questions?** Open a GitHub issue or email the maintainers.  
**Report Incident?** Use GitHub security advisory (confidential).  
**Legal Concerns?** Contact us via the official DMCA process.

---

**Approved By**: Gundam Forge Team  
**Effective Date**: 2024-02-22  
**Next Review**: 2024-08-22 (Annual)
