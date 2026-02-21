let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("zdf-muted") === "true";
}

export function toggleMute(): boolean {
  muted = !muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("zdf-muted", String(muted));
  }
  return muted;
}

export function initMute() {
  if (typeof window !== "undefined") {
    muted = localStorage.getItem("zdf-muted") === "true";
  }
}

function beep(freq: number, duration: number, type: OscillatorType = "square", gain = 0.08) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

export function playSound(event: string) {
  if (muted) return;

  switch (event) {
    case "battle_start":
      // Rising alarm tone
      beep(220, 0.15, "sawtooth", 0.06);
      setTimeout(() => beep(330, 0.15, "sawtooth", 0.06), 100);
      setTimeout(() => beep(440, 0.2, "sawtooth", 0.06), 200);
      break;

    case "vulnerability_found":
      // Warning double beep
      beep(800, 0.08, "square", 0.05);
      setTimeout(() => beep(800, 0.08, "square", 0.05), 120);
      break;

    case "patch_generated":
      // Gentle ascending chime
      beep(523, 0.12, "sine", 0.06);
      setTimeout(() => beep(659, 0.15, "sine", 0.06), 100);
      break;

    case "chain_discovered":
      // Ominous descending
      beep(600, 0.1, "sawtooth", 0.04);
      setTimeout(() => beep(400, 0.1, "sawtooth", 0.04), 100);
      setTimeout(() => beep(300, 0.15, "sawtooth", 0.04), 200);
      break;

    case "verification_result":
      // Quick success ping
      beep(880, 0.08, "sine", 0.05);
      break;

    case "phase_change":
      // Phase transition whoosh
      beep(150, 0.3, "sawtooth", 0.03);
      setTimeout(() => beep(300, 0.2, "sine", 0.04), 150);
      break;

    case "battle_complete":
      // Victory fanfare
      beep(523, 0.15, "sine", 0.06);
      setTimeout(() => beep(659, 0.15, "sine", 0.06), 150);
      setTimeout(() => beep(784, 0.15, "sine", 0.06), 300);
      setTimeout(() => beep(1047, 0.3, "sine", 0.06), 450);
      break;

    case "battle_royale_started":
      // Epic multi-tone rising chord
      beep(220, 0.2, "sawtooth", 0.05);
      setTimeout(() => beep(330, 0.2, "sawtooth", 0.05), 100);
      setTimeout(() => beep(440, 0.2, "sawtooth", 0.05), 200);
      setTimeout(() => beep(660, 0.25, "sawtooth", 0.05), 300);
      break;

    case "cross_exam_exchange":
      // Debate clash — two opposing tones
      beep(600, 0.1, "square", 0.04);
      setTimeout(() => beep(400, 0.1, "square", 0.04), 80);
      break;
  }
}
