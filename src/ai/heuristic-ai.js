import { AI_DIFFICULTY, AI_SCORES } from '../shared/constants.js'
import {
  getCardRank,
  getCardValue,
  getMagicCardType,
  getPlayerCardCount
} from '../engine/game-utils.js'

/**
 * Rule-based heuristic AI for Shithead game
 */
export class HeuristicAI {
  constructor(difficulty = AI_DIFFICULTY.MEDIUM) {
    this.difficulty = difficulty
    this.cardTracker = new Map() // For Hard difficulty opponent modeling
  }

  // Main AI decision function
  calculateMove(gameState) {
    const playerId = gameState.currentPlayer
    const validMoves = this.getValidMoves(gameState, playerId)
    
    if (validMoves.length === 0) {
      return { type: 'takePile' }
    }
    
    if (validMoves.length === 1) {
      return validMoves[0]
    }
    
    // Score each move and select the best
    const scoredMoves = validMoves.map(move => ({
      move,
      score: this.scoreMove(move, gameState, playerId)
    }))
    
    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score)
    
    // Add some randomness for lower difficulties
    if (this.difficulty === AI_DIFFICULTY.EASY) {
      // 50% chance to pick a random valid move instead of best
      if (Math.random() < 0.5) {
        return validMoves[Math.floor(Math.random() * validMoves.length)]
      }
    }
    
