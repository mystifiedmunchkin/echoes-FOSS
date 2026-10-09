/** Configures and plays the selected memory's audio without rendering UI. */
import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { translate } from '../../constants/i18n';

export function MemoryAudioPlayer({ source }) {
  const player = useAudioPlayer(source || null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch((error) => console.warn(translate('audioConfigurationError'), error));
  }, []);

  useEffect(() => {
    if (!source) {
      player.pause();
      return undefined;
    }

    try {
      player.play();
    } catch (error) {
      console.warn(translate('audioPlaybackError'), error);
    }

    return () => player.pause();
  }, [player, source]);

  return null;
}