import React from 'react'
import { getCardRank, getCardSuit, getMagicCardType } from '../../engine/game-utils.js'

/**
 * Individual card component with styling and animations
 */
const Card = ({ 
  card, 
  isSelected = false, 
  isHidden = false,
  isPlayable = true,
  size = 'normal', // 'small', 'normal', 'large'
  onClick,
  className = '',
  ...props 
}) => {
  if (!card || card === 'hidden') {
    return (
      <div 
        className={`card card-back ${size} ${className}`}
        {...props}
      >
        <div className="card-back-pattern"></div>
      </div>
    )
  }

  const rank = getCardRank(card)
  const suit = getCardSuit(card)
  const magicType = getMagicCardType(card)
  
  // Determine card color
  const isRed = suit === 'hearts' || suit === 'diamonds'
  const colorClass = isRed ? 'red' : 'black'
  
  // Get display symbols
  const suitSymbol = getSuitSymbol(suit)
  const rankDisplay = getRankDisplay(rank)
  
  // Build CSS classes
  const cardClasses = [
    'card',
    size,
    colorClass,
    isSelected && 'selected',
    !isPlayable && 'disabled',
    magicType && 'magic-card',
    magicType && `magic-${magicType}`,
    onClick && 'clickable',
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={cardClasses}
      onClick={onClick && isPlayable ? () => onClick(card) : undefined}
      {...props}
    >
      <div className="card-content">
        <div className="card-corner top-left">
          <div className="card-rank">{rankDisplay}</div>
          <div className="card-suit">{suitSymbol}</div>
        </div>
        
        <div className="card-center">
          {magicType ? (
            <div className="magic-symbol">
              {getMagicSymbol(magicType)}
            </div>
          ) : (
            <div className="suit-symbol large">
              {suitSymbol}
            </div>
          )}
        </div>
        
        <div className="card-corner bottom-right">
          <div className="card-rank inverted">{rankDisplay}</div>
          <div className="card-suit inverted">{suitSymbol}</div>
        </div>
      </div>
      
      {magicType && (
        <div className="magic-indicator">
          <span className="magic-text">{getMagicText(magicType)}</span>
        </div>
      )}
    </div>
  )
}

// Helper functions
const getSuitSymbol = (suit) => {
  switch (suit) {
    case 'hearts': return '♥'
    case 'diamonds': return '♦'
    case 'clubs': return '♣'
    case 'spades': return '♠'
    case 'red': return '🃏' // Joker
    case 'black': return '🃏' // Joker
    default: return '?'
  }
}

const getRankDisplay = (rank) => {
  switch (rank) {
    case 'Joker': return 'JO'
    case 'A': return 'A'
    case 'K': return 'K'
    case 'Q': return 'Q'
    case 'J': return 'J'
    case '10': return '10'
    default: return rank
  }
}

const getMagicSymbol = (magicType) => {
  switch (magicType) {
    case 'reset': return '↻' // 2
    case 'lower': return '↓' // 7  
    case 'invisible': return '👻' // 8
    case 'burn': return '🔥' // 10
    case 'reverse': return '↔' // J
    case 'force': return '⚡' // Joker
    default: return '✨'
  }
}

const getMagicText = (magicType) => {
  switch (magicType) {
    case 'reset': return 'Reset'
    case 'lower': return 'Lower'
    case 'invisible': return 'Skip'
    case 'burn': return 'Burn'
    case 'reverse': return 'Reverse'
    case 'force': return 'Force'
    default: return 'Magic'
  }
}

// Card collection component for multiple cards
export const CardCollection = ({ 
  cards = [], 
  selectedCards = [], 
  onCardClick,
  layout = 'spread', // 'spread', 'stack', 'grid'
  size = 'normal',
  className = '',
  ...props 
}) => {
  const collectionClasses = [
    'card-collection',
    `layout-${layout}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={collectionClasses} {...props}>
      {cards.map((card, index) => (
        <Card
          key={`${card}-${index}`}
          card={card}
          isSelected={selectedCards.includes(card)}
          onClick={onCardClick}
          size={size}
          style={{ 
            '--card-index': index,
            '--total-cards': cards.length 
          }}
        />
      ))}
    </div>
  )
}

export default Card