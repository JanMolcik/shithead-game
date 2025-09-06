# SHITHEAD CARD GAME - GAME ENGINE SPECIFICATION

## 1. GAME OVERVIEW

**Game Name:** Shithead
**Genre:** Card shedding game
**Players:** 1-8 players (including single-player vs AI)
**Objective:** First player to discard all cards wins; last player remaining becomes the "Shithead"
**Duration:** 15-30 minutes

## 2. GAME RULES & MECHANICS

### 2.1 Game Objective
Players race to discard all cards from their three collections in order: hand cards → face-up cards → blind/face-down cards. The last player with remaining cards becomes the "Shithead."

### 2.2 Game Setup
- Each player receives 9 cards total:
  - 3 **hand cards** (visible to player only, held in hand)
  - 3 **face-up cards** (visible to all players, placed face-up on table)
  - 3 **blind cards** (face-down, unknown to all players)
- Players may swap cards between hand and face-up cards before game starts
- Remaining cards form the deck pile
- **Deck composition:** Standard 52-card deck + 2 Jokers = 54 cards total

### 2.3 Game Phases

| Phase | Description | Rules |
|-------|-------------|-------|
| **Setup** | Deal cards, allow swapping | Players can swap hand ↔ face-up cards |
| **Main Play** | Play cards while deck exists | Draw cards to maintain 3 in hand |
| **End Game** | No deck remaining | Play face-up cards, then blind cards |

### 2.4 Card Values & Hierarchy
```
Card Values (low to high): 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A
Special Cards: 2 (reset), 7 (conditional), 8 (invisible), 10 (burn), J (reverse), Joker (force take)
```

### 2.5 Basic Play Rules
1. **Starting Player:** Player with lowest 3 in hand (if no 3, then 4, etc.)
2. **Card Placement:** Must play equal or higher value than previous card
3. **Hand Refill:** Draw from deck to maintain 3 cards in hand (while deck exists)
4. **Turn Progression:** Play clockwise unless reversed

### 2.6 Magic Cards System

| Card | Type | Effect | Can Play On Any Card? | Player Takes Another Turn? |
|------|------|--------|----------------------|---------------------------|
| **2** | Reset | Resets pile value to 2 (lowest) | Yes | No |
| **7** | Conditional | Next player must play 7 or lower | No - follows normal hierarchy | No |
| **8** | Invisible | Next player must beat card below this 8 | Yes | No |
| **10** | Burn Pile | Clears entire pile | Yes | Yes |
| **J** | Reverse + Invisible | Reverses turn order + invisible effect | Yes | No |
| **Joker** | Force Take | Choose any player to take entire pile | Yes | Yes |

### 2.7 Joker Special Rules
When a **Joker** is played:
1. Player who played Joker **chooses any opponent** (including themselves, though strategic)
2. Chosen player must **take ALL cards** from the discard pile into their hand
3. **Pile is cleared** (similar to burning)
4. **Joker player takes another turn** immediately
5. Pile value resets to 2 for the next card played

### 2.8 Pile Burning Rules
The pile is "burned" (completely discarded) when:
- A **10** card is played
- **4 cards of same value** are played consecutively (can span multiple players)

When pile burns: all cards are removed, pile value resets to 2, burning player takes another turn.

### 2.9 Card Collection Priority
Players must play cards in this order:
1. **Hand cards** - while hand is not empty
2. **Face-up cards** - after hand is empty, before blind cards
3. **Blind cards** - played one at a time, revealed when played

### 2.10 Taking the Pile
If a player cannot play a valid card:
- They must take ALL cards from the pile into their hand
- If playing from face-up cards, take the lowest face-up card to hand first
- Turn ends immediately

**Forced pile taking** (via Joker):
- Chosen player takes all pile cards immediately
- No choice in the matter
- Joker player continues their turn

### 2.11 Win/Loss Conditions
- **Winner:** First player to discard all cards from all three collections
- **Shithead:** Last player remaining with cards
- Players are eliminated when all their cards are gone

## 3. GAME ENGINE CORE LOGIC