    return scoredMoves[0].move
  }

  // Score a move based on strategic value
  scoreMove(move, gameState, playerId) {
    let score = 0
    
    if (move.type === 'takePile') {
      return -100 // Taking pile is generally bad
    }
    
    const { cards, from } = move
    const card = cards[0]
    const cardRank = getCardRank(card)
    const magicType = getMagicCardType(card)
    
    // Immediate win check
    if (this.wouldWinGame(move, gameState, playerId)) {
      return AI_SCORES.IMMEDIATE_WIN
    }
    
    // Multi-card play bonus
    if (cards.length > 1) {
      score += cards.length * AI_SCORES.MULTI_CARD_BONUS
    }
    
    // Magic card scoring
    if (magicType) {
      score += this.scoreMagicCard(magicType, gameState, playerId)
    } else {
      // Regular card scoring
      score += this.scoreRegularCard(card, gameState)
    }
    
    // Collection transition strategy
    score += this.scoreCollectionTransition(from, card, gameState, playerId)
    
    // Difficulty-specific adjustments
    if (this.difficulty === AI_DIFFICULTY.HARD) {
      score += this.scoreOpponentModeling(move, gameState, playerId)
    }
    
    return score
  }

  // Score magic cards based on game state
  scoreMagicCard(magicType, gameState, playerId) {
    let score = AI_SCORES.MAGIC_CARD_BASE
    const pileSize = gameState.playPile.length
    const nextPlayer = this.getNextPlayer(gameState, playerId)
    const nextPlayerCardCount = getPlayerCardCount(gameState.players[nextPlayer])
    
    switch (magicType) {
      case 'burn': // 10
        score += pileSize * AI_SCORES.PILE_SIZE_MULTIPLIER
        score += this.countHighValueCards(gameState.playPile) * AI_SCORES.HIGH_VALUE_MULTIPLIER
        
        if (nextPlayerCardCount <= 2) {
          score += AI_SCORES.NEAR_WINNER_BONUS
        }
        
        if (this.isForcedToTakePile(gameState, playerId)) {
          return AI_SCORES.FORCED_PLAY
        }
        break
        
      case 'force': // Joker
        // Target player with fewest cards
        const targetPlayer = this.selectJokerTarget(gameState, playerId)
        const targetCardCount = getPlayerCardCount(gameState.players[targetPlayer])
        
        if (targetCardCount <= 2) {
          score += AI_SCORES.NEAR_WINNER_BONUS * 2
        }
        score += (1 / (targetCardCount + 1)) * 50
        break
        
      case 'lower': // 7
        const currentValue = getCardValue(`${gameState.pileTopValue}_hearts`)
        score += currentValue // Higher pile value makes 7 more valuable
        
        if (nextPlayerCardCount <= 2) {
          score += AI_SCORES.NEAR_WINNER_BONUS
        }
        
        // Avoid self-trap if we have mostly high cards
        const player = gameState.players[playerId]
        const highCardCount = this.countHighCards(player.hand)
        score -= highCardCount * 2
        break
        
      case 'reset': // 2
        score += AI_SCORES.MAGIC_CARD_BASE + 10 // Always valuable for control
        break
        
      case 'invisible': // 8
        score += 10 // Good defensive/throwaway card
        break
        
      case 'reverse': // J
        score += AI_SCORES.MAGIC_CARD_BASE + 5
        break
    }
    
    return score
  }

  // Score regular cards
  scoreRegularCard(card, gameState) {
    const cardValue = getCardValue(card)
    
    // Generally prefer playing higher cards to reduce risk
    return cardValue
  }

  // Score based on collection transition strategy  
  scoreCollectionTransition(from, card, gameState, playerId) {
    let score = 0
    const player = gameState.players[playerId]
    
    if (from === 'hand') {
      // Prefer cards that don't match face-up cards (save combinations)
      const cardRank = getCardRank(card)
      const hasFaceUpMatch = player.faceUp.some(faceUpCard => 
        getCardRank(faceUpCard) === cardRank
      )
      
      if (hasFaceUpMatch) {
        score -= 5 // Penalty for breaking potential combination
      }
    } else if (from === 'faceUp') {
      // Prefer single cards over pairs/triples
      const cardRank = getCardRank(card)
      const faceUpMatches = player.faceUp.filter(c => getCardRank(c) === cardRank)
      
      if (faceUpMatches.length > 1) {
        score -= 10 // Penalty for playing from a set
      }
    }
    
    return score
  }

  // Opponent modeling for Hard difficulty
  scoreOpponentModeling(move, gameState, playerId) {
    if (this.difficulty !== AI_DIFFICULTY.HARD) return 0
    
    let score = 0
    
    // Track played cards and estimate remaining deck
    // This is a simplified version - could be much more sophisticated
    
    return score
  }

  // Helper methods
  wouldWinGame(move, gameState, playerId) {
    if (move.type === 'takePile') return false
    
    const player = gameState.players[playerId]
    const totalCards = getPlayerCardCount(player)
    
    return totalCards === move.cards.length
  }

  isForcedToTakePile(gameState, playerId) {
    const validMoves = this.getValidMoves(gameState, playerId)
    return validMoves.every(move => move.type === 'takePile')
  }

  getNextPlayer(gameState, currentPlayerId) {
    const playerIds = Object.keys(gameState.players)
      .filter(id => !gameState.players[id].isFinished)
    const currentIndex = playerIds.indexOf(currentPlayerId.toString())
    const nextIndex = (currentIndex + gameState.turnDirection + playerIds.length) % playerIds.length
    return parseInt(playerIds[nextIndex])
  }

  countHighValueCards(pile) {
    return pile.filter(card => getCardValue(card) >= 12).length
  }

  countHighCards(cards) {
    return cards.filter(card => getCardValue(card) >= 10).length
  }

  // Joker target selection
  selectJokerTarget(gameState, playerId) {
    const availableTargets = Object.keys(gameState.players)
      .filter(id => id !== playerId.toString() && !gameState.players[id].isFinished)
    
    // Select player with fewest total cards
    return availableTargets.reduce((bestTarget, targetId) => {
      const targetCards = getPlayerCardCount(gameState.players[targetId])
      const bestCards = getPlayerCardCount(gameState.players[bestTarget])
      
      return targetCards < bestCards ? targetId : bestTarget
    })
  }

  // Get valid moves for a player - simplified implementation
  getValidMoves(gameState, playerId) {
    const player = gameState.players[playerId]
    const moves = []
    
    // Determine active collection
    let activeCards = []
    let fromCollection = 'hand'
    
    if (player.hand.length > 0) {
      activeCards = player.hand
      fromCollection = 'hand'
    } else if (player.faceUp.length > 0) {
      activeCards = player.faceUp
      fromCollection = 'faceUp'
    } else if (player.blind.length > 0) {
      activeCards = player.blind
      fromCollection = 'blind'
    }
    
    if (activeCards.length === 0) {
      return [{ type: 'takePile' }]
    }
    
    // For now, return simple moves - we'll validate in the engine
    for (const card of activeCards) {
      moves.push({
        type: 'playCards',
        cards: [card],
        from: fromCollection
      })
    }
    
    // Always allow taking pile as fallback
    moves.push({ type: 'takePile' })
    
    return moves
  }
}

// AI Player wrapper class
export class AIPlayer {
  constructor(difficulty, playerId) {
    this.difficulty = difficulty
    this.playerId = playerId
    this.heuristicEngine = new HeuristicAI(difficulty)
    // MCTS engine would be initialized here for expert difficulty
    this.mctsEngine = null
  }

  async getMove(gameState) {
    if (this.difficulty === AI_DIFFICULTY.EXPERT && this.mctsEngine) {
      // Would use MCTS for expert level
      return await this.mctsEngine.calculateMove(gameState)
    }
    
    return this.heuristicEngine.calculateMove(gameState)
  }

  selectJokerTarget(gameState) {
    return this.heuristicEngine.selectJokerTarget(gameState, this.playerId)
  }
}