'use client';

import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Text as Text3D } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';

// Magic 8 Ball answers
const MAGIC_ANSWERS = [
  // Positive answers
  'Да, определенно',
  'Без сомнения',
  'Да',
  'Скорее всего',
  'Вполне возможно',
  'Знаки говорят да',
  'Да, попробуй еще раз',
  'Мой ответ да',
  'Можешь рассчитывать на это',
  'Да, через некоторое время',
  
  // Negative answers
  'Мне кажется нет',
  'Очень сомнительно',
  'Не рассчитывай на это',
  'Лучше не говорить сейчас',
  'Не могу предсказать',
  'Сконцентрируйся и спроси снова',
  'Мой источник говорит нет',
  'Перспективы не очень хорошие',
  'Нет',
  'Определенно нет'
];

function MagicBall({ isShaking, currentAnswer }: { isShaking: boolean; currentAnswer: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene, nodes, materials } = useGLTF('/ball.glb');

  // This is a more stable way to modify materials.
  // We target materials by their specific names from the GLB file.
  const shellMaterial = materials['ball_1'] as THREE.MeshStandardMaterial;
  const windowMaterial = materials['window_1'] as THREE.MeshStandardMaterial;

  if (shellMaterial) {
    shellMaterial.transparent = false;
    shellMaterial.opacity = 1.0;
    shellMaterial.color.set('black');
    shellMaterial.roughness = 0.5; // Glossy finish
    shellMaterial.metalness = 0.2;
    shellMaterial.depthWrite = true;
    shellMaterial.depthTest = true;
    shellMaterial.side = THREE.DoubleSide; // Only render front faces
  }

  if (windowMaterial) {
    windowMaterial.transparent = true;
    windowMaterial.opacity = 0.9;
    windowMaterial.roughness = 0.5; // Smooth glass-like surface
    windowMaterial.depthWrite = false; // Allow objects behind to be visible
    windowMaterial.depthTest = true;
    windowMaterial.side = THREE.FrontSide;
  }

  // Shake animation using useFrame
  useFrame((state) => {
    if (isShaking && groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.x = Math.sin(time * 20) * 0.3;
      groupRef.current.rotation.y = Math.sin(time * 15) * 0.3;
      groupRef.current.rotation.z = Math.sin(time * 25) * 0.2;
    }
  });
  
  // Hide d20 initially or show specific face
  const clonedScene = scene.clone();
  clonedScene.traverse((node) => {
    if (node.name === 'd20_1') {
      node.visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedScene} 
        scale={10}
        rotation={[Math.PI / 2, 0, 0]} // Straight 90 degrees rotation (45 degrees tilt)
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
      {/* Classic Magic 8 Ball answer triangle positioned in window */}
      {currentAnswer && !isShaking && (
        <group>
          {/* 
            This group is for the answer text and its background.
            It's positioned inside the ball model.
          */}
          <group 
            position={[0, 0, 1.2]} // Positioned to appear in the window
            rotation={[0, 0, 0]} // Tilted slightly to match window angle
            visible={true}
          >
            {/* The blue background for the text */}
            <mesh>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial
                color="blue" // Simple blue color
                transparent={false}
                opacity={1.0}
                side={THREE.DoubleSide}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            
            {/* The answer text */}
            <Text3D
              position={[0, 0, 0.01]} // Slightly in front of the blue plane
              fontSize={0.15}
              color="white"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.4}
              textAlign="center"
              fontWeight="bold"
            >
              {currentAnswer}
            </Text3D>
          </group>
        </group>
      )}
      {/* Additional lights for better visibility */}
      {currentAnswer && !isShaking && (
        <>
          {/* Spotlight from outside */}
          <spotLight
            position={[0, 0, 10]}
            target-position={[0, 0, 0]}
            angle={Math.PI / 6}
            penumbra={0.3}
            intensity={8}
            color={0xffffff}
            distance={20}
          />
          
          {/* Point light inside the ball behind the text */}
          <pointLight
            position={[0, 0, 0.5]}
            intensity={4}
            color={0xffffff}
            distance={5}
          />
          
          {/* Additional point light in front of text */}
          <pointLight
            position={[0, 0, 3]}
            intensity={3}
            color={0xffffff}
            distance={3}
          />
          
          {/* Light specifically for the text background */}
          <pointLight
            position={[0, 0, 1.3]}
            intensity={5}
            color={0xffffff}
            distance={2}
          />
        </>
      )}
    </group>
  );
}

