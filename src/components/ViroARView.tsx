/**
 * Active Viro/ARCore scene: renders a FIFO set of detected horizontal planes,
 * locally positioned memory droplets, and selected placed-memory content.
 */
import * as React from 'react';
import {
  Viro3DObject,
  ViroARPlane,
  ViroARScene,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroImage,
  ViroMaterials,
  ViroNode,
  ViroQuad,
  ViroSphere,
  ViroText,
  ViroVideo,
} from '@reactvision/react-viro';

ViroMaterials.createMaterials({
  memoryDroplet: {
    diffuseColor: '#F4C95D',
    roughness: 1.0,
    metalness: 0.0,
    alpha: 1.0,
  },
});

import { getRelativeARPosition } from '../utils/geo';
import { MemoryRecord, NearbyMemory, ViroARViewProps } from './ViroAR.types';

type SceneProps = {
  arMemories: MemoryRecord[];
  creatingMemoryMode: boolean;
  memoryToPlace?: MemoryRecord | null;
  nearbyMemories: NearbyMemory[];
  onMemoryCollected?: ViroARViewProps['onMemoryCollected'];
  onMemorySelected?: ViroARViewProps['onMemorySelected'];
  onMemoryPlaced?: ViroARViewProps['onMemoryPlaced'];
  onPlaneTapped?: ViroARViewProps['onPlaneTapped'];
  onModelLoadingStatus?: ViroARViewProps['onModelLoadingStatus'];
  resetPlacedMemoryKey?: number;
  canCollect?: boolean;
};

type MemoryARSceneProps = {
  sceneNavigator?: { viroAppProps?: SceneProps };
};

type PlaneAnchor = {
  anchorId: string;
  alignment?: string;
  height?: number;
  position: [number, number, number];
  rotation: [number, number, number];
  type?: string;
  width?: number;
};

const COLLECTION_LONG_PRESS_MS = 650;
const MAX_DETECTED_PLANES = 6;
const MIN_PLANE_SIZE_METERS = 0.3;
const BUBBLE_RADIUS_METERS = 0.075;
const AMBIENT_LIGHT_INTENSITY = 300;
const AR_INTERACTIONS_ENABLED = true;
const isLocalAssetUri = (value: string) => value.startsWith('file://') || value.startsWith('content://');

const getModelType = (url: string): 'GLB' | 'GLTF' | 'OBJ' | null => {
  if (/\.glb(\?|$)/i.test(url)) return 'GLB';
  if (/\.gltf(\?|$)/i.test(url)) return 'GLTF';
  if (/\.obj(\?|$)/i.test(url)) return 'OBJ';
  return null;
};

function MemoryContent({ memory, onLoadingStatus, onMemoryCollected }: {
  memory: MemoryRecord;
  onLoadingStatus?: ViroARViewProps['onModelLoadingStatus'];
  onMemoryCollected?: ViroARViewProps['onMemoryCollected'];
}) {
  const modelUrl = memory.model_url || memory.model_urls?.[0] || '';
  const modelType = getModelType(modelUrl);
  const collectionTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportError = (error: Error) => onLoadingStatus?.({
    nativeEvent: { isLoading: false, error: error.message },
  });

  React.useEffect(() => () => {
    if (collectionTimer.current) clearTimeout(collectionTimer.current);
  }, []);

  const handleModelTouch = (state: number) => {
    if (state === 1) {
      if (collectionTimer.current) clearTimeout(collectionTimer.current);
      collectionTimer.current = setTimeout(() => {
        collectionTimer.current = null;
        onMemoryCollected?.({ nativeEvent: { id: memory.id, name: memory.name } });
      }, COLLECTION_LONG_PRESS_MS);
      return;
    }

    if (collectionTimer.current) {
      clearTimeout(collectionTimer.current);
      collectionTimer.current = null;
    }
  };

  if (modelType) {
    if (!isLocalAssetUri(modelUrl)) {
      return (
        <ViroNode position={[0, 0.2, 0]}>
          <ViroSphere radius={0.12} />
          <ViroText text={`Preparing ${memory.name}`} position={[0, 0.2, 0]} scale={[0.2, 0.2, 0.2]} />
        </ViroNode>
      );
    }
    return (
      <Viro3DObject
        source={{ uri: modelUrl }}
        type={modelType}
        position={[0, 0.15, 0]}
        scale={[0.25, 0.25, 0.25]}
        onLoadStart={() => onLoadingStatus?.({ nativeEvent: { isLoading: true } })}
        onLoadEnd={(event) => onLoadingStatus?.({
          nativeEvent: event.nativeEvent.success
            ? { isLoading: false }
            : { isLoading: false, error: `Unable to load ${memory.name}.` },
        })}
        onError={(event) => reportError(event.nativeEvent.error)}
        onTouch={AR_INTERACTIONS_ENABLED ? handleModelTouch : undefined}
      />
    );
  }

  if (memory.video_url && isLocalAssetUri(memory.video_url)) {
    return (
      <ViroVideo
        source={{ uri: memory.video_url }}
        width={1}
        height={0.6}
        loop
        position={[0, 0.3, 0]}
        onError={(event) => reportError(event.nativeEvent.error)}
        onTouch={AR_INTERACTIONS_ENABLED ? handleModelTouch : undefined}
      />
    );
  }

  if (memory.image_url && isLocalAssetUri(memory.image_url)) {
    return (
      <ViroImage
        source={{ uri: memory.image_url }}
        width={1}
        height={0.6}
        position={[0, 0.3, 0]}
        onLoadStart={() => onLoadingStatus?.({ nativeEvent: { isLoading: true } })}
        onLoadEnd={(event) => onLoadingStatus?.({ nativeEvent: { isLoading: !event.nativeEvent.success } })}
        onTouch={AR_INTERACTIONS_ENABLED ? handleModelTouch : undefined}
      />
    );
  }

  return (
    <ViroNode position={[0, 0.2, 0]}>
      <ViroSphere
        radius={0.12}
        onTouch={AR_INTERACTIONS_ENABLED ? handleModelTouch : undefined}
      />
      <ViroText text={memory.name} position={[0, 0.2, 0]} scale={[0.2, 0.2, 0.2]} />
    </ViroNode>
  );
}

