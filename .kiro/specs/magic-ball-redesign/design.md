# Design Document

## Overview

Полная переработка страницы Magic Ball с использованием React Three Fiber для создания функционального магического шара 8-ball. Дизайн фокусируется на правильном отображении 3D модели, реалистичных материалах, корректном позиционировании текста ответов и плавных анимациях.

## Architecture

### Component Structure
```
MagicBallPage (Main Component - Minimalist Design)
├── Navigation (Minimal, semi-transparent)
├── Full-Screen Canvas (React Three Fiber scene - 90% of viewport)
│   ├── MagicBallModel (3D model component)
│   ├── AnswerDisplay (3D text in ball window)
│   ├── MysticalLighting (Dramatic lighting setup)
│   ├── MysticalBackground (Fog, particles, cosmic elements)
│   └── Camera Controls (OrbitControls)
├── Minimal UI Overlay (Bottom 10% of screen)
│   ├── ActionButton (Shake button - mystical styling)
│   └── ErrorDisplay (Minimal error messages)
```

### State Management
- `isShaking: boolean` - Controls shake animation state
- `currentAnswer: string` - Current magic ball answer
- `error: string | null` - Error state for API failures
- `lastUsedApi: string` - Track which quantum API was used

## Components and Interfaces

### MagicBallModel Component
```typescript
interface MagicBallModelProps {
  isShaking: boolean;
  currentAnswer: string;
}
```

**Responsibilities:**
- Load and display the GLB model using useGLTF
- Apply correct materials (black glossy shell, transparent window)
- Handle shake animation using useFrame
- Position and display answer text in 3D space
- Manage internal lighting for text visibility

**Material Configuration:**
- Shell Material: Black, glossy finish (roughness: 0.3, metalness: 0.1)
- Window Material: Transparent (opacity: 0.9), smooth surface
- Answer Background: Blue plane geometry for classic Magic 8 Ball look
- Answer Text: White text with proper font size and positioning

### AnswerDisplay Component
```typescript
interface AnswerDisplayProps {
  answer: string;
  visible: boolean;
}
```

**Responsibilities:**
- Render 3D text using Text3D from @react-three/drei
- Position text correctly within the ball's window
- Handle text wrapping for longer answers
- Apply proper styling (white text on blue background)

### Lighting System
**Mystical Scene Lighting:**
- Ambient Light: Very low intensity (0.1) for mysterious atmosphere
- Directional Light: Dramatic main lighting with strong shadows
- Point Lights: Multiple colored lights (purple, blue) for mystical ambiance
- Spot Light: Focused dramatic lighting when answer is displayed
- Rim Lighting: Edge lighting to create mystical glow around the ball
- Atmospheric Lighting: Fog/mist illumination for depth

### Background and Environment
**Mystical Environment:**
- Dark gradient background (black to deep purple/blue)
- Particle system for floating mystical elements
- Fog/mist effects around the magic ball
- Optional: Subtle star field or cosmic background
- Minimal UI elements to maximize 3D scene visibility

### Animation System
**Shake Animation:**
- Duration: 3 seconds
- Rotation on all axes with different frequencies
- Smooth easing using sine functions
- Disable camera controls during animation

## Data Models

### Magic Answers Array
```typescript
const MAGIC_ANSWERS: string[] = [
  // 20 predefined Russian answers
  // 10 positive, 10 negative responses
];
```

### Quantum API Response
```typescript
interface QuantumResponse {
  success: boolean;
  data: number[];
  error?: string;
}
```

## Error Handling

### API Failure Cascade
1. **Primary:** ANU Binary Stream (direct client call)
2. **Fallback:** LfD QRNG via server proxy
3. **Error State:** Display user-friendly error message

### Error Types
- Network timeout (8 second limit)
- Invalid API response format
- All quantum sources unavailable
- Model loading failures

### Error Display
- Russian language error messages
- Retry suggestions where appropriate
- Graceful degradation without breaking UI

## Testing Strategy

### Unit Tests
- Answer selection logic with mock quantum numbers
- Material application correctness
- Text positioning calculations
- Animation state transitions

### Integration Tests
- Complete shake-to-answer flow
- API fallback behavior
- Model loading and rendering
- Error state handling

### Visual Tests
- 3D model appearance verification
- Text readability in various lighting
- Animation smoothness
- Responsive design on different screen sizes

## Technical Implementation Details

### Model Loading Strategy
```typescript
// Use useGLTF with proper error handling
const { scene, materials } = useGLTF('/ball.glb');

// Clone scene to avoid material conflicts
const clonedScene = scene.clone();

// Apply materials programmatically
const shellMaterial = materials['shell'] as THREE.MeshStandardMaterial;
const windowMaterial = materials['window'] as THREE.MeshStandardMaterial;
```

### Text Positioning Algorithm
```typescript
// Position text in ball's window area
const textPosition = new THREE.Vector3(0, -0.5, 1.2);
const textRotation = new THREE.Euler(0, 0, 0);

// Scale text to fit window
const maxWidth = 1.2;
const fontSize = 0.12;
```

### Animation Implementation
```typescript
// Shake animation using useFrame
useFrame((state) => {
  if (isShaking && groupRef.current) {
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.x = Math.sin(time * 20) * 0.3;
    groupRef.current.rotation.y = Math.sin(time * 15) * 0.3;
    groupRef.current.rotation.z = Math.sin(time * 25) * 0.2;
  }
});
```

### Quantum Random Integration
```typescript
// Primary API call with timeout
const binaryResponse = await fetch(
  'https://qrng.anu.edu.au/wp-content/plugins/colours-plugin/get_one_binary.php',
  { signal: AbortSignal.timeout(8000) }
);

// Fallback to server proxy
const lfdResponse = await fetch('/api/quantum-random?source=lfd');

// Answer selection
const selectedAnswer = MAGIC_ANSWERS[randomNum % MAGIC_ANSWERS.length];
```

## Performance Considerations

### Model Optimization
- Use model cloning to prevent material conflicts
- Implement proper disposal of Three.js objects
- Optimize lighting setup for performance

### Memory Management
- Clean up event listeners on unmount
- Dispose of Three.js materials and geometries
- Use React.memo for expensive components where appropriate

### Loading States
- Show loading indicator during model load
- Progressive enhancement for 3D features
- Fallback UI for WebGL unsupported browsers

## Accessibility

### Keyboard Navigation
- Ensure button is keyboard accessible
- Provide focus indicators
- Support Enter key for shake action

### Screen Reader Support
- Proper ARIA labels for 3D content
- Text alternatives for visual elements
- Status announcements for answer changes

### Visual Accessibility
- High contrast text (white on blue)
- Sufficient font sizes
- Clear visual hierarchy