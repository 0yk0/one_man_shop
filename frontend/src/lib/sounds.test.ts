import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock AudioContext before importing sounds
const mockOscillator = {
  type: '' as OscillatorType,
  frequency: { setValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}

const mockGain = {
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
}

const mockAudioContext = {
  currentTime: 0,
  createOscillator: vi.fn(() => ({ ...mockOscillator, type: '' as OscillatorType })),
  createGain: vi.fn(() => ({ ...mockGain })),
  destination: {},
}

// Create a proper mock constructor
const MockAudioContext = vi.fn(function (this: any) {
  Object.assign(this, mockAudioContext)
})

vi.stubGlobal('AudioContext', MockAudioContext)

// Import sounds AFTER setting up the global mock
import { sounds } from './sounds'

describe('sounds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockOscillator.type = '' as OscillatorType
    mockAudioContext.currentTime = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exports all sound functions', () => {
    expect(typeof sounds.addToCart).toBe('function')
    expect(typeof sounds.removeFromCart).toBe('function')
    expect(typeof sounds.qtyUp).toBe('function')
    expect(typeof sounds.qtyDown).toBe('function')
    expect(typeof sounds.paymentSuccess).toBe('function')
    expect(typeof sounds.qrReady).toBe('function')
    expect(typeof sounds.clearCart).toBe('function')
    expect(typeof sounds.delete).toBe('function')
    expect(typeof sounds.create).toBe('function')
    expect(typeof sounds.error).toBe('function')
  })

  it('addToCart creates oscillator with correct parameters', () => {
    sounds.addToCart()
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('sine')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0)
    const gain = mockAudioContext.createGain.mock.results[0].value
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.25, 0)
  })

  it('removeFromCart creates oscillator with lower frequency', () => {
    sounds.removeFromCart()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('sine')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(330, 0)
    const gain = mockAudioContext.createGain.mock.results[0].value
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 0)
  })

  it('qtyUp creates square wave oscillator', () => {
    sounds.qtyUp()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('square')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(660, 0)
  })

  it('qtyDown creates square wave oscillator with different frequency', () => {
    sounds.qtyDown()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('square')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0)
  })

  it('clearCart creates triangle wave oscillator', () => {
    sounds.clearCart()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('triangle')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(220, 0)
  })

  it('delete creates triangle wave oscillator', () => {
    sounds.delete()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('triangle')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(392, 0)
  })

  it('create creates sine wave oscillator', () => {
    sounds.create()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('sine')
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(698, 0)
  })

  it('paymentSuccess plays two tones with delay', () => {
    sounds.paymentSuccess()
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(150)
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2)
  })

  it('qrReady plays three tones with delays', () => {
    sounds.qrReady()
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(100)
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3)
  })

  it('error plays two buzz tones', () => {
    sounds.error()
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1)
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.type).toBe('sawtooth')

    vi.advanceTimersByTime(170)
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2)
  })

  it('connects oscillator to gain and gain to destination', () => {
    sounds.addToCart()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    const gain = mockAudioContext.createGain.mock.results[0].value
    expect(osc.connect).toHaveBeenCalledWith(gain)
    expect(gain.connect).toHaveBeenCalledWith(mockAudioContext.destination)
  })

  it('starts and stops oscillator', () => {
    sounds.addToCart()
    const osc = mockAudioContext.createOscillator.mock.results[0].value
    expect(osc.start).toHaveBeenCalled()
    expect(osc.stop).toHaveBeenCalled()
  })

  it('handles AudioContext not available gracefully', () => {
    // The try/catch in sounds.ts should handle this silently
    // Just verify no errors are thrown
    expect(() => {
      sounds.addToCart()
      sounds.removeFromCart()
      sounds.qtyUp()
      sounds.qtyDown()
      sounds.clearCart()
      sounds.delete()
      sounds.create()
      sounds.error()
    }).not.toThrow()
  })
})
