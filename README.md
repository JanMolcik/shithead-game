# Shithead Card Game

A modern web implementation of the classic Shithead (also known as Poohead) card game with AI opponents and multiplayer support.

## Features

- 🎮 Single-player vs AI with multiple difficulty levels
- 🌐 Online multiplayer support  
- 🎯 Advanced AI using heuristic strategies and MCTS
- 🎨 Modern React UI with smooth animations
- ⚡ Fast development with Vite
- 🎴 Full game rules implementation including magic cards

## Tech Stack

- **Frontend:** React 18 + Vite
- **Game Engine:** Boardgame.io
- **Styling:** Tailwind CSS + CSS Custom Properties
- **AI:** Rule-based heuristics + Monte Carlo Tree Search
- **Real-time:** WebSockets for multiplayer

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start full-stack development (client + server)
npm run dev:full

# Build for production
npm run build
```

## Game Rules

Shithead is a card shedding game where players race to discard all their cards in three phases:
1. **Hand cards** (hidden from other players)
2. **Face-up cards** (visible to all players)  
3. **Blind cards** (face-down, unknown until played)

### Magic Cards
- **2** - Reset pile value to 2
- **7** - Next player must play 7 or lower
- **8** - Invisible card (skip to card below)
- **10** - Burn pile (clear all cards)
- **J** - Reverse turn order + invisible effect
- **Joker** - Force any player to take the pile

## AI Implementation

The AI system uses a phased approach:

### Phase 1: Rule-Based AI
- **Easy:** Basic card playing with no strategy
- **Medium:** Heuristic scoring with magic card tactics
- **Hard:** Advanced heuristics with opponent modeling

### Phase 2: MCTS Expert AI
- **Expert:** Monte Carlo Tree Search with determinization
- Uses Web Workers for non-blocking calculations
- Smart playouts using rule-based AI as default policy

## Project Structure

```
src/
├── engine/          # Game logic and rules
├── client/          # React components and UI
├── server/          # Multiplayer server code
├── ai/              # AI implementation (heuristic + MCTS)
├── shared/          # Shared constants and utilities
└── main.jsx         # Application entry point
```

## Deployment

The game can be deployed to:
- **Vercel** (recommended for frontend)
- **Railway** or **Render** (for full-stack)
- **Netlify** (static hosting)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or personal use.