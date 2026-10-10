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
import { ViroARViewProps } from './ViroAR.types';

ViroMaterials.createMaterials({
  planeMaterial: {
    diffuseColor: '#FFFFFF',
    lightingModel: 'Lambert',
  },
});

function MemoryARScene() {
  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal', 'PlanesVertical']}
      onTrackingUpdated={(state, reason) => {
        console.log(`[AR Tracking] State: ${state}, Reason: ${reason}`);
      }}
    >
      <ViroAmbientLight color="#FFFFFF" intensity={500} />
      <ViroDirectionalLight color="#FFFFFF" direction={[0, -1, -0.5]} intensity={800} />

      {/* Try to use hitTest on the scene level for point/depth based placement */}
      <ViroNode
        onClick={(position) => {
          console.log(`[AR Click] Depth/Point hit: ${JSON.stringify(position)}`);
        }}
      >
        <ViroText text="Tap surface (Depth/Points)" color="#FF0000" scale={[0.2, 0.2, 0.2]} position={[0, 0, -1]} />
      </ViroNode>
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
