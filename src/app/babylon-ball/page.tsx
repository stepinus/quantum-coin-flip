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

  useEffect(() => {
    const initBabylon = async () => {
      if (!canvasRef.current) return;

      try {
        // Dynamically import Babylon.js modules
        const [
          { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, DirectionalLight, StandardMaterial, Color3, ImportMeshAsync }
        ] = await Promise.all([
          import('@babylonjs/core'),
          import('@babylonjs/loaders/glTF')
        ]);

        const engine = new Engine(canvasRef.current, true);
        engineRef.current = engine;

        const scene = new Scene(engine);
        sceneRef.current = scene;

        // Camera setup
        const camera = new ArcRotateCamera(
          "camera",
          -Math.PI / 2,
          Math.PI / 2.5,
          10, // Move camera further back
          Vector3.Zero(),
          scene
        );
        camera.setTarget(Vector3.Zero());
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 20;
        
        // Enable camera controls
        camera.attachControl(canvasRef.current, true);

        // Lighting setup
        const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.3;

        const directionalLight = new DirectionalLight("directionalLight", new Vector3(-1, -1, -1), scene);
        directionalLight.intensity = 1;

        // Add a test sphere to make sure the scene is working
        const { MeshBuilder } = await import('@babylonjs/core');
        const testSphere = MeshBuilder.CreateSphere("testSphere", { diameter: 2 }, scene);
        testSphere.position = new Vector3(-3, 0, 0);
        const testMaterial = new StandardMaterial("testMaterial", scene);
        testMaterial.diffuseColor = Color3.Red();
        testSphere.material = testMaterial;
        console.log("Added test red sphere at (-3, 0, 0)");

        // Load the Magic 8 Ball model using the modern async API
        try {
          const result = await ImportMeshAsync("", "/", "Magic 8 Ball.glb", scene);
          console.log("Model loaded successfully:", result);
          console.log("Meshes count:", result.meshes.length);
          console.log("All meshes:", result.meshes.map(m => ({ name: m.name, visible: m.isVisible })));
          
          setIsLoading(false);
          
          // Scale and position the model
          if (result.meshes.length > 0) {
            result.meshes.forEach((mesh) => {
              // Make sure mesh is visible and enabled
              mesh.isVisible = true;
              mesh.setEnabled(true);
              
              mesh.scaling = new Vector3(1, 1, 1); // Try normal size first
              mesh.position = new Vector3(0, 0, 0);
              
              // Debug mesh info
              console.log(`Found mesh: "${mesh.name}", visible: ${mesh.isVisible}, enabled: ${mesh.isEnabled()}`);
            });

            // Process each mesh individually
            result.meshes.forEach((mesh) => {
              if (mesh.name === 'Object_4') {
                // This is the ball body - make it black but semi-transparent so we can see d20 inside
                console.log('🎱 Setting up ball body (Object_4)');
                const ballMaterial = new StandardMaterial("ballMaterial", scene);
                ballMaterial.diffuseColor = Color3.Black();
                ballMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
                ballMaterial.roughness = 0.2;
                ballMaterial.alpha = 0.8; // Semi-transparent to see d20 inside
                ballMaterial.transparencyMode = 2; // Enable alpha blending
                mesh.material = ballMaterial;
              } else if (mesh.name === 'Object_6') {
                // This is the d20 - make it bright and glowing
                console.log('🎲 Setting up d20 (Object_6)');
                const d20Material = new StandardMaterial("d20Material", scene);
                d20Material.diffuseColor = new Color3(0.8, 0.9, 1.0); // Light blue
                d20Material.emissiveColor = new Color3(0.5, 0.7, 1.0); // Brighter blue glow
                d20Material.alpha = 1.0;
                mesh.material = d20Material;
              }
            });
            
            // Add extra lighting inside the ball to illuminate the d20
            const { PointLight } = await import('@babylonjs/core');
            const innerLight = new PointLight("innerLight", new Vector3(0, -0.2, 0.3), scene);
            innerLight.intensity = 2.0;
            innerLight.diffuse = new Color3(0.8, 0.9, 1.0); // Blue-white light
            console.log('💡 Added inner light for d20 visibility');
          }
        } catch (loadError) {
          console.error("Error loading model:", loadError);
          setError("Ошибка загрузки 3D модели");
          setIsLoading(false);
        }

        // Render loop
        engine.runRenderLoop(() => {
          scene.render();
        });

        // Handle window resize
        const handleResize = () => {
          engine.resize();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          scene.dispose();
          engine.dispose();
        };
      } catch (err) {
        console.error('Error initializing Babylon.js:', err);
        setError('Ошибка инициализации 3D движка');
        setIsLoading(false);
      }
    };

    initBabylon();

    // Cleanup on component unmount
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

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