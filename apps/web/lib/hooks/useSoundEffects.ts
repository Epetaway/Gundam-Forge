/**
 * useSoundEffects Hook
 * Provides easy access to sound effects with mute control
 */

'use client';

import { useEffect, useState } from 'react';
import { getSoundEffectsManager } from '@/lib/audio/sound-effects';

interface SoundEffectsHookReturn {
  playCardPlay: () => void;
  playAttack: () => void;
  playShieldBreak: () => void;
  playDestroyed: () => void;
  playVictory: () => void;
  playDefeat: () => void;
  toggleMute: () => boolean;
  isMuted: boolean;
}

export function useSoundEffects(): SoundEffectsHookReturn {
  const [isMuted, setIsMuted] = useState(false);
  const manager = getSoundEffectsManager();

  useEffect(() => {
    // Check for saved mute preference
    const savedMute = localStorage.getItem('gundam-forge-mute') === 'true';
    manager.setMute(savedMute);
    setIsMuted(savedMute);
  }, [manager]);

  const toggleMute = (): boolean => {
    const newMuted = manager.toggleMute();
    setIsMuted(newMuted);
    localStorage.setItem('gundam-forge-mute', String(newMuted));
    return newMuted;
  };

  return {
    playCardPlay: () => manager.playCardPlay(),
    playAttack: () => manager.playAttack(),
    playShieldBreak: () => manager.playShieldBreak(),
    playDestroyed: () => manager.playDestroyed(),
    playVictory: () => manager.playVictory(),
    playDefeat: () => manager.playDefeat(),
    toggleMute,
    isMuted,
  };
}
