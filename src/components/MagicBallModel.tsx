'use client';

import { useRef, useEffect, useState } from 'react';
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
  const clonedSceneRef = useRef<THREE.Group | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);
  const initialAnimationStartTimeRef = useRef<number>(Date.now());
  const answerAnimationStartTimeRef = useRef<number>(0);
  const prevAnswerRef = useRef<string>('');
  const prevShakingRef = useRef<boolean>(false);
  const { scene, materials } = useGLTF('/ball.glb', true); // true для приоритетной загрузки

  // Initialize cloned scene and materials only once
  useEffect(() => {
    if (!clonedSceneRef.current && scene) {
      // Clone the scene to avoid material conflicts
      const clonedScene = scene.clone();
      clonedSceneRef.current = clonedScene;
      
      // Установим флаг, что модель загружена
      setModelLoaded(true);

      // Apply proper materials for black glossy shell and transparent window
      const shellMaterial = materials['ball_1'] as THREE.MeshStandardMaterial;
      const windowMaterial = materials['window_1'] as THREE.MeshStandardMaterial;

      if (shellMaterial) {
        shellMaterial.transparent = false;
        shellMaterial.opacity = 1.0;
        // Keep original color/texture - don't force black
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

      // Debug and fix all materials in the scene
      clonedScene.traverse((node) => {
        if (node instanceof THREE.Mesh && node.material) {
          const material = node.material as THREE.MeshStandardMaterial;

          // Apply settings based on mesh/material name
          if (node.name.includes('window') || material.name?.includes('window')) {
            // Window should be transparent
            material.transparent = true;
            material.opacity = 0.9;
            material.roughness = 0.0;
            material.metalness = 0.0;
            material.depthWrite = false;
            material.depthTest = true;
            material.side = THREE.FrontSide;
          } else {
            // Everything else (ball shell) should be fully opaque but keep original color/texture
            material.transparent = false;
            material.opacity = 1.0;
            // DON'T change color - keep original texture
            material.depthWrite = true;
            material.depthTest = true;
            material.side = THREE.FrontSide;
          }
        }
      });

      // Hide any unwanted elements (like d20)
      clonedScene.traverse((node) => {
        if (node.name === 'd20_1') {
          node.visible = false;
        }
      });
    }
  }, [scene, materials]);

  // Track shake start time when isShaking changes to true
  useEffect(() => {
    if (isShaking) {
      shakeStartTimeRef.current = Date.now();
    }
  }, [isShaking]);

  // Отслеживаем изменение ответа для запуска анимации
  useEffect(() => {
    // Если ответ изменился с пустого на непустой и тряска закончилась
    if (currentAnswer && !prevAnswerRef.current && !isShaking && prevShakingRef.current) {
      answerAnimationStartTimeRef.current = Date.now();
    }
    
    prevAnswerRef.current = currentAnswer;
    prevShakingRef.current = isShaking;
  }, [currentAnswer, isShaking]);

  // Enhanced animations with initial spin, shake and answer appearance
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const currentTime = Date.now();
    
    // 1. Анимация при входе на страницу - вращение вдоль оси Y (горизонтальное)
    if (!initialAnimationDone) {
      const elapsedTime = (currentTime - initialAnimationStartTimeRef.current) / 1000;
      
      if (elapsedTime < 3) {
        // Начальное быстрое вращение с замедлением
        const rotationSpeed = Math.max(0.1, 3 - elapsedTime) * 2;
        groupRef.current.rotation.y += rotationSpeed * 0.03;
        
        // Добавляем небольшое колебание по другим осям для реалистичности
        groupRef.current.rotation.x = Math.sin(elapsedTime * 2) * 0.05;
        groupRef.current.rotation.z = Math.sin(elapsedTime * 3) * 0.03;
      } else {
        // Плавное затухание вращения
        const dampingTime = Math.min(2, elapsedTime - 3);
        const dampingFactor = Math.max(0, 1 - dampingTime / 2);
        
        if (dampingFactor > 0) {
          // Затухающее вращение
          groupRef.current.rotation.y += 0.2 * dampingFactor * 0.03;
          groupRef.current.rotation.x = Math.sin(elapsedTime * 2) * 0.05 * dampingFactor;
          groupRef.current.rotation.z = Math.sin(elapsedTime * 3) * 0.03 * dampingFactor;
        } else {
          // Анимация завершена
          setInitialAnimationDone(true);
          groupRef.current.rotation.x = 0;
          groupRef.current.rotation.y = 0;
          groupRef.current.rotation.z = 0;
        }
      }
      
      return; // Выходим, чтобы не выполнять другие анимации
    }

    // 2. Анимация тряски
    if (isShaking) {
      const elapsedTime = (currentTime - shakeStartTimeRef.current) / 1000; // Convert to seconds

      // Плавная анимация тряски с затуханием
      if (elapsedTime < 3) {
        // Use different frequencies for each axis to create realistic shake
        const time = state.clock.elapsedTime;
        
        // Create more realistic shake with varying intensity
        const intensity = Math.max(0.1, 1 - elapsedTime / 3); // Gradually reduce intensity
        
        // Add some randomness to make shake feel more natural
        const randomX = (Math.random() - 0.5) * 0.1;
        const randomY = (Math.random() - 0.5) * 0.1;
        const randomZ = (Math.random() - 0.5) * 0.05;
        
        groupRef.current.rotation.x = (Math.sin(time * 18 + randomX) * 0.25 + randomX) * intensity;
        groupRef.current.rotation.y = (Math.sin(time * 22 + randomY) * 0.25 + randomY) * intensity;
        groupRef.current.rotation.z = (Math.sin(time * 16 + randomZ) * 0.15 + randomZ) * intensity;
        
        // Add subtle position shake for more realism
        groupRef.current.position.x = Math.sin(time * 25) * 0.02 * intensity;
        groupRef.current.position.y = Math.sin(time * 30) * 0.02 * intensity;
      } else {
        // Settling animation after shake stops - плавное затухание
        const settleTime = elapsedTime - 3;
        if (settleTime < 1.0) { // Увеличиваем время затухания до 1 секунды
          // Gentle settling motion
          const settleIntensity = Math.max(0, 1 - settleTime / 1.0);
          
          // Используем более плавные функции для затухания
          const easeOutCubic = 1 - Math.pow(1 - settleIntensity, 3);
          
          groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 8) * 0.05 * easeOutCubic;
          groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 6) * 0.05 * easeOutCubic;
          groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.03 * easeOutCubic;
          
          groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 12) * 0.01 * easeOutCubic;
          groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.01 * easeOutCubic;
        } else {
          // Очень плавное возвращение к нейтральному положению
          const lerpFactor = 0.05; // Уменьшаем фактор для более плавного перехода
          groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, lerpFactor);
          groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
          
          groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpFactor);
          groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, lerpFactor);
          groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, lerpFactor);
        }
      }
    } else {
      // 3. Плавное возвращение к нейтральному положению, когда нет тряски
      const lerpFactor = 0.1;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, lerpFactor);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
      
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpFactor);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, lerpFactor);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, lerpFactor);
    }
  });

  // Убираем мельтешащие частицы вокруг шарика

  return (
    <group ref={groupRef}>
      {/* Индикатор загрузки - показывается только когда модель не загружена */}
      {!modelLoaded && (
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
      
      {/* Нейтральное свечение вокруг шара */}
      <mesh position={[0, 0, 0]} scale={10.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#333333" 
          transparent={true} 
          opacity={0.08} 
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Нейтральная подсветка для шара */}
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
      
      {modelLoaded && clonedSceneRef.current && (
        <primitive
          object={clonedSceneRef.current}
          scale={10} // Basic scaling as per design
          rotation={[Math.PI / 2, 0, 0]} // Basic positioning
          position={[0, 0, 0]} // Centered position
          castShadow
          receiveShadow
        />
      )}

      {/* 3D Answer Display positioned in ball's window - always rendered for blue background */}
      <AnswerDisplay
        answer={currentAnswer}
        visible={!isShaking && !!currentAnswer}
        alwaysShowBackground={true}
      />
      
      {/* Нейтральная подсветка при появлении ответа */}
      {!isShaking && currentAnswer && (
        <spotLight
          position={[0, 3, 2]}
          angle={0.4}
          penumbra={0.95}
          intensity={0.5}
          color="#aaaaaa"
          distance={6}
          decay={3}
          castShadow
        />
      )}
    </group>
  );
}

// Preload the GLB model for better performance
useGLTF.preload('/ball.glb');