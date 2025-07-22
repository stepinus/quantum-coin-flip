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

- [ ] 3. Create 3D answer display system
  - Implement AnswerDisplay component using Text3D from @react-three/drei
  - Position text correctly in ball's window area using 3D coordinates
  - Create blue background plane geometry for classic Magic 8 Ball appearance
  - Add proper text styling (white color, appropriate font size)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Implement dynamic lighting for answer visibility
  - Add multiple point lights for text illumination when answer is shown
  - Create spotlight system focused on answer area
  - Implement conditional lighting that activates only when answer is displayed
  - Ensure proper light intensity and color for text readability
  - _Requirements: 3.2, 5.2_

- [ ] 5. Set up quantum random number generation
  - Implement primary ANU Binary Stream API call with 8-second timeout
  - Add fallback to LfD QRNG via existing server proxy
  - Create error handling for API failures with Russian error messages
  - Implement answer selection logic using modulo operation on quantum number
  - _Requirements: 2.4, 4.1, 4.2, 4.3_

- [ ] 6. Create main page component with state management
  - Implement React state for isShaking, currentAnswer, error, and lastUsedApi
  - Create askQuestion function that orchestrates the complete shake-to-answer flow
  - Add proper state transitions (shake start → API call → answer display)
  - Implement button state management (disabled during shake)
  - _Requirements: 2.1, 2.2, 2.3, 6.2_

- [ ] 7. Set up React Three Fiber scene with proper camera controls
  - Configure Canvas component with appropriate camera position and FOV
  - Implement OrbitControls with angle restrictions for optimal viewing
  - Add Environment and basic scene lighting setup
  - Ensure controls are disabled during shake animation
  - _Requirements: 1.3, 5.3_

- [ ] 8. Implement UI components and styling
  - Create responsive layout with Tailwind CSS classes
  - Add navigation link back to home page
  - Implement loading states and error display components
  - Create instructions section with usage guide
  - _Requirements: 6.1, 6.3_

- [ ] 9. Add text wrapping and positioning logic for long answers
  - Implement automatic text wrapping for answers that exceed window width
  - Calculate optimal font size based on text length
  - Ensure text remains centered and readable in all cases
  - Test with longest Russian answers from the predefined list
  - _Requirements: 3.4_

- [ ] 10. Implement API source tracking and display
  - Add logic to track which quantum API was successfully used
  - Display API source information in footer area
  - Show appropriate Russian descriptions for each quantum source
  - Update display when different APIs are used
  - _Requirements: 6.4_

- [ ] 11. Add comprehensive error handling and user feedback
  - Implement try-catch blocks around all async operations
  - Create user-friendly Russian error messages for different failure types
  - Add retry functionality where appropriate
  - Ensure UI remains functional even when APIs fail
  - _Requirements: 4.3, 6.3_

- [ ] 12. Optimize performance and add cleanup
  - Implement proper Three.js object disposal in useEffect cleanup
  - Add React.memo optimization for expensive components
  - Ensure proper event listener cleanup
  - Test memory usage and optimize model loading
  - _Requirements: 5.3_