function MemoryARScene({ sceneNavigator }: MemoryARSceneProps) {
  const {
    arMemories = [],
    creatingMemoryMode = false,
    memoryToPlace,
    nearbyMemories = [],
    onMemoryCollected,
    onMemorySelected,
    onMemoryPlaced,
    onPlaneTapped,
    onModelLoadingStatus,
    resetPlacedMemoryKey,
    canCollect = false,
  } = sceneNavigator?.viroAppProps || {};
  const [detectedPlanes, setDetectedPlanes] = React.useState<PlaneAnchor[]>([]);
  const [selectedPlaneId, setSelectedPlaneId] = React.useState<string | null>(null);
  const [placedMemory, setPlacedMemory] = React.useState<MemoryRecord | null>(null);
  const displayedMemory = memoryToPlace ?? placedMemory;
  const nearbyMemoriesById = React.useMemo(
    () => new Map(nearbyMemories.map((memory) => [String(memory.id), memory])),
    [nearbyMemories],
  );

  React.useEffect(() => {
    setPlacedMemory(null);
    setSelectedPlaneId(null);
  }, [resetPlacedMemoryKey]);

  React.useEffect(() => {
    if (!creatingMemoryMode && !displayedMemory) {
      setSelectedPlaneId(null);
    }
  }, [creatingMemoryMode, displayedMemory]);

  const handleAnchorFound = (anchor: PlaneAnchor) => {
    const anchorType = String(anchor.type || 'plane').toLowerCase();
    const alignment = String(anchor.alignment || 'Horizontal');
    const hasDimensions = typeof anchor.width === 'number'
      && Number.isFinite(anchor.width)
      && typeof anchor.height === 'number'
      && Number.isFinite(anchor.height);

    if (anchorType !== 'plane' || !alignment.includes('Horizontal')) return;
    if (hasDimensions && (
      (anchor.width as number) < MIN_PLANE_SIZE_METERS
      || (anchor.height as number) < MIN_PLANE_SIZE_METERS
    )) return;
    setDetectedPlanes((currentPlanes) => {
      if (currentPlanes.some((plane) => plane.anchorId === anchor.anchorId)) return currentPlanes;
      return [...currentPlanes, anchor].slice(-MAX_DETECTED_PLANES);
    });
  };

  const handlePlaneSelected = (planeId: string) => {
    setSelectedPlaneId(planeId);
    if (creatingMemoryMode) {
      onPlaneTapped?.({ nativeEvent: { screenX: 0, screenY: 0 } });
      return;
    }
    if (memoryToPlace) {
      setPlacedMemory(memoryToPlace);
      onMemoryPlaced?.({ nativeEvent: { id: memoryToPlace.id, name: memoryToPlace.name } });
    }
  };

  const handlePlacedMemoryCollected = (event: { nativeEvent: { id: number; name: string } }) => {
    if (!canCollect) {
      onMemoryCollected?.(event);
      return;
    }
    setPlacedMemory(null);
    onMemoryCollected?.(event);
  };

  const memoizedDroplets = React.useMemo(() => {
    if (creatingMemoryMode || displayedMemory) return null;
    return arMemories.map((memory) => {
      const nearbyMemory = nearbyMemoriesById.get(String(memory.id));
      if (!nearbyMemory) return null;

      const position = nearbyMemory.relativePosition
        || getRelativeARPosition(nearbyMemory.bearingDeg, nearbyMemory.distanceMeters);

      return (
        <ViroNode key={memory.id} position={position}>
          <ViroSphere
            radius={BUBBLE_RADIUS_METERS}
            materials={['memoryDroplet']}
            onClickState={AR_INTERACTIONS_ENABLED ? (state: number) => {
              if (state === 3) {
                onMemorySelected?.({ nativeEvent: { id: memory.id, name: memory.name } });
              }
            } : undefined}
          />
        </ViroNode>
      );
    });
  }, [arMemories, nearbyMemoriesById, creatingMemoryMode, displayedMemory, onMemorySelected]);

  return (
    <ViroARScene
      anchorDetectionTypes={selectedPlaneId || memoryToPlace || detectedPlanes.length >= 3 ? [] : ['PlanesHorizontal']}
      toneMappingEnabled={false}
      onAnchorFound={handleAnchorFound}
      onAnchorRemoved={(anchor) => {
        const removedId = anchor?.anchorId;
        setDetectedPlanes((currentPlanes) => currentPlanes.filter(
          (plane) => plane.anchorId !== removedId,
        ));
        setSelectedPlaneId((currentId) => (currentId === removedId ? null : currentId));
      }}>

      <ViroAmbientLight color="#FFFFFF" intensity={400} />
      <ViroDirectionalLight color="#FFFFFF" direction={[0, -1, -0.5]} intensity={600} />
      {detectedPlanes.map((plane) => {
        const isSelected = selectedPlaneId === plane.anchorId;
        const canSelect = creatingMemoryMode || !!memoryToPlace;
        const planeWidth = Math.max(plane.width || MIN_PLANE_SIZE_METERS, MIN_PLANE_SIZE_METERS);
        const planeHeight = Math.max(plane.height || MIN_PLANE_SIZE_METERS, MIN_PLANE_SIZE_METERS);
        const outlineThickness = 0.008;

        // On Galaxy A devices, rendering outlines for all detected planes simultaneously causes heavy z-fighting and flickering.
        // Render outlines only for the selected plane or when no plane is selected yet.
        if (selectedPlaneId && !isSelected) return null;

        return (
          <ViroARPlane
            key={plane.anchorId}
            anchorId={plane.anchorId}
            minWidth={MIN_PLANE_SIZE_METERS}
            minHeight={MIN_PLANE_SIZE_METERS}
            alignment="Horizontal"
            onClickState={canSelect && AR_INTERACTIONS_ENABLED
              ? (state: number) => {
                if (state === 3) handlePlaneSelected(plane.anchorId);
              }
              : undefined}
          >
            {isSelected && displayedMemory && (
              <ViroNode position={[0, 0.02, 0]}>
                <MemoryContent
                  memory={displayedMemory}
                  onLoadingStatus={onModelLoadingStatus}
                  onMemoryCollected={handlePlacedMemoryCollected}
                />
              </ViroNode>
            )}
          </ViroARPlane>
        );
      })}
      {memoizedDroplets}

      
    </ViroARScene>
  );
}

function ViroMemoryScene(props: MemoryARSceneProps = {}) {
  
  return <MemoryARScene {...props} />;
}

export default function ViroARView({
  arMemories = [],
  creatingMemoryMode = false,
  memoryToPlace,
  nearbyMemories = [],
  onMemoryCollected,
  onMemorySelected,
  onMemoryPlaced,
  onPlaneTapped,
  onModelLoadingStatus,
  resetPlacedMemoryKey = 0,
  canCollect = false,
  ...viewProps
}: ViroARViewProps) {
  return (
    <ViroARSceneNavigator
      {...viewProps}
      autofocus={false}
      videoQuality="High"
      hdrEnabled={false}
      pbrEnabled={false}
      bloomEnabled={false}
      shadowsEnabled={false}
      multisamplingEnabled={false}
      worldAlignment="Gravity"
      viroAppProps={{ arMemories, creatingMemoryMode, memoryToPlace, nearbyMemories, onMemoryCollected, onMemorySelected, onMemoryPlaced, onPlaneTapped, onModelLoadingStatus, resetPlacedMemoryKey, canCollect }}
      initialScene={{ scene: ViroMemoryScene }}
    />
    
    
    
  );
}
