/**
 * Viro/ARCore scene: renders planes, memory droplets, and selected memory content.
 */
import * as React from 'react';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroARPlaneSelector,
  ViroNode,
  ViroMaterials,
  ViroText,
} from '@reactvision/react-viro';
import { MemoryRecord, NearbyMemory, ViroARViewProps } from './ViroAR.types';

ViroMaterials.createMaterials({
  planeMaterial: {
    diffuseColor: '#FFFFFF',
    lightingModel: 'Lambert',
    opacity: 0.3,
  },
});

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

function MemoryARScene({ sceneNavigator }: MemoryARSceneProps) {
  const {
    creatingMemoryMode = false,
    memoryToPlace,
  } = sceneNavigator?.viroAppProps || {};

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal', 'PlanesVertical']}
      onTrackingUpdated={(state, reason) => {
        console.log(`[AR Tracking] State: ${state}, Reason: ${reason}`);
      }}
    >
      <ViroAmbientLight color="#FFFFFF" intensity={500} />
      <ViroDirectionalLight color="#FFFFFF" direction={[0, -1, -0.5]} intensity={800} />

      {/* Plane selector allows users to tap and place on detected surfaces */}
      <ViroARPlaneSelector
        alignment="Horizontal"
        minHeight={0.1}
        minWidth={0.1}
        onPlaneUpdated={(anchor) => {
          console.log(`[AR Plane] Updated: ${anchor.anchorId}, W=${anchor.width}, H=${anchor.height}`);
        }}
        onClick={(position) => {
          console.log(`[AR Click] Position: ${JSON.stringify(position)}`);
        }}
      >
        <ViroNode>
           <ViroText text="Plane Detected" color="#00FF00" scale={[0.2, 0.2, 0.2]} position={[0, 0.1, 0]} />
        </ViroNode>
      </ViroARPlaneSelector>
    </ViroARScene>
  );
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
      autofocus={true}
      videoQuality="High"
      worldAlignment="GravityAndHeading"
      viroAppProps={{ arMemories, creatingMemoryMode, memoryToPlace, nearbyMemories, onMemoryCollected, onMemorySelected, onMemoryPlaced, onPlaneTapped, onModelLoadingStatus, resetPlacedMemoryKey, canCollect }}
      initialScene={{ scene: MemoryARScene }}
    />
  );
}
