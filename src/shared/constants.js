// Game constants
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  CARDS_PER_PLAYER: 9,
  HAND_SIZE: 3,
  FACE_UP_SIZE: 3,
  BLIND_SIZE: 3,
}

// Card values and hierarchy
export const CARD_VALUES = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
}

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
export const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

// Magic cards
export const MAGIC_CARDS = {
  '2': 'reset',      // Reset pile value to 2
  '7': 'lower',      // Next player must play 7 or lower  
  '8': 'invisible',  // Skip to card below this 8
  '10': 'burn',      // Clear entire pile
  'J': 'reverse',    // Reverse turn order + invisible
  'Joker': 'force'   // Force any player to take pile
}

// Game phases
export const GAME_PHASES = {
  SETUP: 'setup',
  MAIN_PLAY: 'mainPlay', 
  END_GAME: 'endGame'
}

// AI difficulty levels
export const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium', 
  HARD: 'hard',
  EXPERT: 'expert'
}

// AI scoring constants
export const AI_SCORES = {
  IMMEDIATE_WIN: 1000,
  FORCED_PLAY: 900,
  MULTI_CARD_BONUS: 15,
  MAGIC_CARD_BASE: 25,
  PILE_SIZE_MULTIPLIER: 1.5,
  HIGH_VALUE_MULTIPLIER: 2,
  NEAR_WINNER_BONUS: 20
}