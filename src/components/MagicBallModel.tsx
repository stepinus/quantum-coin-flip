'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
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
  
  // State for animation management
  const [isIdle, setIsIdle] = useState(true);
  const [lastAnswerTime, setLastAnswerTime] = useState<number | null>(null);
  const [shakeStartTime, setShakeStartTime] = useState<number | null>(null);
  const [idleStartRotationY, setIdleStartRotationY] = useState(0);
  const [idleStartTime, setIdleStartTime] = useState<number | null>(null);
  const [isTurningToUser, setIsTurningToUser] = useState(false);
  const [hasReachedUserPosition, setHasReachedUserPosition] = useState(false);
  
  // Track when shaking starts - first turn to user, then shake
  useEffect(() => {
    if (isShaking) {
      setIsIdle(false);
      // Check if ball is already facing user (rotation Y close to 0)
      if (groupRef.current) {
        const currentRotationY = groupRef.current.rotation.y % (Math.PI * 2);
        const normalizedRotation = Math.abs(currentRotationY);
        const isAlreadyFacingUser = normalizedRotation < 0.2 || normalizedRotation > (Math.PI * 2 - 0.2);
        
        if (isAlreadyFacingUser) {
          // Already facing user, start shaking immediately
          setHasReachedUserPosition(true);
          setIsTurningToUser(false);
          setShakeStartTime(Date.now());
        } else {
          // Need to turn to user first
          setIsTurningToUser(true);
          setHasReachedUserPosition(false);
        }
      }
    } else {
      // Reset states when shaking stops
      setIsTurningToUser(false);
      setHasReachedUserPosition(false);
    }
  }, [isShaking]);
  
  // Track when answer changes to reset idle timer
  useEffect(() => {
    if (currentAnswer && !isShaking) {
      setLastAnswerTime(Date.now());
      setIsIdle(false);
      // Save the position when ball stops shaking and shows answer (facing user)
      if (groupRef.current) {
        setIdleStartRotationY(groupRef.current.rotation.y);
      }
    }
  }, [currentAnswer, isShaking]);
  
  // Check if we should enter idle state
  useEffect(() => {
    if (!currentAnswer) {
      // Initial state - page just loaded
      setIsIdle(true);
      setIdleStartRotationY(0);
      setIdleStartTime(Date.now());
      return;
    }
    
    if (lastAnswerTime && !isShaking && !isIdle) {
      const timer = setInterval(() => {
        const timeSinceAnswer = Date.now() - lastAnswerTime;
        if (timeSinceAnswer > 7000) { // 7 seconds
          // Enter idle state only once (rotation position already saved when answer was shown)
          setIdleStartTime(Date.now());
          setIsIdle(true);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [lastAnswerTime, isShaking, currentAnswer, isIdle]);



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

  // Animation logic for different states
  useFrame((state) => {
    if (!groupRef.current) return;

    if (isShaking && isTurningToUser) {
      // Phase 1: Turn to face user before shaking
      const lerpFactor = 0.15; // Faster turn to user
      const targetRotationY = 0; // Face user (front of the ball)
      
      // Return position to center while turning
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpFactor);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, lerpFactor);
      groupRef.current.position.z = 0;
      
      // Turn to face user
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, lerpFactor);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
      
      // Check if we've reached the user-facing position
      const rotationDiff = Math.abs(groupRef.current.rotation.y - targetRotationY);
      if (rotationDiff < 0.1) {
        // Close enough to user position, start shaking
        setHasReachedUserPosition(true);
        setIsTurningToUser(false);
        setShakeStartTime(Date.now());
        // Save this position for later idle rotation
        setIdleStartRotationY(targetRotationY);
      }
    } else if (isShaking && hasReachedUserPosition && shakeStartTime) {
      // Phase 2: Shaking animation - movement along X and Y axes with decay
      const currentTime = Date.now();
      const timeElapsed = (currentTime - shakeStartTime) / 1000; // Convert to seconds
      const shakeDuration = 3; // seconds
      
      // Calculate progress and decay factor
      const shakeProgress = Math.min(timeElapsed / shakeDuration, 1);
      const decayFactor = Math.max(0, 1 - shakeProgress);
      
      // Use animation time for smooth oscillations
      const animTime = state.clock.elapsedTime;
      
      // Shaking movement with multiple frequencies for realistic effect
      const shakeIntensity = 0.25 * decayFactor;
      const fastShake = Math.sin(animTime * 15) * shakeIntensity;
      const mediumShake = Math.cos(animTime * 8) * shakeIntensity * 0.7;
      const slowShake = Math.sin(animTime * 3) * shakeIntensity * 0.5;
      
      // Apply position changes (not rotation)
      groupRef.current.position.x = (fastShake + mediumShake) * 0.6;
      groupRef.current.position.y = (Math.cos(animTime * 12) + slowShake) * shakeIntensity * 0.5;
      groupRef.current.position.z = 0; // Keep Z position stable
      
      // Keep rotation stable during shaking (facing user)
      const lerpFactor = 0.1;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, lerpFactor);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
    } else if (isIdle && idleStartTime) {
      // Idle animation - rotation + floating effect
      const currentTime = Date.now();
      const idleElapsedTime = (currentTime - idleStartTime) / 1000; // Convert to seconds
      const lerpFactor = 0.05; // Slower lerp for smooth transition
      
      // Continue rotation from saved position
      const targetRotationY = idleStartRotationY + (idleElapsedTime * 0.2); // Slow rotation speed from saved position
      
      // Floating effect - slow up/down movement
      const floatAmplitude = 0.3; // How high/low it moves
      const floatSpeed = 1.5; // Speed of floating animation
      const floatOffset = Math.sin(idleElapsedTime * floatSpeed) * floatAmplitude;
      
      // Return X position to center, add floating to Y
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpFactor);
      groupRef.current.position.y = floatOffset;
      groupRef.current.position.z = 0;
      
      // Apply idle rotation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
      groupRef.current.rotation.y = targetRotationY;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
    } else {
      // Answer shown state - smooth return to user-facing position
      const lerpFactor = 0.1;
      
      // Return position to center
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpFactor);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, lerpFactor);
      groupRef.current.position.z = 0;
      
      // Stay facing user while showing answer (rotation Y = 0)
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
          rotation={[Math.PI / 2, Math.PI, 0]}
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