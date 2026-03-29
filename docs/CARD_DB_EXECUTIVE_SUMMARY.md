# Card Database Status Report | March 2026

**TL;DR**: Database has ~170 core cards (GD01 + ST01-ST04, 95% complete) but is missing ~900 cards from 2024-2025 expansions. This is **manageable but urgent** - requires 6-8 weeks to remediate.

---

## Dashboard

| Component | Status | Action |
|-----------|--------|--------|
| **Core Game Data** | ✅ 95% Complete | Hold as-is |
| **Booster Expansions (GD02-05)** | ❌ 0% Present | Urgent |
| **Starter Decks (ST05-09)** | ❌ 0% Present | High Priority |
| **Premium Collections** | ❌ 0% Present | Medium Priority |
| **Card Images** | ⚠️ Placeholders Only | High Priority |
| **Schema/Metadata** | ⚠️ Minimal | Medium Priority |
| **Data Freshness** | ⚠️ Stale (Pre-2024) | High Priority |

---

## What's in the Database

### ✅ Present (170 official cards)
```
GD01 (Launch Set)         130 cards  ........................ GOOD
ST01 - ST04 (Starters)    40 cards (~10 per deck) .......... GOOD
EX Cards (Special)        2 cards ........................... OK
Resources + Tests         ~5 cards .......................... OK
```

### ❌ Missing (~900 cards)
```
GD02 Dual Impact          120 cards ........................ NEEDED
GD03 Steel Requiem        120 cards ........................ NEEDED
GD04 Gundam Legends       120 cards ........................ NEEDED  
GD05 Char's Counterattack 120 cards ........................ NEEDED
ST05 - ST09 (Starters)    210 cards ........................ NEEDED
Premium Collections       120 cards ........................ NEEDED
Promos & Variants         ~100+ cards ...................... NICE-TO-HAVE
```

---

## Why This Matters

### User Impact 🎮
- **New players**: Can't find all starter options → bad onboarding
- **Casual players**: Can't build decks with 2024-2025 cards → frustration  
- **Competitive players**: Can't find meta-defining cards → unusable
- **Collectors**: No visibility into premium/rare cards → incomplete experience

### Business Impact 💼
- **Feature Gap**: Deck builder, search, card lookup feel incomplete
- **Data Integrity**: Calls credibility into question ("Is this data current?")
- **Competitive**: Behind competing TCG apps/sites
- **Support**: Will get "Card not found" complaints

### Technical Impact 🔧
- **Search**: Users find 170 cards when searching, but app *feels* broken
- **Filtering**: Missing sets creates confusing UX
- **Performance**: Adding 900 cards is manageable, not a blocker
- **Database**: Schema needs enhancement but not redesign

---

## The Plan (60-90 Days)

### Week 1-2: Research & Planning
- Gather official Bandai set checklists  
- Source card images/artwork
- Get stakeholder alignment on priorities
- Design schema improvements
- **Owner**: Product + Data Team

### Week 3-4: Technical Foundation  
- Update database schema
- Create import/validation services
- Set up test environment
- **Owner**: Backend Team

### Week 5-7: Data Import
- Import GPD02-GD05 booster sets
- Import STO5-ST09 starter decks
- Import premium collections
- Quality assurance & validation
- **Owner**: Data Team + QA

### Week 8: Testing & Deployment
- Full integration testing
- User acceptance testing
- Deploy to production
- Monitor for issues
- **Owner**: QA + DevOps

**Go-Live Target**: April/May 2026 (~6-8 weeks from now)

---

## Success Looks Like

### Before vs After

| Metric | Before | After | User Impact |
|--------|--------|-------|-------------|
| Total Cards | 170 | 900+ | "More decks possible" |
| Sets | 5 | 13+ | "All official sets available" |
| Images | Placeholders | Real artwork | "Cards look great" |
| Data Freshness | 2023 | Current | "Latest sets included" |
| Search Results | Limited | Comprehensive | "I can find anything" |

### Concrete Wins
✅ User searches for "Char's Zaku" and finds it  
✅ User builds deck with GD02 cards  
✅ User sees real card artwork instead of gray placeholders  
✅ App feels complete and polished  
✅ "Card not found" complaints stop  

---

## Resource Requirements

| Role | Time | Effort |
|------|------|--------|
| Product Manager | ~20% | Planning, prioritization |
| Data Researcher | 1-2 weeks full-time | Source cards, images, verify |
| Backend Engineer | 1-2 weeks | Import pipeline, schema |
| Backend Engineer | 2-3 weeks | Data import, validation |
| QA Engineer | 1-2 weeks | Testing, validation |
| DevOps | 1-2 days | Deployment, monitoring |

**Total**: ~1-1.5 FTE over 8 weeks (or 2 FTE over 4 weeks)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Data sources unavailable | Low | High | Start research immediately |
| Card image rights unclear | Medium | Medium | Use official sources only |
| Schema migration breaks existing data | Low | High | Test on backup, have rollback |
| Import performance issues | Medium | Medium | Optimize queries, batch imports |
| Stakeholders want perfect completeness | Low | High | Define "ready to launch" criteria |
| Team bandwidth constraints | Medium | Medium | Parallelize work, get help |

---

## Current Status: What's Working

✅ **Game is playable** - Core GD01 launch set is complete  
✅ **Deck building works** - Can build with ST01-ST04  
✅ **Search/filter works** - Just returns limited results  
✅ **Database schema is sound** - No fundamental redesign needed  
✅ **Team understands the problem** - Clear roadmap available  

---

## Current Status: What's Not

❌ Users can't find recent expansion cards  
❌ Placeholders instead of real card images  
❌ No visibility into when data was last updated  
❌ No automated way to add new sets  
❌ Will continue to fall behind as new sets release  

---

## Decision Point

**Question for Leadership**:
> "Should we invest 6-8 weeks to add ~900 missing cards now, or wait and become more incomplete?"

**Recommendation**: **DO IT NOW**
- Expansion sets are core to gameplay
- 6-8 weeks is reasonable ROI
- Every week of delay = further behind
- Relatively low risk, high impact

---

## Next Actions (This Week)

- [ ] **Stakeholder meeting**: Align on priority & timeline
- [ ] **Data research kickoff**: Start gathering GD02-GD05 data  
- [ ] **Review plan**: Share this document, get feedback
- [ ] **Team assignment**: Assign owners for each phase
- [ ] **Create project board**: Break into sprint tasks

---

## Documents for Deep Dive

| Document | Purpose | Audience |
|----------|---------|----------|
| [CARD_DB_FINDINGS_DETAILED.md](./CARD_DB_FINDINGS_DETAILED.md) | Technical analysis | Engineers, Data Team |
| [CARD_DB_UPDATE_PLAN.md](./CARD_DB_UPDATE_PLAN.md) | Implementation playbook | Technical leads |
| [CARD_IMPORT_TEMPLATE.md](./CARD_IMPORT_TEMPLATE.md) | Code examples & structure | Backend engineers |
| [CARD_DB_QUICK_REFERENCE.md](./CARD_DB_QUICK_REFERENCE.md) | Quick facts | All team members |

---

## Contact & Questions

For questions or clarifications about this audit:
- Technical details → Engineering team
- Data sourcing → Product/Research team
- Timeline/resources → Project manager
- Strategic direction → Product leadership

---

*Report Generated: March 2026*  
*Database Analyzed: apps/web/lib/data/cards.json (318 entries)*  
*Audit Files: docs/CARD_DB_*.md + scripts/audit-card-database.ts*
