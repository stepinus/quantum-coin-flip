'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface AnswerDisplayProps {
  answer: string;
  visible: boolean;
}

export function AnswerDisplay({ answer, visible }: AnswerDisplayProps) {
  // Always show the blue background, but only show text when visible and answer exists
  const showText = visible && !!answer;
  
  // Animation state
  const [animationStartTime, setAnimationStartTime] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const textGroupRef = useRef<THREE.Group>(null);
  
  // Start animation when text becomes visible
  useEffect(() => {
    if (showText && !isAnimating) {
      setAnimationStartTime(Date.now());
      setIsAnimating(true);
    } else if (!showText) {
      setIsAnimating(false);
      setAnimationStartTime(0);
    }
  }, [showText]); // Remove isAnimating from dependencies to prevent loop
  
  // Calculate text wrapping for long answers (only when we have an answer)
  let lines: string[] = [];
  let fontSize = 0.15;
  
  if (answer) {
    const maxLineLength = 15; // Approximate characters per line that fit in window
    const words = answer.split(' ');
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLineLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate font size based on text length and number of lines
    const baseFontSize = 0.15;
    const lengthFactor = Math.min(1, 25 / answer.length);
    const lineFactor = Math.min(1, 3 / lines.length);
    fontSize = baseFontSize * lengthFactor * lineFactor;
  }

  // Simple and natural text appearance animation
  useFrame((state) => {
    if (isAnimating && textGroupRef.current && animationStartTime > 0) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - animationStartTime) / 1000; // Convert to seconds
      const animationDuration = 2.5; // 2.5 seconds for full animation
      
      if (elapsedTime < animationDuration) {
        // Calculate animation progress (0 to 1)
        const progress = Math.min(elapsedTime / animationDuration, 1);
        
        // Smooth easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // Apply simple animation to each text element
        textGroupRef.current.children.forEach((child, index) => {
          if (child instanceof THREE.Group || child instanceof THREE.Mesh) {
            // Store original position for reference
            if (!child.userData.originalY) {
              child.userData.originalY = child.position.y;
            }
            
            // Keep text in center - no movement
            child.position.x = 0;
            child.position.y = child.userData.originalY;
            
            // Scale effect - text starts as tiny point and grows to normal size
            const scaleProgress = easeOut;
            const baseScale = 0.05 + scaleProgress * 0.95; // Start from 0.05, grow to 1.0
            child.scale.setScalar(baseScale);
            
            // Simple rotation effect around Z axis
            const rotationIntensity = (1 - easeOut) * Math.PI * 2; // 2 full rotations, reduces to 0
            const staggeredRotation = index * 0.2; // Slight stagger between lines
            child.rotation.z = rotationIntensity + staggeredRotation;
            
            // Fade-in effect with blur simulation
            const opacityProgress = Math.pow(easeOut, 0.5); // Smooth fade in
            
            // Apply opacity to materials
            child.traverse((grandChild) => {
              if (grandChild instanceof THREE.Mesh && grandChild.material) {
                const material = grandChild.material as THREE.Material;
                if ('opacity' in material) {
                  material.transparent = true;
                  (material as any).opacity = opacityProgress;
                }
              }
            });
          }
        });
      } else {
        // Animation complete - reset to final state
        textGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Group || child instanceof THREE.Mesh) {
            child.position.x = 0;
            child.position.y = child.userData.originalY || child.position.y;
            child.scale.setScalar(1);
            child.rotation.z = 0;
            
            child.traverse((grandChild) => {
              if (grandChild instanceof THREE.Mesh && grandChild.material) {
                const material = grandChild.material as THREE.Material;
                if ('opacity' in material) {
                  (material as any).opacity = 1;
                }
              }
            });
          }
        });
        
        setIsAnimating(false);
      }
    }
  });

  return (
    <group position={[0, -0.15, 1.45]} rotation={[0, 0, 0]}>
      {/* Blue circular background for classic Magic 8 Ball appearance - ALWAYS VISIBLE */}
      <mesh position={[0, 0.1, -0.05]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial 
          color="#1e40af" 
          transparent={true} 
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Render text only when showText is true - each line in separate group for individual animation */}
      {showText && (
        <group ref={textGroupRef} position={[0, 0.08, -0.02]}>
          {lines.map((line, index) => (
            <group 
              key={index}
              position={[
                0, // Center horizontally
                (lines.length - 1) * fontSize * 0.6 - index * fontSize * 1.2, // Stack vertically
                0 // Relative to parent group position
              ]}
            >
              <Text
                fontSize={fontSize}
                color="white"
                anchorX="center"
                anchorY="middle"
                position={[0, 0, 0]}
                maxWidth={0.8}
                textAlign="center"
              >
                {line}
              </Text>
            </group>
          ))}
        </group>
      )}

      {/* Additional point lights for text illumination - always present for consistent lighting */}
      <pointLight 
        position={[0, 0, 0.5]} 
        intensity={2} 
        color="white"
        distance={3}
        decay={2}
      />
      <pointLight 
        position={[0.5, 0.5, 0.3]} 
        intensity={1.5} 
        color="white"
        distance={2}
        decay={2}
      />
      <pointLight 
        position={[-0.5, -0.5, 0.3]} 
        intensity={1.5} 
        color="white"
        distance={2}
        decay={2}
      />
    </group>
  );
}