import { GAME_CONFIG, GAME_PHASES } from '../shared/constants.js'
import {
  createDeck,
  dealCards, 
  getCardRank,
  getCardValue,
  getMagicCardType,
  shouldBurnPile,
  getNextPlayer,
  getPlayerCardCount,
  isPlayerFinished,
  getValidMoves
} from './game-utils.js'

/**
 * Core game engine for Shithead card game
 */
export class ShitheadEngine {
  constructor(playerCount = 2) {
    this.playerCount = playerCount
    this.gameState = this.initializeGame()
  }

  initializeGame() {
    const deck = createDeck()
    const { players, remainingDeck } = dealCards(deck, this.playerCount)
    
    return {
      currentPlayer: 0,
      turnDirection: 1, // 1 = clockwise, -1 = counterclockwise
      phase: GAME_PHASES.SETUP,
      
      // Pile state
      playPile: [],
      pileTopValue: '2', // Start with lowest value
      
      // Cards
      deck: remainingDeck,
      
      // Players
      players,
      
      // Game status
      winner: null,
      loser: null, // The "shithead"
      
      // Special states
      pendingJokerTarget: false,
      jokerPlayerId: null,
    }
  }

  // Setup phase - allow card swapping between hand and face-up
  swapCards(playerId, handCard, faceUpCard) {
    if (this.gameState.phase !== GAME_PHASES.SETUP) {
      throw new Error('Card swapping only allowed during setup phase')
    }
    
    const player = this.gameState.players[playerId]
    
    // Validate cards exist
    const handIndex = player.hand.indexOf(handCard)
    const faceUpIndex = player.faceUp.indexOf(faceUpCard)
    
    if (handIndex === -1 || faceUpIndex === -1) {
      throw new Error('Invalid cards for swapping')
    }
    
    // Perform swap
    player.hand[handIndex] = faceUpCard
    player.faceUp[faceUpIndex] = handCard
    
    return this.gameState
  }

  // Start main game after setup
  startMainGame() {
    if (this.gameState.phase !== GAME_PHASES.SETUP) {
      throw new Error('Game already started')
    }
    
    this.gameState.phase = GAME_PHASES.MAIN_PLAY
    
    // Find starting player (lowest card in hand, or lowest face-up if no hand)
    let startingPlayer = 0
    let lowestValue = Infinity
    
    Object.entries(this.gameState.players).forEach(([playerId, player]) => {
      const cardsToCheck = player.hand.length > 0 ? player.hand : player.faceUp
      
      for (const card of cardsToCheck) {
        const value = getCardValue(card)
        if (value < lowestValue && value >= 3) { // Must be 3 or higher
          lowestValue = value
          startingPlayer = parseInt(playerId)
        }
      }
    })
    
    this.gameState.currentPlayer = startingPlayer
    return this.gameState
  }

  // Main game action - play cards
  playCards(playerId, cards, fromCollection) {
    if (this.gameState.currentPlayer !== playerId) {
      throw new Error('Not your turn')
    }
    
    if (this.gameState.pendingJokerTarget) {
      throw new Error('Must select Joker target first')
    }

    const player = this.gameState.players[playerId]
    const collection = player[fromCollection]
    
    // Validate cards exist in collection
    if (!cards.every(card => collection.includes(card))) {
      throw new Error(`Cards not found in ${fromCollection}`)
    }
    
    // For blind cards, reveal first
    if (fromCollection === 'blind') {
      // Can only play one blind card at a time
      if (cards.length > 1) {
        throw new Error('Can only play one blind card at a time')
      }
    }
    
    // Remove cards from player collection
    cards.forEach(card => {
      const index = collection.indexOf(card)
      collection.splice(index, 1)
    })
    
    // Add to play pile
    this.gameState.playPile.push(...cards)
    
    // Update pile top value
    const lastCard = cards[cards.length - 1]
    const cardRank = getCardRank(lastCard)
    const magicType = getMagicCardType(lastCard)
    
    // Handle magic card effects
    let continueTheTurn = false
    let reverseTurn = false
    
    switch (magicType) {
      case 'reset': // 2
        this.gameState.pileTopValue = '2'
        break
        
      case 'lower': // 7  
        this.gameState.pileTopValue = cardRank
        break
        
      case 'invisible': // 8
        // Find the card below this 8 for the next play value
        const pileWithoutCurrent = this.gameState.playPile.slice(0, -cards.length)
        this.gameState.pileTopValue = pileWithoutCurrent.length > 0 
          ? getCardRank(pileWithoutCurrent[pileWithoutCurrent.length - 1])
          : '2'
        break
        
      case 'burn': // 10
        this.gameState.playPile = []
        this.gameState.pileTopValue = '2'
        continueTheTurn = true
        break
        
      case 'reverse': // J (also invisible)
        this.gameState.turnDirection *= -1
        const pileForReverse = this.gameState.playPile.slice(0, -cards.length)
        this.gameState.pileTopValue = pileForReverse.length > 0
          ? getCardRank(pileForReverse[pileForReverse.length - 1])
          : '2'
        break
        
      case 'force': // Joker
        this.gameState.pendingJokerTarget = true
        this.gameState.jokerPlayerId = playerId
        return this.gameState // Wait for target selection
        
      default:
        this.gameState.pileTopValue = cardRank
    }
    
    // Check if pile should burn (4 of a kind)
    if (shouldBurnPile(cards, this.gameState.playPile)) {
      this.gameState.playPile = []
      this.gameState.pileTopValue = '2'
      continueTheTurn = true
    }
    
    // Draw cards if deck exists and hand not full
    if (this.gameState.deck.length > 0 && player.hand.length < 3) {
      while (this.gameState.deck.length > 0 && player.hand.length < 3) {
        player.hand.push(this.gameState.deck.pop())
      }
    }
    
    // Check if player finished
    if (isPlayerFinished(player)) {
      player.isFinished = true
      
      // Check for winner/loser
      const finishedPlayers = Object.values(this.gameState.players).filter(p => p.isFinished)
      const activePlayers = Object.values(this.gameState.players).filter(p => !p.isFinished)
      
      if (activePlayers.length === 1) {
        // Game over
        this.gameState.loser = Object.keys(this.gameState.players).find(
          id => !this.gameState.players[id].isFinished
        )
        this.gameState.winner = Object.keys(this.gameState.players).find(
          id => this.gameState.players[id].isFinished
        )
        this.gameState.phase = GAME_PHASES.END_GAME
      } else if (finishedPlayers.length === 1) {
        this.gameState.winner = playerId.toString()
      }
    }
    
    // Move to next player (unless continuing turn)
    if (!continueTheTurn && !this.gameState.pendingJokerTarget) {
      this.gameState.currentPlayer = getNextPlayer(
        this.gameState.currentPlayer,
        this.gameState.turnDirection,
        this.gameState.players
      )
    }
    
    return this.gameState
  }

