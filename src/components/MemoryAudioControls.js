import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { COLORS } from '../../app/theme';
import { useI18n } from '../../constants/i18n';

const formatDuration = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

export function MemoryAudioControls({ source }) {
  const { t } = useI18n();
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const duration = Number.isFinite(status.duration) ? status.duration : 0;
  const currentTime = Math.min(
    Number.isFinite(status.currentTime) ? status.currentTime : 0,
    duration,
  );

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch((error) => console.warn(t('audioConfigurationError'), error));
  }, [player]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{t('audio')}</Text>
        <Text style={styles.duration}>{formatDuration(currentTime)} / {formatDuration(duration)}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            try {
              if (status.playing) player.pause();
              else player.play();
            } catch (error) {
              console.warn(t('audioPlaybackError'), error);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? t('pauseAudio') : t('playAudio')}
        >
          <Text style={styles.playButtonText}>{status.playing ? 'II' : '▶'}</Text>
        </TouchableOpacity>
        <Slider
          style={styles.timeline}
          minimumValue={0}
          maximumValue={Math.max(duration, 1)}
          value={currentTime}
          minimumTrackTintColor={COLORS.accentStrong}
          maximumTrackTintColor={COLORS.surfaceMuted}
          thumbTintColor={COLORS.accentStrong}
          onSlidingComplete={(value) => {
            player.currentTime = value;
          }}
          accessibilityLabel={t('audioTimeline')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  duration: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryStrong,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  playButtonText: {
    color: COLORS.textOnDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
  timeline: {
    flex: 1,
    height: 36,
  },
});