export default function MagicBallPage() {
  const [isShaking, setIsShaking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUsedApi, setLastUsedApi] = useState<string>('');

  const askQuestion = async () => {
    if (isShaking) return;

    setIsShaking(true);
    setError(null);
    setCurrentAnswer('');

    try {
      let randomNum: number;
      let apiUsed = '';

      // Use the same quantum random sources as coin flip
      try {
        // Primary: ANU Binary Stream
        const binaryResponse = await fetch('https://qrng.anu.edu.au/wp-content/plugins/colours-plugin/get_one_binary.php', {
          signal: AbortSignal.timeout(8000)
        });
        
        if (binaryResponse.ok) {
          const binaryData = await binaryResponse.text();
          if (binaryData && binaryData.length === 8 && /^[01]+$/.test(binaryData)) {
            randomNum = parseInt(binaryData, 2);
            apiUsed = 'ANU Binary Stream';
            setLastUsedApi('ANU_BINARY');
          } else {
            throw new Error('Invalid binary response');
          }
        } else {
          throw new Error('ANU Binary API failed');
        }
      } catch (binaryError) {
        // Fallback: LfD QRNG via server
        try {
          const lfdResponse = await fetch('/api/quantum-random?source=lfd', {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000)
          });
          
          if (lfdResponse.ok) {
            const lfdData = await lfdResponse.json();
            if (lfdData.success && lfdData.data && lfdData.data.length > 0) {
              randomNum = lfdData.data[0];
              apiUsed = 'LfD QRNG (fallback)';
              setLastUsedApi('LfD');
            } else {
              throw new Error('Invalid LfD response');
            }
          } else {
            throw new Error('LfD API failed');
          }
        } catch {
          throw new Error('Все квантовые API недоступны');
        }
      }

      // Select answer based on quantum random number
      const selectedAnswer = MAGIC_ANSWERS[randomNum % MAGIC_ANSWERS.length];
      
      console.log(`Magic 8 Ball answer generated using: ${apiUsed}`);
      
      // Shake animation duration
      setTimeout(() => {
        setCurrentAnswer(selectedAnswer);
        setIsShaking(false);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
      setIsShaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Navigation */}
      <nav className="p-4">
        <Link 
          href="/" 
          className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          ← Назад к монетке
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Квантовый Магический Шар
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Задайте вопрос и встряхните шар для получения квантового ответа
          </p>

          {/* 3D Scene */}
          <div className="h-96 mb-8 rounded-xl overflow-hidden bg-gradient-to-b from-gray-900/50 to-gray-800/50">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <Environment preset="studio" />
              <ambientLight intensity={0.2} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <pointLight position={[-5, -5, 5]} intensity={0.3} />
              {/* Directional light focused on the d20 window area */}
              <directionalLight 
                position={[0, 0, 10]} 
                intensity={1.5} 
                target-position={[0, -1, 0]}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
              />
              
              <MagicBall isShaking={isShaking} currentAnswer={currentAnswer} />
              
              <OrbitControls 
                enabled={!isShaking}
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI - Math.PI / 3}
                minAzimuthAngle={-Math.PI / 4}
                maxAzimuthAngle={Math.PI / 4}
                target={[0, 0, 0]}
              />
            </Canvas>
          </div>

          {/* Answer Display */}
          {currentAnswer && !isShaking && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Ответ шара:
              </h2>
              <p className="text-xl text-blue-200 bg-white/10 rounded-lg p-4">
                &quot;{currentAnswer}&quot;
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Ask Button */}
          <button
            onClick={askQuestion}
            disabled={isShaking}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isShaking
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isShaking ? 'Встряхиваю шар...' : 'Встряхнуть Магический Шар'}
          </button>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl">
            <h3 className="text-white font-semibold mb-2">Как пользоваться:</h3>
            <p className="text-white/70 text-sm">
              1. Сосредоточьтесь на своем вопросе<br/>
              2. Нажмите кнопку &quot;Встряхнуть&quot;<br/>
              3. Дождитесь квантового ответа
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/10">
            {lastUsedApi && (
              <p className="text-white/60 text-xs">
                {lastUsedApi === 'ANU_BINARY' 
                  ? 'Использован квантовый поток АНУ (бинарные данные)'
                  : lastUsedApi === 'LfD'
                  ? 'Использован квантовый генератор LfD Quantum Lab (ID Quantique QRNG)'
                  : 'Использован внешний квантовый генератор случайных чисел'
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}