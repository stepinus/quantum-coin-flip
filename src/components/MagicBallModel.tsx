'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnswerDisplay } from './AnswerDisplay';

interface MagicBallModelProps {
  isShaking: boolean;
  currentAnswer: string;
}

export function MagicBallModel({ isShaking, currentAnswer }: MagicBallModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene, materials } = useGLTF('/ball.glb', true);
  const { gl } = useThree();



  // Process loaded scene and materials with useMemo for proper r3f pattern
  const processedScene = useMemo(() => {
    if (!scene) return null;
    
    // Clone the scene to avoid material conflicts
    const clonedScene = scene.clone();
    
    // Process materials for seam reduction
    clonedScene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.material) {
        const material = node.material as THREE.MeshStandardMaterial;
        
        // Ball shell - optimize for seam reduction
        material.transparent = false;
        material.opacity = 1.0;
        material.roughness = 0.01; // Ultra-smooth surface helps blend seams
        material.metalness = 0.7; // Higher metalness for stronger reflections that mask seams
        material.envMapIntensity = 2.5; // Stronger environment reflections to mask texture seams
        material.flatShading = false;
        material.depthWrite = true;
        material.depthTest = true;
        material.side = THREE.FrontSide;
        
        
        // Enhanced texture filtering for seam reduction
        if (material.map) {
          material.map.generateMipmaps = true;
          material.map.minFilter = THREE.LinearMipmapLinearFilter;
          material.map.magFilter = THREE.LinearFilter;
          material.map.anisotropy = gl.capabilities.getMaxAnisotropy();
          material.map.wrapS = THREE.MirroredRepeatWrapping;
          material.map.wrapT = THREE.RepeatWrapping;
          material.map.offset.set(0.001, 0);
        }
        
        if (material.normalMap) {
          material.normalMap.wrapS = THREE.RepeatWrapping;
          material.normalMap.wrapT = THREE.RepeatWrapping;
          material.normalMap.generateMipmaps = true;
          material.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
          material.normalMap.magFilter = THREE.LinearFilter;
          material.normalMap.anisotropy = gl.capabilities.getMaxAnisotropy();
        }
        
        if (material.roughnessMap) {
          material.roughnessMap.wrapS = THREE.RepeatWrapping;
          material.roughnessMap.wrapT = THREE.RepeatWrapping;
          material.roughnessMap.generateMipmaps = true;
          material.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
          material.roughnessMap.magFilter = THREE.LinearFilter;
          material.roughnessMap.anisotropy = gl.capabilities.getMaxAnisotropy();
        }
        
        if (material.metalnessMap) {
          material.metalnessMap.wrapS = THREE.RepeatWrapping;
          material.metalnessMap.wrapT = THREE.RepeatWrapping;
          material.metalnessMap.generateMipmaps = true;
          material.metalnessMap.minFilter = THREE.LinearMipmapLinearFilter;
          material.metalnessMap.magFilter = THREE.LinearFilter;
          material.metalnessMap.anisotropy = gl.capabilities.getMaxAnisotropy();
        }
        
        material.needsUpdate = true;
      }
    });
    
    // Hide unwanted elements
    clonedScene.traverse((node) => {
      if (node.name === 'd20_1') {
        node.visible = false;
      }
    });
    
    // Optimize geometry
    clonedScene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.geometry) {
        // node.geometry.computeVertexNormals();
        // node.geometry.normalizeNormals();
        
        if (node.geometry.attributes.uv) {
          node.geometry.computeTangents();
        }
        
        node.geometry.computeBoundingBox();
        node.geometry.computeBoundingSphere();
      }
    });
    
    return clonedScene;
  }, [scene, materials, gl]);

  // Simple shake animation - just rotate the ball
  useFrame((state) => {
    if (!groupRef.current) return;

    if (isShaking) {
      // Simple rotation animation - 2 full rotations in random directions
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.x = Math.sin(time * 2) * 0.3;
      groupRef.current.rotation.y = Math.cos(time * 1) * 0.3;
      groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.2;
    } else {
      // Smooth return to neutral position
      const lerpFactor = 0.1;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, lerpFactor);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
    }
  });

  // Use processed scene directly
  const ballObject = processedScene;

  // Debug render state
  const showLoadingIndicator = !ballObject;
  const showBallModel = !!ballObject;



  return (
    <group ref={groupRef}>
      {/* Loading indicator - only shown when model is not loaded */}
      {showLoadingIndicator && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#555555"
            wireframe={true}
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Neutral glow around the ball */}
      <mesh position={[0, 0, 0]} scale={10.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#333333"
          transparent={true}
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main ball model - always rendered once loaded */}
      {ballObject && (
        <primitive
          object={ballObject}
          scale={10}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          castShadow
          receiveShadow
        />
      )}

      {/* 3D Answer Display - always rendered for blue background */}
      <AnswerDisplay
        answer={currentAnswer}
        visible={!isShaking && !!currentAnswer}
        alwaysShowBackground={true}
      />

      {/* Base lighting for the ball */}
      <spotLight
        position={[0, 5, 0]}
        angle={0.6}
        penumbra={0.9}
        intensity={0.4}
        color="#777777"
        distance={15}
        decay={2}
        castShadow
      />

      {/* Enhanced lighting - always present */}
      <spotLight
        position={[0, 3, 2]}
        angle={0.4}
        penumbra={0.95}
        intensity={!isShaking && currentAnswer ? 0.5 : 0.2}
        color="#aaaaaa"
        distance={6}
        decay={3}
        castShadow
      />
    </group>
  );
}

// Preload the GLB model for better performance
useGLTF.preload('/ball.glb');