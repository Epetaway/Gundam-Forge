/**
 * Sound Effects Manager
 * Generates and plays sound effects using Web Audio API
 */

export class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialize audio context on first use (to comply with browser autoplay policies)
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Resume audio context if suspended (required for autoplay)
   */
  private ensureAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      if (typeof window !== 'undefined') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return this.audioContext;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Play a simple beep sound
   */
  playBeep(frequency: number = 1000, duration: number = 0.1) {
    if (this.isMuted) return;

    const audioContext = this.ensureAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  /**
   * Play card play sound (pop)
   */
  playCardPlay() {
    if (this.isMuted) return;

    // Pop sound: high freq beep
    this.playBeep(800, 0.1);
    setTimeout(() => this.playBeep(1200, 0.08), 50);
  }

  /**
   * Play attack sound (swoosh)
   */
  playAttack() {
    if (this.isMuted) return;

    const audioContext = this.ensureAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';

    // Swoosh: frequency slide down
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      100,
      audioContext.currentTime + 0.3,
    );

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  /**
   * Play shield break sound (crack)
   */
  playShieldBreak() {
    if (this.isMuted) return;

    // Crack sound: quick low-to-mid frequency
    this.playBeep(400, 0.15);
    setTimeout(() => this.playBeep(200, 0.1), 100);
  }

  /**
   * Play unit destroyed sound (explosion)
   */
  playDestroyed() {
    if (this.isMuted) return;

    const audioContext = this.ensureAudioContext();
    if (!audioContext) return;

    // Create noise for explosion effect
    const bufferSize = audioContext.sampleRate * 0.5;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    source.start(audioContext.currentTime);
    source.stop(audioContext.currentTime + 0.5);

    // Add a low pitch underneath
    this.playBeep(80, 0.5);
  }

  /**
   * Play victory/success sound (fanfare)
   */
  playVictory() {
    if (this.isMuted) return;

    // Quick ascending notes
    this.playBeep(523, 0.15); // C5
    setTimeout(() => this.playBeep(659, 0.15), 150); // E5
    setTimeout(() => this.playBeep(784, 0.3), 300); // G5
  }

  /**
   * Play defeat sound (descending)
   */
  playDefeat() {
    if (this.isMuted) return;

    this.playBeep(523, 0.2); // C5
    setTimeout(() => this.playBeep(392, 0.2), 200); // G4
    setTimeout(() => this.playBeep(262, 0.4), 400); // C4
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Set mute state
   */
  setMute(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Check if muted
   */
  getMuted(): boolean {
    return this.isMuted;
  }
}

// Singleton instance
let instance: SoundEffectsManager | null = null;

export function getSoundEffectsManager(): SoundEffectsManager {
  if (!instance) {
    instance = new SoundEffectsManager();
  }
  return instance;
}
