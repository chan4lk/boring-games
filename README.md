# Codex App - Mini Arcade

A React + TypeScript + Vite web application featuring a collection of arcade games built with Three.js and Howler.js for audio.

## 🎮 Games

### Snake
The classic snake game where you control a snake to eat food while avoiding collisions.

### Blasting Rockets
A missile control game where you launch and control rockets.

### Contra (2D)
A Contra-style action game with weapons, enemies, and level progression.

### Contra 3D
A full 3D Contra-style shooter built with Three.js, featuring:
- First-person shooter gameplay
- Multiple weapon types with different fire patterns
- Physics-based collision detection
- Complete UI system (main menu, pause menu, game over, level complete)
- Sound effects and music
- Cheat system

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **3D Library**: Three.js (v0.183)
- **Audio**: Howler.js (v2.2.4)
- **Language**: TypeScript (v5.9.3)

## 📁 Project Structure

```
src/
├── contra-3d/           # 3D Contra game (Three.js)
│   ├── Game.ts         # Main game state and logic
│   ├── Engine.ts       # Three.js rendering engine
│   ├── Physics.ts      # 3D collision detection
│   ├── types.ts        # TypeScript type definitions
│   ├── weapons/        # Weapon system
│   │   ├── BulletPatterns.ts
│   │   └── WeaponRegistry.ts
│   ├── ui/            # Game UI components
│   │   ├── MainMenu.tsx
│   │   ├── PauseMenu.tsx
│   │   ├── GameOver.tsx
│   │   └── LevelComplete.tsx
│   ├── audio/         # Audio management
│   │   ├── music.ts
│   │   └── sfx.ts
│   └── CheatSystem.ts # Cheat functionality
├── SnakeGame.tsx       # Snake game implementation
├── RocketGame.tsx      # Rockets/missiles game
├── ContraGame.tsx      # 2D Contra-style game
├── Contra3DGame.tsx    # 3D Contra game
├── contraLogic.ts      # Shared game utilities
├── game.ts             # Game core utilities
├── main.tsx            # Application entry point
└── App.tsx             # Main application component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## ⚙️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview production build locally |

## 📸 Screenshots

*(Add screenshots of the games here)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Three.js** - Powerful 3D graphics library
- **Howler.js** - Audio processing library
- **React** - The library for web and native user interfaces
- **Vite** - Next-generation frontend tooling
