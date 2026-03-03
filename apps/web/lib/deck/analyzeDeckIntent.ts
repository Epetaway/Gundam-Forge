import type { CardDefinition, DeckIntent, CardColor } from '@gundam-forge/shared';

export interface DeckIntentSuggestion {
  suggestedIntent: DeckIntent;
  confidence: number; // 0-100
  reasons: string[];
  improvements: string[];
}

/**
 * Analyze the current deck composition and suggest an optimal deck intent
 */
export function analyzeDeckIntent(
  cards: CardDefinition[],
  currentIntent?: DeckIntent,
): DeckIntentSuggestion {
  const reasons: string[] = [];
  const improvements: string[] = [];
  
  // Count colors
  const colorCounts: Record<string, number> = {};
  cards.forEach((card) => {
    if (card.color && card.color !== 'Colorless') {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
    }
  });
  
  // Determine dominant colors (>= 20% of non-colorless cards)
  const nonColorlessCount = Object.values(colorCounts).reduce((a, b) => a + b, 0);
  const dominantColors = Object.entries(colorCounts)
    .filter(([_, count]) => count >= nonColorlessCount * 0.2)
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color as CardColor);
  
  if (dominantColors.length > 0) {
    reasons.push(`Dominant colors: ${dominantColors.join(', ')} (${((dominantColors.reduce((sum, c) => sum + colorCounts[c], 0) / nonColorlessCount) * 100).toFixed(0)}% of deck)`);
  }
  
  // Count clans/factions from traits
  const clanCounts: Record<string, number> = {};
  cards.forEach((card) => {
    (card.traits || []).forEach((trait) => {
      // Extract parenthesized factions: "(Earth Federation)", "(Zeon)", etc.
      const matches = trait.match(/\(([^)]+)\)/g);
      if (matches) {
        matches.forEach((match) => {
          const clan = match.slice(1, -1); // Remove parentheses
          clanCounts[clan] = (clanCounts[clan] || 0) + 1;
        });
      }
    });
  });
  
  // Determine dominant clans (>= 25% of cards)
  const totalCards = cards.length;
  const dominantClans = Object.entries(clanCounts)
    .filter(([_, count]) => count >= totalCards * 0.25)
    .sort((a, b) => b[1] - a[1])
    .map(([clan]) => clan);
  
  if (dominantClans.length > 0) {
    reasons.push(`Dominant factions: ${dominantClans.join(', ')} (${((dominantClans.reduce((sum, c) => sum + clanCounts[c], 0) / totalCards) * 100).toFixed(0)}% of deck)`);
  }
  
  // Analyze mechanics packages
  const keywordCounts: Record<string, number> = {};
  const triggerCounts: Record<string, number> = {};
  
  cards.forEach((card) => {
    (card.keywords || []).forEach((kw) => {
      const base = kw.toLowerCase().split(' ')[0];
      keywordCounts[base] = (keywordCounts[base] || 0) + 1;
    });
    (card.triggers || []).forEach((trigger) => {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    });
  });
  
  // Suggest mechanics packages based on keyword density
  const suggestedPackages: string[] = [];
  
  if (keywordCounts['blocker'] >= 3) {
    suggestedPackages.push('defensive');
    reasons.push(`${keywordCounts['blocker']} Blocker cards suggest defensive strategy`);
  }
  
  if (keywordCounts['breach'] >= 3) {
    suggestedPackages.push('aggro');
    reasons.push(`${keywordCounts['breach']} Breach cards suggest aggressive strategy`);
  }
  
  if (keywordCounts['support'] >= 2) {
    suggestedPackages.push('midrange');
    reasons.push(`${keywordCounts['support']} Support cards suggest midrange tempo`);
  }
  
  if (triggerCounts['when-paired'] >= 5 || triggerCounts['during-pair'] >= 5) {
    suggestedPackages.push('synergy');
    const total = (triggerCounts['when-paired'] || 0) + (triggerCounts['during-pair'] || 0);
    reasons.push(`${total} Pair triggers suggest synergy-focused build`);
  }
  
  if (triggerCounts['burst'] >= 8) {
    suggestedPackages.push('control');
    reasons.push(`${triggerCounts['burst']} Burst cards suggest control/defensive play`);
  }
  
  // Check if EX cards are present
  const hasEXCards = cards.some((c) => c.traits?.some((t) => t.includes('EX')));
  
  // Build suggested intent
  const suggestedIntent: DeckIntent = {
    colors: dominantColors.length > 0 ? dominantColors : (currentIntent?.colors || []),
    clans: dominantClans.length > 0 ? dominantClans : (currentIntent?.clans || []),
    packages: suggestedPackages.length > 0 ? suggestedPackages : (currentIntent?.packages || []),
    includeEX: hasEXCards || (currentIntent?.includeEX ?? false),
  };
  
  // Calculate confidence based on how clear the deck's identity is
  let confidence = 50;
  
  if (dominantColors.length > 0) confidence += 15;
  if (dominantColors.length === 1 || dominantColors.length === 2) confidence += 10; // Clear color identity
  if (dominantClans.length > 0) confidence += 15;
  if (suggestedPackages.length > 0) confidence += 10;
  if (totalCards >= 40) confidence += 10; // More cards = more confident analysis
  
  confidence = Math.min(confidence, 100);
  
  // Generate improvement suggestions
  if (currentIntent) {
    // Check if current colors match dominant colors
    const currentColors = currentIntent.colors || [];
    const missingColors = dominantColors.filter((c) => !currentColors.includes(c));
    const extraColors = currentColors.filter((c) => !dominantColors.includes(c) && colorCounts[c] < nonColorlessCount * 0.1);
    
    if (missingColors.length > 0) {
      improvements.push(`Add ${missingColors.join(', ')} to deck intent (${missingColors.map(c => colorCounts[c]).join('/')} cards each)`);
    }
    if (extraColors.length > 0) {
      improvements.push(`Remove ${extraColors.join(', ')} from deck intent (low representation)`);
    }
    
    // Check if current clans match dominant clans
    const currentClans = currentIntent.clans || [];
    const missingClans = dominantClans.filter((c) => !currentClans.includes(c));
    const extraClans = currentClans.filter((c) => !dominantClans.includes(c) && (clanCounts[c] || 0) < totalCards * 0.15);
    
    if (missingClans.length > 0) {
      improvements.push(`Add ${missingClans.join(', ')} faction(s) to deck intent (${missingClans.map(c => clanCounts[c]).join('/')} cards each)`);
    }
    if (extraClans.length > 0) {
      improvements.push(`Remove ${extraClans.join(', ')} faction(s) from deck intent (low representation)`);
    }
    
    // Check mechanics packages
    const missingPackages = suggestedPackages.filter((p) => !currentIntent.packages?.includes(p));
    if (missingPackages.length > 0) {
      improvements.push(`Consider adding ${missingPackages.join(', ')} package(s) based on card abilities`);
    }
  }
  
  if (improvements.length === 0) {
    improvements.push('Your deck intent matches your card composition well!');
  }
  
  return {
    suggestedIntent,
    confidence,
    reasons,
    improvements,
  };
}
