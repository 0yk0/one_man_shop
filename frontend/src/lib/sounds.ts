let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)

    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // silently fail if audio context isn't available
  }
}

export const sounds = {
  /** Short high beep — item added to cart */
  addToCart: () => playTone(880, 0.08, 'sine', 0.25),

  /** Low soft tone — item removed from cart */
  removeFromCart: () => playTone(330, 0.12, 'sine', 0.2),

  /** Tiny click — quantity incremented */
  qtyUp: () => playTone(660, 0.05, 'square', 0.1),

  /** Tiny click — quantity decremented */
  qtyDown: () => playTone(440, 0.05, 'square', 0.1),

  /** Ascending two-tone — payment completed */
  paymentSuccess: () => {
    playTone(523, 0.15, 'sine', 0.3)
    setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 120)
  },

  /** Descending tone — clear cart */
  clearCart: () => playTone(220, 0.2, 'triangle', 0.2),

  /** Soft confirmation — product deleted */
  delete: () => playTone(392, 0.15, 'triangle', 0.2),

  /** Short pop — product created */
  create: () => playTone(698, 0.1, 'sine', 0.25),

  /** Error buzz */
  error: () => {
    playTone(180, 0.15, 'sawtooth', 0.15)
    setTimeout(() => playTone(180, 0.15, 'sawtooth', 0.15), 160)
  },
}
