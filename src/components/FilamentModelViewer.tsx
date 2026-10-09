import * as React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  ModelRenderer,
  useCameraManipulator,
  useModel,
} from 'react-native-filament';
import { useI18n } from '../../constants/i18n';

type FilamentModelViewerProps = {
  modelUrl: string;
  style?: StyleProp<ViewStyle>;
};

function ModelScene({ modelUrl, style }: FilamentModelViewerProps) {
  const model = useModel({ uri: modelUrl });
  const framing = React.useMemo(() => {
    if (model.state !== 'loaded') {
      return {
        cameraPosition: [0, 0, 4] as [number, number, number],
        cameraTarget: [0, 0, 0] as [number, number, number],
        far: 100,
        focalLengthInMillimeters: 55,
        near: 0.1,
      };
    }

    const { center, halfExtent } = model.boundingBox;
    const radius = Math.hypot(halfExtent[0], halfExtent[1], halfExtent[2]);

    // Fit the object within a reasonable view distance based on its radius
    const distance = Math.max(radius * 2.5, 0.5);

    return {
      cameraPosition: [center[0], center[1], center[2] + distance] as [number, number, number],
      cameraTarget: center,
      far: Math.max(distance * 10, 100),
      focalLengthInMillimeters: 30, // Default focal length for better perspective
      near: 0.1,
    };
  }, [model]);
  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: framing.cameraPosition,
    targetPosition: framing.cameraTarget,
    zoomSpeed: [0.2],
    orbitSpeed: [0.01, 0.01],
  });
  const rotateGesture = React.useMemo(
    () => {
      const pan = Gesture.Pan()
        .onBegin((event) => {
          'worklet';
          cameraManipulator?.grabBegin(-event.x, -event.y, false);
        })
        .onUpdate((event) => {
          'worklet';
          cameraManipulator?.grabUpdate(-event.x, -event.y);
        })
        .onFinalize(() => {
          'worklet';
          cameraManipulator?.grabEnd();
        });

      const pinch = Gesture.Pinch()
        .onUpdate((event) => {
          'worklet';
          cameraManipulator?.scroll(0, 0, (1 - event.scale) * 0.05);
        });

      return Gesture.Simultaneous(pan, pinch);
    },
    [cameraManipulator],
  );

  return (
    <GestureDetector gesture={rotateGesture}>
      <FilamentView style={StyleSheet.flatten([styles.viewer, style])}>
        <Camera
          cameraManipulator={cameraManipulator}
          far={framing.far}
          focalLengthInMillimeters={framing.focalLengthInMillimeters}
          near={framing.near}
        />
        <DefaultLight />
        {model.state === 'loaded' && <ModelRenderer model={model} />}
      </FilamentView>
    </GestureDetector>
  );
}

export default function FilamentModelViewer({ modelUrl, style }: FilamentModelViewerProps) {
  const { t } = useI18n();
  if (!/\.glb(\?|$)/i.test(modelUrl)) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{t('modelFormatUnsupported')}</Text>
      </View>
    );
  }

  return (
    <FilamentScene
      fallback={(
        <View style={[styles.container, style]}>
          <ActivityIndicator size="small" color="#F4C95D" />
        </View>
      )}
    >
      <ModelScene modelUrl={modelUrl} style={style} />
    </FilamentScene>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    flex: 1,
    justifyContent: 'center',
  },
  viewer: {
    flex: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
  },
});
