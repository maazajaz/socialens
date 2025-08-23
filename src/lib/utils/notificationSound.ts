"use client";

export class NotificationSound {
  private static instance: NotificationSound;
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: AudioBuffer } = {};

  private constructor() {}

  static getInstance(): NotificationSound {
    if (!NotificationSound.instance) {
      NotificationSound.instance = new NotificationSound();
    }
    return NotificationSound.instance;
  }

  private async initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Generate modern notification sound programmatically
  private async generateNotificationSound(type: 'default' | 'new_post' | 'like' | 'comment' | 'follow' = 'default') {
    await this.initAudioContext();
    if (!this.audioContext) return null;

    const duration = 0.4; // Slightly longer for more pleasant sound
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const audioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Modern sound patterns for different notification types
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let frequency: number;
      let volume = 0.08; // Softer base volume

      switch (type) {
        case 'new_post':
          // Gentle ascending chime for new posts
          frequency = 523 + (262 * Math.sin(t * Math.PI)); // C5 to C6 sine wave
          volume = 0.12 * Math.sin(t * Math.PI) * Math.exp(-t * 2); // Bell-like envelope
          break;
        case 'like':
          // Quick pleasant ding for likes
          frequency = 1047 + (200 * Math.sin(t * Math.PI * 4)); // C6 with harmonics
          volume = 0.1 * Math.exp(-t * 8) * (1 + 0.3 * Math.sin(t * Math.PI * 12));
          break;
        case 'comment':
          // Soft bubble sound for comments
          frequency = 784 * (1 + 0.1 * Math.sin(t * Math.PI * 6)); // G5 with vibrato
          volume = 0.09 * (1 - t) * Math.sin(t * Math.PI * 2);
          break;
        case 'follow':
          // Warm welcome tone for follows
          frequency = 659 + (131 * Math.sin(t * Math.PI * 0.5)); // E5 with slow modulation
          volume = 0.11 * Math.exp(-t * 1.5) * (1 + 0.2 * Math.cos(t * Math.PI * 3));
          break;
        default:
          // Modern pleasant default notification sound
          frequency = 880 * (1 + 0.05 * Math.sin(t * Math.PI * 8)); // A5 with subtle vibrato
          volume = 0.1 * Math.sin(t * Math.PI) * Math.exp(-t * 3); // Smooth bell curve
          break;
      }

      // Generate the waveform with soft attack and decay
      const envelope = Math.sin(t * Math.PI); // Natural bell-like envelope
      const waveform = Math.sin(2 * Math.PI * frequency * t);
      channelData[i] = waveform * volume * envelope;
    }

    return audioBuffer;
  }

  async playNotificationSound(type: 'default' | 'new_post' | 'like' | 'comment' | 'follow' = 'default') {
    try {
      // Check if user has enabled sound notifications
      if (!this.isSoundEnabled()) return;

      await this.initAudioContext();
      if (!this.audioContext) return;

      // Generate or get cached sound
      if (!this.sounds[type]) {
        const buffer = await this.generateNotificationSound(type);
        if (buffer) {
          this.sounds[type] = buffer;
        }
      }

      if (this.sounds[type]) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds[type];
        gainNode.gain.value = this.getVolumeLevel();
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  private isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const enabled = localStorage.getItem('socialens_sound_notifications');
    return enabled !== 'false'; // Default to enabled unless explicitly disabled
  }

  private getVolumeLevel(): number {
    if (typeof window === 'undefined') return 0.1;
    const volume = localStorage.getItem('socialens_notification_volume');
    return volume ? parseFloat(volume) : 0.1; // Default to 10% volume
  }

  setSoundEnabled(enabled: boolean) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('socialens_sound_notifications', enabled.toString());
    }
  }

  setVolumeLevel(volume: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('socialens_notification_volume', Math.max(0, Math.min(1, volume)).toString());
    }
  }

  // Test sound for settings
  async testSound() {
    await this.playNotificationSound('default');
  }
}

export const notificationSound = NotificationSound.getInstance();
