export type AudioCue = 'click' | 'countdown' | 'success' | 'error' | 'combo' | 'gameEnd'

let audioContext: AudioContext | null = null
let audioEnabled = true

const cueSettings: Record<
  AudioCue,
  { frequency: number; endFrequency: number; duration: number; type: OscillatorType }
> = {
  click: { frequency: 330, endFrequency: 410, duration: 0.07, type: 'sine' },
  countdown: { frequency: 440, endFrequency: 440, duration: 0.11, type: 'sine' },
  success: { frequency: 520, endFrequency: 760, duration: 0.2, type: 'sine' },
  error: { frequency: 180, endFrequency: 110, duration: 0.22, type: 'square' },
  combo: { frequency: 660, endFrequency: 990, duration: 0.25, type: 'triangle' },
  gameEnd: { frequency: 460, endFrequency: 230, duration: 0.35, type: 'triangle' },
}

export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled
}

export function primeAudio(): void {
  if (!audioEnabled) return
  audioContext ??= new AudioContext()
  if (audioContext.state === 'suspended') void audioContext.resume()
}

export function playAudioCue(cue: AudioCue): void {
  if (!audioEnabled) return
  primeAudio()
  if (!audioContext) return

  const settings = cueSettings[cue]
  const startTime = audioContext.currentTime
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.type = settings.type
  oscillator.frequency.setValueAtTime(settings.frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    settings.endFrequency,
    startTime + settings.duration,
  )
  gain.gain.setValueAtTime(cue === 'error' ? 0.045 : 0.06, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + settings.duration)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + settings.duration)
}
