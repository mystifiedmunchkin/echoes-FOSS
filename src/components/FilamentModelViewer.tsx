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
    const longestHalfExtent = Math.max(halfExtent[0], halfExtent[1], halfExtent[2]);
    const shapeRatio = radius / Math.max(longestHalfExtent, 0.001);
    const focalLengthInMillimeters = Math.max(
      16,
      55 - ((shapeRatio - 1) / (Math.sqrt(3) - 1)) * 39,
    );
    const distance = Math.max(radius * 5 * (focalLengthInMillimeters / 28), 0.75);

    return {
      cameraPosition: [center[0], center[1], center[2] + distance] as [number, number, number],
      cameraTarget: center,
      far: Math.max(distance * 4, 100),
      focalLengthInMillimeters,
      near: Math.max(distance / 1_000, 0.01),
    };
  }, [model]);
  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: framing.cameraPosition,
    targetPosition: framing.cameraTarget,
    zoomSpeed: [0.02],
    orbitSpeed: [0.01, 0.01],
  });
  const rotateGesture = React.useMemo(
    () => Gesture.Pan()
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
      }),
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
