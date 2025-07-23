# Implementation Plan

- [x] 1. Create new clean MagicBallModel component with proper GLB loading
  - Implement useGLTF hook for loading /ball.glb model
  - Create proper material setup for black glossy shell and transparent window
  - Add basic model positioning and scaling
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement shake animation system
  - Create shake animation using useFrame hook with sine wave rotations
  - Add animation state management (start/stop shake)
  - Implement 3-second animation duration with automatic stop
  - Disable camera controls during shake animation
  - _Requirements: 2.1, 2.2, 5.1_

- [x] 3. Create 3D answer display system
  - Implement AnswerDisplay component using Text3D from @react-three/drei
  - Position text correctly in ball's window area using 3D coordinates
  - Create blue background plane geometry for classic Magic 8 Ball appearance
  - Add proper text styling (white color, appropriate font size)
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Show blue background window always (even without answer)
  - Modify AnswerDisplay component to show blue circular background at all times
  - Keep background visible when no answer is present
  - Ensure background appears immediately when page loads
  - Only hide/show the text content based on answer state
  - _Requirements: 3.1, 3.2_

- [x] 5. Implement answer text appearance animation
  - Create spiral animation effect for text appearing from center of blue background
  - Add smooth transition animation when answer becomes visible
  - Implement text scaling/rotation effect during appearance
  - Ensure animation completes before text becomes fully readable
  - _Requirements: 3.3, 5.1_

- [x] 6. Enhance shake animation system
  - Improve current shake animation with more realistic ball physics
  - Add subtle ball bouncing/settling animation after shake stops
  - Ensure shake animation feels natural and responsive
  - Fine-tune animation timing and intensity
  - _Requirements: 2.1, 2.2, 5.1_

- [x] 7. Integrate quantum random number generation
  - Connect existing quantum API logic to the 3D Magic Ball
  - Ensure proper error handling for API failures
  - Implement answer selection using quantum randomness
  - Add API source tracking and display
  - _Requirements: 2.4, 4.1, 4.2, 4.3, 6.4_

- [x] 8. Optimize lighting and visual effects
  - Fine-tune point lights for optimal text visibility
  - Add subtle glow effects around answer text
  - Ensure proper lighting during different animation states
  - Optimize light intensity and positioning
  - _Requirements: 3.2, 5.2_

- [x] 9. Enhance 3D scene environment and atmosphere
  - Add dramatic shadows and depth to the scene
  - Implement advanced lighting setup with multiple light sources
  - Create atmospheric effects and ambient lighting
  - Add flowing fog/mist effects around the magic ball
  - Enhance scene composition and visual depth
  - _Requirements: 5.2, 5.3_

- [x] 10. Implement mystical minimalist UI redesign
  - Remove white background container and borders for full-screen 3D experience
  - Redesign page layout to make Canvas occupy 90% of viewport height
  - Create minimal overlay UI at bottom with dark mystical styling
  - Update color scheme to dark mystical colors (black, deep purple, dark blue)
  - Remove unnecessary UI elements and instructions to create minimalist design
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 11. Add mystical background and atmospheric effects to 3D scene
  - Implement dark gradient or cosmic background using Environment or custom skybox
  - Add fog/mist effects around the magic ball using Fog component
  - Create floating particle system for mystical atmosphere
  - Add subtle cosmic elements (stars, nebula effects) if appropriate
  - Ensure background enhances mystical mood without distracting from ball
  - _Requirements: 7.1, 7.3_

- [x] 12. Enhance lighting system for dramatic mystical atmosphere
  - Reduce ambient light intensity to create more dramatic shadows
  - Add colored point lights (purple, blue) for mystical ambiance
  - Implement rim lighting around the magic ball for mystical glow
  - Add dynamic lighting effects that respond to shake animation
  - Create dramatic spotlight effects when answer appears
  - _Requirements: 7.2, 7.4, 7.5_

- [ ] 13. Add comprehensive error handling and user feedback
  - Implement proper error states for quantum API failures
  - Create user-friendly Russian error messages with mystical styling
  - Add loading indicators during API calls with dark theme
  - Ensure UI remains functional when APIs fail
  - _Requirements: 4.3, 6.4_

- [ ] 14. Final polish and performance optimization
  - Implement proper Three.js object disposal and cleanup
  - Add React.memo optimization where needed
  - Test memory usage and optimize model loading
  - Fine-tune all animations and transitions
  - Ensure mystical effects don't impact performance
  - _Requirements: 5.3_