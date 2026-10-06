import { useEffect } from 'react'
import { playAudioCue, primeAudio, setAudioEnabled } from '../services/audioFeedback'
import { useProgressStore } from '../store/progressStore'

export function SoundToggle() {
  const soundEnabled = useProgressStore((state) => state.soundEnabled)
  const setSoundEnabledInStore = useProgressStore((state) => state.setSoundEnabled)

  useEffect(() => {
    setAudioEnabled(soundEnabled)
  }, [soundEnabled])

  const handleToggle = () => {
    const nextEnabled = !soundEnabled
    setAudioEnabled(nextEnabled)
    setSoundEnabledInStore(nextEnabled)
    if (nextEnabled) {
      primeAudio()
      playAudioCue('click')
    }
  }

  return (
    <button
      className="sound-toggle"
      type="button"
      onClick={handleToggle}
      aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
      title={soundEnabled ? 'Tắt âm' : 'Âm thanh'}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  )
}
