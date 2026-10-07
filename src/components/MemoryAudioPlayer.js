/** Configures and plays the selected memory's audio without rendering UI. */
import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

export function MemoryAudioPlayer({ source }) {
  const player = useAudioPlayer(source || null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch((error) => console.warn('Impossible de configurer le son du souvenir', error));
  }, []);

  useEffect(() => {
    if (!source) {
      player.pause();
      return undefined;
    }

    try {
      player.play();
    } catch (error) {
      console.warn('Impossible de lire le média audio du souvenir', error);
    }

    return () => player.pause();
  }, [player, source]);

  return null;
}