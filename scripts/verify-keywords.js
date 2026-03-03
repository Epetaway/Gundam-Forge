#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../apps/web/lib/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const stats = {
  total: cards.length,
  withKeywords: 0,
  withTriggers: 0,
  withPairQualifiers: 0,
};

const keywordCounts = {};
const triggerCounts = {};

cards.forEach((card) => {
  if (card.keywords && card.keywords.length > 0) {
    stats.withKeywords++;
    card.keywords.forEach((k) => {
      const base = k.toLowerCase().split(' ')[0];
      keywordCounts[base] = (keywordCounts[base] || 0) + 1;
    });
  }
  
  if (card.triggers && card.triggers.length > 0) {
    stats.withTriggers++;
    card.triggers.forEach((t) => {
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
  }
  
  if (card.pairQualifiers && card.pairQualifiers.length > 0) {
    stats.withPairQualifiers++;
  }
});

console.log('='.repeat(70));
console.log('CARD DATABASE VERIFICATION');
console.log('='.repeat(70));
console.log(`Total cards: ${stats.total}`);
console.log(`Cards with keywords: ${stats.withKeywords} (${((stats.withKeywords / stats.total) * 100).toFixed(1)}%)`);
console.log(`Cards with triggers: ${stats.withTriggers} (${((stats.withTriggers / stats.total) * 100).toFixed(1)}%)`);
console.log(`Cards with pairQualifiers: ${stats.withPairQualifiers} (${((stats.withPairQualifiers / stats.total) * 100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(70));
console.log('KEYWORDS IN DATABASE');
console.log('='.repeat(70));
const sortedKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]);
sortedKeywords.forEach(([kw, count]) => {
  console.log(`  ${kw.padEnd(20)} ${count.toString().padStart(4)} cards`);
});

console.log('\n' + '='.repeat(70));
console.log('TRIGGERS IN DATABASE');
console.log('='.repeat(70));
const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
sortedTriggers.forEach(([tr, count]) => {
  console.log(`  ${tr.padEnd(20)} ${count.toString().padStart(4)} cards`);
});

console.log('\n' + '='.repeat(70));
console.log('EXAMPLES');
console.log('='.repeat(70));

// Find examples
const blockerCard = cards.find(c => c.keywords?.some(k => k.includes('blocker')));
if (blockerCard) {
  console.log(`\nBlocker: ${blockerCard.id} - ${blockerCard.name}`);
  console.log(`  Keywords: ${JSON.stringify(blockerCard.keywords)}`);
}

const burstCard = cards.find(c => c.triggers?.includes('burst'));
if (burstCard) {
  console.log(`\nBurst: ${burstCard.id} - ${burstCard.name}`);
  console.log(`  Triggers: ${JSON.stringify(burstCard.triggers)}`);
}

const repairCard = cards.find(c => c.keywords?.some(k => k.includes('repair')));
if (repairCard) {
  console.log(`\nRepair: ${repairCard.id} - ${repairCard.name}`);
  console.log(`  Keywords: ${JSON.stringify(repairCard.keywords)}`);
}

const pairedCard = cards.find(c => c.triggers?.includes('when-paired'));
if (pairedCard) {
  console.log(`\nWhen-Paired: ${pairedCard.id} - ${pairedCard.name}`);
  console.log(`  Triggers: ${JSON.stringify(pairedCard.triggers)}`);
  if (pairedCard.pairQualifiers) {
    console.log(`  Pair Qualifiers: ${JSON.stringify(pairedCard.pairQualifiers)}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('✓ Database verification complete!');
console.log('='.repeat(70));
