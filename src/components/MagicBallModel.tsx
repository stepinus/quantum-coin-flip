'use client';

import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnswerDisplay } from './AnswerDisplay';

interface MagicBallModelProps {
  isShaking: boolean;
  currentAnswer: string;
}

export function MagicBallModel({ isShaking, currentAnswer }: MagicBallModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const shakeStartTimeRef = useRef<number>(0);
  const { scene, materials } = useGLTF('/ball.glb');

  // Clone the scene to avoid material conflicts
  const clonedScene = scene.clone();

  // Apply proper materials for black glossy shell and transparent window
  const shellMaterial = materials['ball_1'] as THREE.MeshStandardMaterial;
  const windowMaterial = materials['window_1'] as THREE.MeshStandardMaterial;

  if (shellMaterial) {
    shellMaterial.transparent = false;
    shellMaterial.opacity = 1.0;
    shellMaterial.color.set('black');
    shellMaterial.roughness = 0.3; // Glossy finish as per design
    shellMaterial.metalness = 0.1; // Slight metallic property
    shellMaterial.depthWrite = true;
    shellMaterial.depthTest = true;
    shellMaterial.side = THREE.FrontSide;
  }

  if (windowMaterial) {
    windowMaterial.transparent = true;
    windowMaterial.opacity = 0.9; // Transparent window as per design
    windowMaterial.roughness = 0.0; // Smooth glass-like surface
    windowMaterial.metalness = 0.0;
    windowMaterial.depthWrite = false; // Allow objects behind to be visible
    windowMaterial.depthTest = true;
    windowMaterial.side = THREE.FrontSide;
  }

  // Hide any unwanted elements (like d20)
  clonedScene.traverse((node) => {
    if (node.name === 'd20_1') {
      node.visible = false;
    }
  });

  // Track shake start time when isShaking changes to true
  useEffect(() => {
    if (isShaking) {
      shakeStartTimeRef.current = Date.now();
    }
  }, [isShaking]);

  // Shake animation using useFrame hook with sine wave rotations
  useFrame((state) => {
    if (isShaking && groupRef.current) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - shakeStartTimeRef.current) / 1000; // Convert to seconds
      
      // Only animate for 3 seconds as per requirement
      if (elapsedTime < 3) {
        // Use different frequencies for each axis to create realistic shake
        const time = state.clock.elapsedTime;
        groupRef.current.rotation.x = Math.sin(time * 20) * 0.3; // Fast X rotation
        groupRef.current.rotation.y = Math.sin(time * 15) * 0.3; // Medium Y rotation  
        groupRef.current.rotation.z = Math.sin(time * 25) * 0.2; // Fast Z rotation with less amplitude
      } else {
        // Reset rotation after 3 seconds
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.y = 0;
        groupRef.current.rotation.z = 0;
      }
    } else if (groupRef.current) {
      // Reset rotation when not shaking
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedScene} 
        scale={10} // Basic scaling as per design
        rotation={[Math.PI / 2, 0, 0]} // Basic positioning
        position={[0, 0, 0]} // Centered position
        castShadow
        receiveShadow
      />
      
      {/* 3D Answer Display positioned in ball's window */}
      <AnswerDisplay 
        answer={currentAnswer} 
        visible={!isShaking && !!currentAnswer} 
      />
    </group>
  );
}

// Preload the GLB model for better performance
useGLTF.preload('/ball.glb');