# Towers of Hanoi - Three.js

An interactive 3D Towers of Hanoi puzzle game built with Three.js. Features realistic physics-based drag-and-drop gameplay with gravity simulation and collision detection.

## Live Demo

Once deployed to GitHub Pages, your game will be available at:
`https://yourusername.github.io/hanoi/`

## Features

- **3D Graphics**: Beautiful Three.js rendering with lighting and shadows
- **Physics-Based Gameplay**: Realistic gravity simulation and physics interactions
- **Collision Detection**: Disks interact with poles, other disks, and table boundaries
- **Realistic Disk Design**: Disks have holes that poles pass through
- **Camera Controls**: Orbit controls to rotate and zoom the camera view
- **Drag and Drop**: Intuitive drag-and-drop controls with free 3D movement
- **Stack Lifting**: Lifting a lower disk automatically lifts all disks on top
- **Configurable Difficulty**: Choose from 3 to 7 disks
- **Dismissable UI**: Hide the control panel for an unobstructed view
- **Responsive Design**: Works on desktop and mobile devices

## How to Play

1. **Objective**: Move all disks from the leftmost tower to the rightmost tower
2. **Rules**:
   - You can grab any disk, and all disks on top will move with it
   - A larger disk cannot rest on a smaller disk
   - Disks obey gravity and physics - they will fall when released
3. **Controls**:
   - **Click and drag** disks to move them in 3D space
   - **Disks are locked to the pole plane** to prevent them from going behind towers
   - **Orbit controls**: Click and drag on empty space to rotate the camera
   - **Zoom**: Scroll to zoom in/out
   - **Select difficulty** from the dropdown menu (3-7 disks)
   - **Click "Reset Game"** to restart with a new configuration
   - **Click "×"** on the control panel to dismiss it
   - **Click "☰"** button to show the control panel again

## Local Development

### Prerequisites

- A modern web browser with WebGL support
- Python 3 (for local testing) or any static HTTP server

### Running Locally

1. Clone or download this repository
2. Navigate to the project directory
3. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and visit:
   ```
   http://localhost:8000
   ```

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository

1. Create a new repository on GitHub (e.g., `hanoi`)
2. Don't initialize with README (you already have one)

### Step 2: Push Your Code

```bash
cd /Users/matjoha/playground/hanoi
git init
git add .
git commit -m "Initial commit: Towers of Hanoi game"
git branch -M main
git remote add origin https://github.com/yourusername/hanoi.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Source", select "main" branch
5. Click "Save"
6. Your site will be published at `https://yourusername.github.io/hanoi/`

## Project Structure

```
hanoi/
├── index.html              # Main entry point
├── css/
│   └── style.css          # Styling and layout
├── js/
│   ├── main.js            # Application initialization
│   ├── scene/
│   │   └── SceneManager.js    # Three.js scene management
│   ├── game/
│   │   ├── GameState.js       # Game logic and state
│   │   ├── Tower.js           # Tower objects
│   │   └── Disk.js            # Disk objects with physics
│   ├── interaction/
│   │   └── DragController.js  # Drag and drop handling
│   └── ui/
│       └── UIController.js     # UI controls
└── README.md
```

## Technical Details

### Technologies Used

- **Three.js (r150)**: 3D graphics rendering
- **Vanilla JavaScript**: ES6 modules
- **HTML5 Canvas**: WebGL rendering target
- **CSS3**: Styling and responsive design

### Architecture

The game follows a modular architecture with clear separation of concerns:

- **SceneManager**: Handles Three.js scene, camera, renderer, lighting, and orbit controls
- **GameState**: Manages game state, disk/tower initialization, and game logic
- **Tower**: Represents a single tower with position and disk management
- **Disk**: Individual disk objects with 3D meshes, physics simulation, and collision detection
- **DragController**: Handles mouse/touch input, raycasting, and multi-disk group dragging
- **UIController**: Connects HTML controls to game logic and manages UI visibility

### Physics Simulation

Each disk has its own physics simulation:

- **Gravity**: Disks fall with realistic gravity (-20 units/s²)
- **Velocity**: Momentum and friction simulation
- **Collision Detection**:
  - Pole collision: Prevents disks from passing through tower poles
  - Disk-to-disk collision: Disks stack on top of each other
  - Table boundaries: Disks stay within the table area
- **Constraint**: Disks are locked to the Z=0 plane (pole axis) during dragging

### Disk Design

Disks are created using Three.js ExtrudeGeometry:

- Outer radius varies by disk size (0.75 to 2.5 units)
- Inner hole radius is consistent (0.22 units) for all disks
- Poles have radius 0.15 units and fit through the holes
- Each disk has a unique color based on size

### Group Dragging

When you drag a disk that has other disks on top:

1. System finds all disks at the same X position with higher Y values
2. All disks move together maintaining their relative positions
3. Collision detection checks all disks in the group
4. When released, all disks fall together with physics

## Browser Compatibility

The game works in modern browsers that support:
- WebGL
- ES6 Modules
- CSS3

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

The game is optimized for smooth 60 FPS performance:
- Efficient geometry using ExtrudeGeometry with holes
- Delta time-based physics for frame-rate independence
- Shadow map optimization
- Responsive canvas sizing
- Hardware-accelerated rendering

## Mobile Support

Fully responsive design:
- Touch controls for dragging disks
- Touch-enabled orbit controls
- Control panel moves to bottom on mobile
- Larger touch targets for buttons
- Optimized layout for small screens

## License

This project is open source and available under the MIT License.

## Credits

Created with Three.js - https://threejs.org/

## Future Enhancements

Possible features to add:
- Sound effects for disk placement
- Different visual themes (wood, metal, neon)
- Particle effects when disks land
- Move counter and optimal solution tracker
- Timer and speedrun mode
- Multiple puzzle variants
- Tutorial mode with hints
- Disk rotation/tilting physics when partially supported