### 3.1 Game State Structure
```javascript
gameState = {
  // Game flow
  currentPlayer: number,
  turnDirection: 1 | -1,  // 1 = clockwise, -1 = counterclockwise
  phase: 'setup' | 'mainPlay' | 'endGame',

  // Pile state
  playPile: Array,        // All played cards
  pileTopValue: string,   // Value next card must beat

  // Cards
  deck: Array,            // Remaining deck cards

  // Players
  players: {
    [playerId]: {
      hand: Array,
      faceUp: Array,
      blind: Array,
      isFinished: boolean
    }
  },

  // Game status
  winner: playerId | null,
  shithead: playerId | null,

  // Pending actions
  pendingJokerTarget: boolean  // Waiting for Joker target selection
}
```

### 3.2 Core Game Functions

#### Card Validation
```javascript
function isValidPlay(card, pileTopValue, gameState) {
  // Magic cards can always be played (except 7)
  if (isMagicCard(card) && card !== '7') return true;

  // Seven rule: if pile top is 7, next card must be ≤ 7
  if (pileTopValue === '7') {
    return getCardValue(card) <= 7;
  }

  // Normal rule: card must be ≥ pile top
  return getCardValue(card) >= getCardValue(pileTopValue);
}

function isMagicCard(card) {
  return ['2', '8', '10', 'J', 'Joker'].includes(card);
}
```

#### Pile Burning Logic
```javascript
function shouldBurnPile(playedCards, playPile) {
  // Burn on 10
  if (playedCards[0] === '10') return true;

  // Burn on 4 of same value
  const cardValue = getCardValue(playedCards[0]);
  const lastFourCards = playPile.slice(-4);
  return lastFourCards.length === 4 &&
         lastFourCards.every(card => getCardValue(card) === cardValue);
}
```

#### Joker Logic
```javascript
function processJoker(playerId, targetPlayerId, gameState) {
  // Target player takes all pile cards
  const pileCards = [...gameState.playPile];
  gameState.players[targetPlayerId].hand.push(...pileCards);

  // Clear pile and reset
  gameState.playPile = [];
  gameState.pileTopValue = '2';

  // Joker player continues (doesn't end turn)
  return {
    ...gameState,
    pendingJokerTarget: false,
    // currentPlayer remains the same for another turn
  };
}
```

#### Turn Management
```javascript
function getNextPlayer(currentPlayer, turnDirection, players) {
  const playerIds = Object.keys(players).filter(id => !players[id].isFinished);
  const currentIndex = playerIds.indexOf(currentPlayer);
  const nextIndex = (currentIndex + turnDirection + playerIds.length) % playerIds.length;
  return playerIds[nextIndex];
}

function shouldPlayerContinue(lastPlayedCard) {
  // Player continues on: 10 (burn), Joker (force take)
  return lastPlayedCard === '10' || lastPlayedCard === 'Joker';
}
```

### 3.3 Game Engine API
```javascript
// Core moves
playCards(playerId, cards, fromCollection) // 'hand' | 'faceUp' | 'blind'
takePile(playerId)
swapCards(playerId, handCard, faceUpCard) // Setup phase only
selectJokerTarget(playerId, targetPlayerId) // After playing Joker

// Game queries
canPlay(playerId, cards)
getValidMoves(playerId)
getValidJokerTargets(playerId) // All other players
isGameOver()
getGameWinner()
isPendingJokerTarget()
```

## 4. RECOMMENDED MODERN ARCHITECTURE

### 4.1 Technology Stack Recommendations
- **Frontend:** Vanilla JavaScript ES6+ with modern DOM APIs
- **Styling:** CSS3 with CSS Grid/Flexbox, CSS Custom Properties
- **Backend:** Node.js with Express.js for REST API
- **Real-time:** WebSockets (ws library) for multiplayer
- **State Management:** Vanilla JavaScript with Proxy for reactivity
- **Build Tools:** Vite for development server and bundling

### 4.2 Suggested File Structure
```
src/
├── engine/
│   ├── game-engine.js      # Core game logic
│   ├── card-utils.js       # Card validation and utilities
│   ├── game-state.js       # State management
│   └── rules.js           # Game rules implementation
├── client/
│   ├── game-ui.js         # DOM manipulation and UI
│   ├── websocket-client.js # Multiplayer communication
│   └── animations.js      # Card animations
├── server/
│   ├── game-server.js     # Express server
│   ├── websocket-server.js # WebSocket handling
│   └── game-rooms.js      # Multiplayer room management
└── shared/
    └── constants.js       # Shared constants
```