  // Handle Joker target selection
  selectJokerTarget(playerId, targetPlayerId) {
    if (!this.gameState.pendingJokerTarget || this.gameState.jokerPlayerId !== playerId) {
      throw new Error('No pending Joker target selection')
    }
    
    if (this.gameState.players[targetPlayerId].isFinished) {
      throw new Error('Cannot target finished player')
    }
    
    // Target player takes all pile cards
    const targetPlayer = this.gameState.players[targetPlayerId]
    targetPlayer.hand.push(...this.gameState.playPile)
    
    // Clear pile and reset
    this.gameState.playPile = []
    this.gameState.pileTopValue = '2'
    this.gameState.pendingJokerTarget = false
    this.gameState.jokerPlayerId = null
    
    // Joker player continues their turn
    return this.gameState
  }

  // Take pile action
  takePile(playerId) {
    if (this.gameState.currentPlayer !== playerId) {
      throw new Error('Not your turn')
    }
    
    const player = this.gameState.players[playerId]
    
    // If playing from face-up cards, take lowest card to hand first
    if (player.hand.length === 0 && player.faceUp.length > 0) {
      const lowestFaceUp = player.faceUp.reduce((lowest, card) => 
        getCardValue(card) < getCardValue(lowest) ? card : lowest
      )
      const index = player.faceUp.indexOf(lowestFaceUp)
      player.faceUp.splice(index, 1)
      player.hand.push(lowestFaceUp)
    }
    
    // Take all pile cards to hand
    player.hand.push(...this.gameState.playPile)
    
    // Clear pile and reset
    this.gameState.playPile = []
    this.gameState.pileTopValue = '2'
    
    // Move to next player
    this.gameState.currentPlayer = getNextPlayer(
      this.gameState.currentPlayer,
      this.gameState.turnDirection,
      this.gameState.players
    )
    
    return this.gameState
  }

  // Get valid moves for current player
  getValidMoves(playerId) {
    return getValidMoves(playerId, this.gameState)
  }

  // Check if move is valid
  canPlay(playerId, cards) {
    const validMoves = this.getValidMoves(playerId)
    return validMoves.some(move => 
      move.type === 'playCards' && 
      move.cards.length === cards.length &&
      move.cards.every(card => cards.includes(card))
    )
  }

  // Get current game state (for client updates)
  getGameState() {
    return { ...this.gameState }
  }

  // Get player-specific view (hide other players' hands)
  getPlayerView(playerId) {
    const state = { ...this.gameState }
    
    // Hide other players' hand and blind cards
    Object.keys(state.players).forEach(id => {
      if (id !== playerId.toString()) {
        state.players[id] = {
          ...state.players[id],
          hand: new Array(state.players[id].hand.length).fill('hidden'),
          blind: new Array(state.players[id].blind.length).fill('hidden')
        }
      }
    })
    
    return state
  }
}