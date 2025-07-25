'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface AnswerDisplayProps {
  answer: string;
  visible: boolean;
  alwaysShowBackground?: boolean;
}

export function AnswerDisplay({ answer, visible, alwaysShowBackground = true }: AnswerDisplayProps) {
  // Always show the blue background, but only show text when visible and answer exists
  const showText = visible && !!answer;

  // Состояние для анимации появления ответа
  const [answerAnimationStarted, setAnswerAnimationStarted] = useState(false);
  const answerAnimationTimeRef = useRef<number>(0);
  const textGroupRef = useRef<THREE.Group>(null!);
  const prevVisibleRef = useRef<boolean>(false);

  // Запускаем анимацию при появлении ответа
  useEffect(() => {
    if (visible && !prevVisibleRef.current && answer) {
      setAnswerAnimationStarted(true);
      answerAnimationTimeRef.current = Date.now();
    }
    prevVisibleRef.current = visible;
  }, [visible, answer]);

  // Референс для пульсирующего свечения
  const pulsingGlowRef = useRef<THREE.Mesh>(null!);

  // Анимация появления текста и пульсация свечения
  useFrame((state) => {
    // Пульсация свечения экрана
    if (pulsingGlowRef.current && pulsingGlowRef.current.material) {
      const material = pulsingGlowRef.current.material as THREE.MeshBasicMaterial;
      const pulseFactor = Math.sin(state.clock.elapsedTime * 1.5) * 0.1 + 0.3; // Пульсация от 0.2 до 0.4
      material.opacity = pulseFactor;
    }

    // Анимация появления текста
    if (!textGroupRef.current || !answerAnimationStarted) return;

    const elapsedTime = (Date.now() - answerAnimationTimeRef.current) / 1000;
    const animationDuration = 1.5; // Длительность анимации в секундах

    if (elapsedTime < animationDuration) {
      // Начальная фаза - рост из маленького размера
      const growthPhase = Math.min(1, elapsedTime / 0.8);
      const scale = THREE.MathUtils.lerp(0.1, 1, growthPhase);

      // Вращение текста по часовой стрелке (отрицательное значение для Z)
      const rotationPhase = Math.min(1, elapsedTime / animationDuration);
      // Используем ось Z для вращения в плоскости экрана (по часовой стрелке)
      const rotationZ = (1 - rotationPhase) * Math.PI * -1; // Половина оборота по часовой стрелке

      // Применяем анимацию
      textGroupRef.current.scale.set(scale, scale, scale);
      textGroupRef.current.rotation.z = rotationZ;

      // Небольшое покачивание для эффекта "пружины"
      if (growthPhase > 0.8) {
        const bounce = Math.sin((elapsedTime - 0.8) * 15) * 0.1 * (1 - (elapsedTime - 0.8) / 0.7);
        textGroupRef.current.scale.set(scale + bounce, scale + bounce, scale + bounce);
      }
    } else {
      // Анимация завершена
      textGroupRef.current.scale.set(1, 1, 1);
      textGroupRef.current.rotation.z = 0;
      setAnswerAnimationStarted(false);
    }
  });

  // Автоматический размер шрифта в зависимости от длины текста
  const fontSize = answer.length > 50 ? 0.08 : answer.length > 30 ? 0.1 : 0.12;

  return (
    <group position={[0, -0.15, 1.45]} rotation={[0, 0, 0]}>
      {/* Глубокий мистический синий фон с эффектом свечения - без рамки */}
      <mesh position={[0, 0.1, -0.05]}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial
          color="#0a1128"
          emissive="#1e40af"
          emissiveIntensity={0.8}
          metalness={0.2}
          roughness={0.3}
          transparent={true}
          opacity={0.98}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Внутреннее яркое свечение - создает эффект глубины */}
      <mesh position={[0, 0.1, -0.04]}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial
          color="#1e40af"
          transparent={true}
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Внутреннее свечение - без видимой рамки */}
      <mesh position={[0, 0.1, -0.055]}>
        <circleGeometry args={[0.61, 32]} />
        <meshBasicMaterial
          color="#1e3a8a"
          transparent={true}
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Группа для текста с анимацией появления */}
      {showText && (
        <group
          position={[0, 0.1, -0.02]}
          ref={textGroupRef}
        >
          <Text
            fontSize={fontSize}
            color="white"
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0]}
            maxWidth={1.0}
            textAlign="center"
            lineHeight={1.2}
          >
            {answer}
          </Text>
        </group>
      )}

      {/* Постоянное свечение экрана */}
      <pointLight
        position={[0, 0, 0.3]}
        intensity={0.3}
        color="#3b82f6"
        distance={1.2}
        decay={2}
      />

      {/* Дополнительный свет для текста - только когда есть ответ */}
      {showText && (
        <pointLight
          position={[0, 0, 0.2]}
          intensity={0.25}
          color="#ffffff"
          distance={0.8}
          decay={2}
        />
      )}
    </group>
  );
}