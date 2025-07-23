'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import Link from 'next/link';
import { MagicBallModel } from '@/components/MagicBallModel';

// Magic 8 Ball answers - разделены на квантовые и fallback
const QUANTUM_ANSWERS = [
  // Положительные (5)
  'Бесспорно',
  'Предрешено',
  'Никаких сомнений',
  'Определённо да',
  'Можешь быть уверен в этом',

  // Нерешительно положительные (5)
  'Мне кажется — «да»',
  'Вероятнее всего',
  'Хорошие перспективы',
  'Знаки говорят — «да»',
  'Да',

  // Отрицательные (5)
  'Даже не думай',
  'Мой ответ — «нет»',
  'По моим данным — «нет»',
  'Перспективы не очень хорошие',
  'Весьма сомнительно'
];

// Ответы для ситуации когда квантовые API недоступны
const FALLBACK_ANSWERS = [
  'Пока не ясно, попробуй снова',
  'Спроси позже', 
  'Лучше не рассказывать',
  'Сейчас нельзя предсказать',
  'Сконцентрируйся и спроси опять'
];



export default function MagicBallPage() {
  const [isShaking, setIsShaking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUsedApi, setLastUsedApi] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);



  const askQuestion = async () => {
    if (isShaking) return;

    setIsShaking(true);
    setError(null);
    setCurrentAnswer('');

    try {
      let randomNum: number;
      let apiUsed = '';
      let quantumApiWorking = false;

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
            quantumApiWorking = true;
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
              quantumApiWorking = true;
            } else {
              throw new Error('Invalid LfD response');
            }
          } else {
            throw new Error('LfD API failed');
          }
        } catch {
          // Квантовые API недоступны - используем fallback ответы
          quantumApiWorking = false;
          randomNum = Math.floor(Math.random() * FALLBACK_ANSWERS.length);
          apiUsed = 'Fallback (квантовые API недоступны)';
          setLastUsedApi('FALLBACK');
        }
      }

      // Select answer based on API availability
      let selectedAnswer: string;
      if (quantumApiWorking) {
        // Квантовые API работают - выбираем из основных ответов
        selectedAnswer = QUANTUM_ANSWERS[randomNum % QUANTUM_ANSWERS.length];
      } else {
        // Квантовые API недоступны - выбираем fallback ответы
        selectedAnswer = FALLBACK_ANSWERS[randomNum];
      }

      console.log(`Magic 8 Ball answer generated using: ${apiUsed}`);

      // Shake animation duration - плавный переход к ответу
      // Сначала устанавливаем ответ, но он не будет отображаться пока isShaking=true
      setCurrentAnswer(selectedAnswer);

      // Затем через 3 секунды останавливаем тряску
      setTimeout(() => {
        setIsShaking(false);
      }, 3000);

    } catch (err) {
      // В случае критической ошибки показываем один из fallback ответов
      const fallbackIndex = Math.floor(Math.random() * FALLBACK_ANSWERS.length);
      setCurrentAnswer(FALLBACK_ANSWERS[fallbackIndex]);
      setError('Квантовые источники временно недоступны');
      
      setTimeout(() => {
        setIsShaking(false);
      }, 3000);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-gray-200 via-gray-500 to-black relative overflow-hidden">
      {/* Градиентный фон от светлого к черному */}

      {/* Navigation and Info Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col">
        {/* Navigation */}
        <nav className="p-4 flex justify-between items-center">
          <Link
            href="/"
            className="inline-block px-3 py-2 bg-black/20 backdrop-blur-sm rounded-lg text-white/60 hover:text-white/90 hover:bg-black/30 transition-all text-xs"
          >
            ← Назад
          </Link>

          {/* Quantum Info */}
          <div className="text-right">
            <p className="text-black/70 text-xs font-medium">
              Квантовый генератор случайных чисел
            </p>
            {lastUsedApi && (
              <p className="text-black/60 text-[10px]">
                {lastUsedApi === 'ANU_BINARY'
                  ? 'Последняя генерация: Квантовый поток АНУ'
                  : 'Последняя генерация: Квантовый генератор LfD'
                }
              </p>
            )}
          </div>
        </nav>
      </div>

      {/* Full-Screen 3D Scene - 100% of viewport */}
      <div className="absolute inset-0">
        {/* Индикатор загрузки - нейтральные тона */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-500/50 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-white border-r-transparent border-b-white border-l-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-lg font-medium">Загрузка магического шара...</p>
            </div>
          </div>
        )}
        <Canvas 
          camera={{ position: [0, 0, 7.75], fov: 50 }} 
          onCreated={() => setTimeout(() => setIsLoading(false), 1000)}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputColorSpace: THREE.SRGBColorSpace
          }}
          dpr={[1, 2]}
          shadows
        >
          {/* Нейтральное окружение с улучшенными отражениями */}
          <Environment 
            preset="city" 
            background={false}
            environmentIntensity={1.2}
          />

          {/* Серый туман */}
          <fog attach="fog" args={['#333333', 10, 40]} />

          {/* Нейтральный ambient light */}
          <ambientLight intensity={0.3} color="#cccccc" />

          {/* Hemispheric light - нейтральный неточечный свет сверху и снизу */}
          <hemisphereLight
            color="#ffffff"
            groundColor="#333333"
            intensity={0.5}
          />

          {/* Нейтральные точечные источники света */}
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#cccccc" />
          <pointLight position={[-5, -5, 5]} intensity={0.4} color="#999999" />

          {/* Нейтральный directional light для общего освещения сцены */}
          <directionalLight
            position={[3, 5, 10]}
            intensity={0.7}
            color="#ffffff"
            target-position={[0, -1, 0]}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />

          {/* Нейтральное освещение в зависимости от состояния */}
          {isShaking ? (
            // Яркий свет во время встряхивания
            <>
              <pointLight
                position={[3, 3, 3]}
                intensity={0.7}
                color="#ffffff"
                distance={10}
                decay={2}
              />
              <pointLight
                position={[-3, -3, 3]}
                intensity={0.7}
                color="#eeeeee"
                distance={10}
                decay={2}
              />
            </>
          ) : currentAnswer ? (
            // Яркий прожектор когда ответ виден
            <spotLight
              position={[0, 5, 3]}
              angle={0.3}
              penumbra={0.9}
              intensity={1.0}
              color="#ffffff"
              castShadow
              target-position={[0, 0, 0]}
              distance={15}
              decay={2}
            />
          ) : (
            // Нейтральный свет в состоянии покоя
            <pointLight
              position={[0, 3, 5]}
              intensity={0.6}
              color="#cccccc"
              distance={12}
              decay={2}
            />
          )}

          <MagicBallModel
            key="magic-ball-model"
            isShaking={isShaking}
            currentAnswer={currentAnswer}
          />

          <OrbitControls
            enabled={!isShaking}
            enableZoom={true}
            enablePan={false}
            target={[0, 0, 0]}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
          />

          {/* Enhanced post-processing for better quality */}
          <EffectComposer multisampling={4}>
            {/* Enhanced anti-aliasing for smooth edges */}
            <SMAA />

            {/* Subtle bloom for magical glow */}
            <Bloom
              intensity={0.15}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.95}
              blendFunction={BlendFunction.ADD}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Ultra Minimal UI Overlay - Bottom fixed position */}
      <div className="absolute bottom-0 left-0 right-0 h-20 flex flex-col items-center justify-center px-4 bg-transparent">
        {/* Error Display - centered above button */}
        {error && (
          <div className="mb-3 p-2 bg-red-900/20 backdrop-blur-sm border border-red-500/20 rounded-lg max-w-md w-full">
            <p className="text-red-300 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Ask Button - centered and larger */}
        <button
          onClick={askQuestion}
          disabled={isShaking}
          className={`px-8 py-3 rounded-lg font-medium text-sm transition-all duration-300 max-w-xs w-full ${isShaking
            ? 'bg-gray-700/50 text-gray-300 cursor-not-allowed backdrop-blur-sm'
            : 'bg-gradient-to-r from-gray-700/70 to-gray-900/70 hover:from-gray-600/80 hover:to-gray-800/80 text-white hover:text-white shadow-lg hover:shadow-white/10 backdrop-blur-sm'
            }`}
        >
          {isShaking ? 'Встряхиваю...' : 'Встряхнуть Шар'}
        </button>
      </div>
    </div>
  );
}