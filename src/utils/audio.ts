// Subtle Web Audio API chime synthesizer for real-time notifications
// Completely self-contained, no external asset dependencies, zero lag

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage for muted preference
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("event_sound_muted") === "true";
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("event_sound_muted", String(muted));
    }
  }

  public playNotification(type: "positive" | "negative" | "broadcast" | "alert") {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.06, now); // Gentle, subtle volume
      gainNode.connect(ctx.destination);

      if (type === "positive") {
        // Soft bright dual chime (e.g. 587Hz -> 880Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc2.frequency.setValueAtTime(880, now + 0.08); // A5

        osc1.connect(gainNode);
        osc2.connect(gainNode);

        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.start(now);
        osc1.stop(now + 0.12);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
      } else if (type === "negative") {
        // Soft low notification
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(349.23, now); // F4
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.2); // C4

        osc.connect(gainNode);
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "alert") {
        // Two quick subtle pings
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.setValueAtTime(880, now + 0.09);

        osc.connect(gainNode);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Pleasant bell for general broadcasts (E5 -> B5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(659.25, now);
        osc2.frequency.setValueAtTime(987.77, now + 0.07);

        osc1.connect(gainNode);
        osc2.connect(gainNode);

        gainNode.gain.setValueAtTime(0.07, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.start(now);
        osc1.stop(now + 0.1);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.4);
      }
    } catch {
      // Audio playback fails silently if browser policy blocks autoplay
    }
  }
}

export const soundManager = new SoundManager();