### 4.3 Implementation Approach
1. **Pure Functions:** Implement game logic as pure functions for easy testing
2. **Immutable State:** Use immutable updates to prevent state corruption
3. **Event-Driven:** Use event system for game state changes
4. **Modular Design:** Separate concerns (engine, UI, networking)
5. **WebSocket Protocol:** Define clear message format for multiplayer actions

### 4.4 Key Classes/Modules
```javascript
// Game Engine
class ShitheadEngine {
  constructor(playerCount)
  setupGame()
  playMove(playerId, move)
  selectJokerTarget(playerId, targetId)
  getGameState()
  isValidMove(playerId, move)
}

// Card Utilities
class CardUtils {
  static isValidPlay(card, pileTop, gameRules)
  static shouldBurnPile(cards, pile)
  static getCardValue(card)
  static isMagicCard(card)
  static processJokerEffect(targetPlayer, pile)
}

// Game State Manager
class GameState {
  constructor(initialState)
  update(action)
  getPlayerView(playerId)
  subscribe(callback)
}
```

### 4.5 Joker Implementation Notes
- **UI Consideration:** After playing Joker, show player selection interface
- **Network Protocol:** Joker play requires two-step process (play card → select target)
- **Validation:** Ensure Joker target is valid (active player, not self unless strategic)
- **Animation:** Consider dramatic effect for Joker (cards flying to target player)

This specification provides a complete game engine foundation that can be implemented with modern web technologies while maintaining the full complexity and strategy of the original Shithead card game, enhanced with the strategic Joker card.

## 5. SINGLE-PLAYER AI SYSTEM

### 5.1 AI Implementation Overview

The AI system supports single-player gameplay against computer opponents using a phased implementation approach that balances performance with strategic depth.

**Implementation Strategy:**
- **Phase 1:** Rule-based heuristic AI with multiple difficulty levels
- **Phase 2:** Advanced MCTS-based AI for expert-level gameplay

### 5.2 Rule-Based AI Foundation (Phase 1)

#### AI Difficulty Levels

| Difficulty | Strategy | Performance | Characteristics |
|------------|----------|-------------|-----------------|
| **Easy** | Basic rules | Instant | Plays lowest valid card, uses magic cards immediately |
| **Medium** | Heuristic scoring | <50ms | Strategic magic card usage, multi-card plays |
| **Hard** | Advanced heuristics | <100ms | Opponent modeling, card counting, adaptive strategy |

#### Core Heuristic System

The AI uses a scoring system to evaluate all valid moves, selecting the highest-scoring option:

**Move Scoring Priority:**
1. **Immediate Win:** `score = 1000` (highest priority)
2. **Forced Play:** `score = 900` (avoid taking pile when legal move exists)
3. **Strategic Magic Cards:** Variable scoring based on game state
4. **Multi-card Plays:** `score += cardCount * 15` (pairs, triples)
5. **Defensive Plays:** Context-dependent scoring
6. **Standard Plays:** Base score + modifiers

#### Magic Card Heuristics

**Card 10 (Burn Pile):**
```javascript
score += pile.cardCount * 1.5                    // Large pile bonus
score += countHighValueCards(pile) * 2           // High-value cards in pile
if (nextPlayer.cardCount <= 2) score += 20       // Block near-winner
if (isForcedToPickUp) score = 1000              // Emergency use
```

**Joker (Force Take):**
```javascript
// Target selection: prioritize players closest to winning
targetScore = (1 / (player.totalCardCount + 1)) * 50
if (player.isNext) targetScore += 10             // Next player disruption
```

**Card 7 (Play Lower):**
```javascript
score += currentPileValue                        // Higher pile value = better
if (nextPlayer.cardCount <= 2) score += 15       // Trap near-winner
score -= self.highCardCount * 2                  // Avoid self-trap
```

