'use client';

import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface AnswerDisplayProps {
  answer: string;
  visible: boolean;
}

export function AnswerDisplay({ answer, visible }: AnswerDisplayProps) {
  // Always show the blue background, but only show text when visible and answer exists
  const showText = visible && !!answer;
  
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

      {/* Render text only when showText is true */}
      {showText && lines.map((line, index) => (
        <Text
          key={index}
          fontSize={fontSize}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[
            0, // Center horizontally
            0.08 + (lines.length - 1) * fontSize * 0.6 - index * fontSize * 1.2, // Stack vertically with slight upward offset
            -0.02 // Closer to background
          ]}
          maxWidth={0.8}
          textAlign="center"
        >
          {line}
        </Text>
      ))}

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