import { CARD_VALUES, MAGIC_CARDS } from '../shared/constants.js'

/**
 * Card utility functions for the Shithead game engine
 */

export const getCardValue = (card) => {
  const rank = card.split('_')[0] // Extract rank from "rank_suit" format
  return CARD_VALUES[rank] || 0
}

export const getCardRank = (card) => {
  return card.split('_')[0]
}

export const getCardSuit = (card) => {
  return card.split('_')[1] 
}

export const isMagicCard = (card) => {
  const rank = getCardRank(card)
  return Object.keys(MAGIC_CARDS).includes(rank)
}

export const getMagicCardType = (card) => {
  const rank = getCardRank(card)
  return MAGIC_CARDS[rank]
}

export const isValidPlay = (card, pileTopValue, gameState) => {
  const rank = getCardRank(card)
  
  // Magic cards can always be played (except 7 which follows hierarchy)
  if (isMagicCard(card) && rank !== '7') {
    return true
  }
  
  // Seven rule: if pile top is 7, next card must be ≤ 7
  if (pileTopValue === '7') {
    return getCardValue(card) <= 7
  }
  
  // Normal rule: card must be ≥ pile top value
  return getCardValue(card) >= getCardValue(`${pileTopValue}_hearts`)
}

export const shouldBurnPile = (playedCards, playPile) => {
  const cardRank = getCardRank(playedCards[0])
  
  // Burn on 10
  if (cardRank === '10') return true
  
  // Burn on 4 of same value
  if (playPile.length >= 3) {
    const lastFourCards = playPile.slice(-3).concat(playedCards)
    const cardValue = getCardValue(playedCards[0])
    
    return lastFourCards.length >= 4 && 
           lastFourCards.every(card => getCardValue(card) === cardValue)
  }
  
  return false
}

export const sortCards = (cards) => {
  return [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))
}

export const createDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
  
  const deck = []
  
  // Standard cards
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}_${suit}`)
    }
  }
  
  // Add 2 Jokers
  deck.push('Joker_red', 'Joker_black')
  
  return shuffleDeck(deck)
}

export const shuffleDeck = (deck) => {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const dealCards = (deck, numPlayers) => {
  const players = {}
  let deckIndex = 0
  
  for (let playerId = 0; playerId < numPlayers; playerId++) {
    players[playerId] = {
      hand: [],
      faceUp: [],
      blind: [],
      isFinished: false
    }
    
    // Deal 3 blind cards (face down)
    for (let i = 0; i < 3; i++) {
      players[playerId].blind.push(deck[deckIndex++])
    }
    
    // Deal 3 face-up cards
    for (let i = 0; i < 3; i++) {
      players[playerId].faceUp.push(deck[deckIndex++])
    }
    
    // Deal 3 hand cards
    for (let i = 0; i < 3; i++) {
      players[playerId].hand.push(deck[deckIndex++])
    }
    
    // Sort cards for better UX
    players[playerId].hand = sortCards(players[playerId].hand)
    players[playerId].faceUp = sortCards(players[playerId].faceUp)
  }
  
  return {
    players,
    remainingDeck: deck.slice(deckIndex)
  }
}

export const getPlayerCardCount = (player) => {
  return player.hand.length + player.faceUp.length + player.blind.length
}

export const isPlayerFinished = (player) => {
  return getPlayerCardCount(player) === 0
}

export const getNextPlayer = (currentPlayer, turnDirection, players) => {
  const activePlayers = Object.keys(players).filter(id => !players[id].isFinished)
  const currentIndex = activePlayers.indexOf(currentPlayer.toString())
  const nextIndex = (currentIndex + turnDirection + activePlayers.length) % activePlayers.length
  return parseInt(activePlayers[nextIndex])
}

export const getValidMoves = (playerId, gameState) => {
  const player = gameState.players[playerId]
  const moves = []
  
  // Check hand cards first
  if (player.hand.length > 0) {
    for (const card of player.hand) {
      if (isValidPlay(card, gameState.pileTopValue, gameState)) {
        moves.push({
          type: 'playCards',
          cards: [card],
          from: 'hand'
        })
      }
    }
    
    // Check for multi-card plays (same rank)
    const cardsByRank = {}
    player.hand.forEach(card => {
      const rank = getCardRank(card)
      if (!cardsByRank[rank]) cardsByRank[rank] = []
      cardsByRank[rank].push(card)
    })
    
    Object.entries(cardsByRank).forEach(([rank, cards]) => {
      if (cards.length > 1 && isValidPlay(cards[0], gameState.pileTopValue, gameState)) {
        moves.push({
          type: 'playCards', 
          cards,
          from: 'hand'
        })
      }
    })
  }
  
  // Face-up cards (only if hand is empty)
  else if (player.faceUp.length > 0) {
    for (const card of player.faceUp) {
      if (isValidPlay(card, gameState.pileTopValue, gameState)) {
        moves.push({
          type: 'playCards',
          cards: [card],
          from: 'faceUp'
        })
      }
    }
  }
  
  // Blind cards (only if hand and face-up are empty)
  else if (player.blind.length > 0) {
    // For blind cards, we can only try to play them (no validation possible)
    moves.push({
      type: 'playCards',
      cards: [player.blind[0]], // Just pick the first one
      from: 'blind'
    })
  }
  
  // If no valid plays, must take pile
  if (moves.length === 0) {
    moves.push({
      type: 'takePile'
    })
  }
  
  return moves
}