**Card 2 (Reset) & 8 (Invisible):**
```javascript
// Card 2: Always valuable for control
score += 25 + bonusForFollowUpPlay

// Card 8: Defensive/throwaway usage
score += 10 + defensiveValue
```

#### Collection Transition Strategy

**Hand Cards Phase:**
- Preserve cards that match face-up cards for future combinations
- Play high cards early to reduce risk
- Set up powerful face-up combinations

**Face-Up Cards Phase:**
- Prioritize single cards over pairs/triples
- Save powerful combinations for critical moments
- Visible strategy requires careful timing

**Blind Cards Phase:**
- Pure chance - no heuristic optimization possible
- Random selection from available blind cards

#### Opponent Modeling (Hard Difficulty)

**Card Tracking:**
```javascript
// Track played cards per player
playedCards: Map<playerId, Array<card>>

// Estimate remaining deck composition
remainingCards: Array<card>

// Probability distributions for hidden cards
handProbabilities: Map<playerId, Map<card, probability>>
```

**Strategic Insights:**
- Track magic card usage patterns
- Estimate hand strength based on play patterns
- Adapt strategy based on opponent behavior

### 5.3 MCTS Expert AI (Phase 2)

#### Implementation Architecture

**Web Worker Integration:**
```javascript
// Main thread
const aiWorker = new Worker('ai-worker.js');
aiWorker.postMessage({gameState, timeLimit: 800}); // 800ms thinking time

// Worker thread - MCTS calculation
class MCTSWorker {
  calculateMove(gameState, timeLimit) {
    // Determinized MCTS with rule-based default policy
  }
}
```

**Determinized MCTS Process:**
1. **Determinization:** Create multiple random deals of hidden cards
2. **Tree Search:** Run MCTS on each determinization (500-1000ms time limit)
3. **Aggregation:** Select move with best average win rate across all determinizations
4. **Smart Playouts:** Use Medium AI as default policy during simulations

**Performance Configuration:**
```javascript
const MCTS_CONFIG = {
  timeLimit: {
    easy: 300,    // ms
    medium: 500,
    hard: 800,
    expert: 1500
  },
  determinizations: 50,     // Number of random deals to test
  explorationConstant: 1.4  // UCB1 exploration parameter
}
```

### 5.4 Game Engine Extensions

#### AI Integration API

```javascript
class AIPlayer {
  constructor(difficulty, playerId) {
    this.difficulty = difficulty;
    this.playerId = playerId;
    this.heuristicEngine = new HeuristicAI(difficulty);
    this.mctsEngine = difficulty === 'expert' ? new MCTSEngine() : null;
  }

  async getMove(gameState) {
    if (this.difficulty === 'expert' && this.mctsEngine) {
      return await this.mctsEngine.calculateMove(gameState);
    }
    return this.heuristicEngine.calculateMove(gameState);
  }

  selectJokerTarget(gameState) {
    return this.heuristicEngine.selectBestTarget(gameState);
  }
}
```

#### Enhanced Game Engine

```javascript
// Extended game engine API
class ShitheadEngine {
  // Existing methods...

  // AI integration
  addAIPlayer(difficulty)
  processAITurn(playerId)
  isAIPlayer(playerId)

  // Single-player specific
  setupSinglePlayerGame(humanPlayerId, aiCount, aiDifficulties)
  getAIRecommendation(playerId) // Hint system for human player
}
```

### 5.5 Implementation Phases

**Phase 1 Deliverables (Immediate):**
- Easy/Medium/Hard rule-based AI players
- Single-player game mode
- AI difficulty selection
- Fast, responsive gameplay (<100ms AI thinking time)

**Phase 2 Enhancements (Future):**
- Expert MCTS AI with Web Worker implementation
- Advanced opponent modeling with card counting
- AI personality variations (aggressive, defensive, balanced)
- Adaptive difficulty that adjusts to player skill

### 5.6 Testing & Validation

**AI Quality Metrics:**
- Win rate against random play baseline
- Average game duration per difficulty level
- Move decision time consistency
- Strategic card usage effectiveness

**Performance Benchmarks:**
- Rule-based AI: <50ms per move
- MCTS AI: 500-1500ms per move (in Web Worker)
- Memory usage: <10MB additional for AI state
- No UI blocking during AI calculations