'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

interface BabylonEngine {
  dispose(): void;
  resize(): void;
  runRenderLoop(callback: () => void): void;
}

interface BabylonScene {
  dispose(): void;
  render(): void;
  materials: unknown[];
}

export default function BabylonBallPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BabylonScene | null>(null);
  const engineRef = useRef<BabylonEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Navigation */}
      <nav className="p-4">
        <div className="flex gap-4">
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            ← Главная
          </Link>
          <Link 
            href="/magic-ball" 
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Three.js версия
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Magic 8 Ball - Babylon.js
          </h1>
          <p className="text-white/80 text-lg mb-8">
            3D модель Magic 8 Ball, отображаемая с помощью Babylon.js
          </p>

          {/* 3D Scene */}
          <div className="h-96 mb-8 rounded-xl overflow-hidden bg-gradient-to-b from-gray-900/50 to-gray-800/50 relative">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
              style={{ outline: 'none' }}
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/75">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white">Загрузка Babylon.js и 3D модели...</p>
                </div>
              </div>
            )}
            
            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/75">
                <div className="text-center">
                  <p className="text-red-200 mb-2">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Перезагрузить
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl">
            <h3 className="text-white font-semibold mb-2">Управление:</h3>
            <p className="text-white/70 text-sm">
              • Используйте мышь для поворота камеры<br/>
              • Колесико мыши для приближения/отдаления<br/>
              • Модель загружается с помощью Babylon.js
            </p>
          </div>

          {/* Technical Info */}
          <div className="mt-4 p-4 bg-white/5 rounded-xl">
            <h3 className="text-white font-semibold mb-2">Технические детали:</h3>
            <p className="text-white/70 text-sm">
              • Engine: Babylon.js<br/>
              • Model: Magic 8 Ball.glb<br/>
              • Format: glTF 2.0<br/>
              • Loader: @babylonjs/loaders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}