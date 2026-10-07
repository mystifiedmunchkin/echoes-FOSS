import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroBox,
  ViroAmbientLight,
  ViroMaterials,
} from '@reactvision/react-viro';

ViroMaterials.createMaterials({
  cubeMaterial: { diffuseColor: '#FF5722' },
});

const ARCubeScene = (props) => {
  const { cubes, addCube, debugMode } = props.sceneNavigator.viroAppProps;

  const handleSceneClick = (clickState, position) => {
    // clickState === 3 is ClickUp (Tap completed)
    if (clickState === 3 && position) {
      addCube(position);
    }
  };

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal', 'PlanesVertical']}
      displayPointCloud={debugMode}
      onClickState={handleSceneClick}
    >
      <ViroAmbientLight color="#FFFFFF" />

      {cubes.map((cube) => (
        <ViroBox
          key={cube.id}
          position={cube.position}
          scale={[0.1, 0.1, 0.1]} // 10 cm cube
          materials={['cubeMaterial']}
          dragType="FixedToWorld"
        />
      ))}
    </ViroARScene>
  );
};

export default function App() {
  const [showAR, setShowAR] = useState(false);
  const [cubes, setCubes] = useState([]);
  const [debugMode, setDebugMode] = useState(true);

  const addCube = (position) => {
    setCubes((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, position },
    ]);
  };

  if (!showAR) {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowAR(true)}
        >
          <Text style={styles.buttonText}>Start AR Scene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flexContainer}>
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{ scene: ARCubeScene }}
        viroAppProps={{ cubes, addCube, debugMode }}
        style={styles.flexContainer}
      />

      <View style={styles.overlayContainer}>
        <TouchableOpacity
          style={styles.overlayButton}
          onPress={() => setShowAR(false)}
        >
          <Text style={styles.buttonText}>← Exit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overlayButton}
          onPress={() => setCubes([])}
        >
          <Text style={styles.buttonText}>Clear ({cubes.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  overlayContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overlayButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});