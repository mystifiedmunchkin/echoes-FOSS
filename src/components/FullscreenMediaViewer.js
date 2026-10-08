import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

function FullscreenVideo({ source }) {
  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <VideoView
      style={styles.media}
      player={player}
      allowsPictureInPicture={false}
      contentFit="contain"
      nativeControls
      surfaceType="textureView"
    />
  );
}

export function FullscreenMediaViewer({ source, type }) {
  if (type === 'video') return <FullscreenVideo source={source} />;

  return (
    <View style={styles.imageContainer}>
      <Image source={source} style={styles.media} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
  media: {
    flex: 1,
    width: '100%',
  },
});
