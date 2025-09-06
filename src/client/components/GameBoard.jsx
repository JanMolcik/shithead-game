import React, { useState } from 'react'
import Card, { CardCollection } from './Card.jsx'

/**
 * Main game board component showing all players and the center pile
 */
const GameBoard = ({
  gameState,
  selectedCards = [],
  onCardClick,
  onPlayCards,
  onTakePile,
  onJokerTarget,
  className = ''
}) => {
  const [hoveredPlayer, setHoveredPlayer] = useState(null)

  if (!gameState) return null

  const { players, playPile, pileTopValue, currentPlayer, pendingJokerTarget } = gameState
  const humanPlayer = players[0]
  const aiPlayers = Object.entries(players).filter(([id]) => id !== '0')

  return (
    <div className={`game-board min-h-screen p-4 ${className}`}>
      {/* AI Players Area - Top */}
      <div className="ai-players-area mb-6">
        <div className="flex justify-center gap-8">
          {aiPlayers.map(([playerId, player]) => (
            <AIPlayerArea 
              key={playerId}
              playerId={playerId}
              player={player}
              isCurrentTurn={currentPlayer == playerId}
              canTarget={pendingJokerTarget && playerId !== currentPlayer.toString()}
              onTarget={() => onJokerTarget?.(parseInt(playerId))}
              onHover={setHoveredPlayer}
            />
          ))}
        </div>
      </div>

      {/* Center Play Area */}
      <div className="center-area flex justify-center items-center gap-8 my-8">
        {/* Deck */}
        <div className="deck-area text-center">
          <div className="pile">
            {gameState.deck.length > 0 ? (
              <Card card="hidden" size="normal" />
            ) : (
              <div className="text-gray-500 text-sm">Empty</div>
            )}
          </div>
          <p className="text-white text-sm mt-2">Deck: {gameState.deck.length}</p>
        </div>

        {/* Play Controls - Center */}
        <div className="play-controls text-center flex flex-col items-center gap-4">
          {/* Play Pile */}
          <div className="play-pile-area">
            <div className={`pile ${playPile.length > 0 ? 'has-cards' : ''}`}>
              {playPile.length > 0 ? (
                <div className="relative">
                  {playPile.slice(-3).map((card, index) => (
                    <Card 
                      key={`pile-${index}`}
                      card={card}
                      size="normal"
                      style={{
                        position: index < 2 ? 'absolute' : 'relative',
                        transform: `translate(${index * 2}px, ${index * -2}px) rotate(${index * 3}deg)`,
                        zIndex: index
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Play cards here</div>
              )}
            </div>
            <p className="text-white text-sm mt-2">
              Pile: {playPile.length} | Top: {pileTopValue}
            </p>
          </div>

          {/* Action Buttons */}
          {gameState.phase === 'playing' && currentPlayer === 0 && (
            <div className="action-buttons flex gap-3">
              <button
                className={`font-bold py-3 px-6 rounded-lg transition-all duration-200 ${
                  selectedCards.length > 0 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                    : 'bg-gray-500 cursor-not-allowed text-gray-300'
                }`}
                onClick={onPlayCards}
                disabled={selectedCards.length === 0}
              >
                {selectedCards.length > 0 
                  ? `Play ${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''}` 
                  : 'Select Cards'
                }
              </button>
              
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg"
                onClick={onTakePile}
              >
                Take Pile
              </button>
            </div>
          )}

          {pendingJokerTarget && currentPlayer === 0 && (
            <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-4 text-center">
              <p className="text-yellow-300 font-medium mb-2">🃏 Joker Played!</p>
              <p className="text-white text-sm">Click an opponent to force them to take the pile</p>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="game-info bg-white/10 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="text-white font-bold mb-2">Game Status</h3>
          <div className="space-y-1 text-sm text-white/80">
            <p>Current Turn: Player {currentPlayer + 1}</p>
            <p>Phase: {gameState.phase}</p>
            {selectedCards.length > 0 && (
              <p className="text-green-400 font-medium">
                Selected: {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Human Player Area - Bottom */}
      <div className="human-player-area mt-6">
        <HumanPlayerArea 
          player={humanPlayer}
          isCurrentTurn={currentPlayer === 0}
          selectedCards={selectedCards}
          onCardClick={onCardClick}
          onPlayCards={onPlayCards}
          onTakePile={onTakePile}
          gamePhase={gameState.phase}
        />
      </div>
    </div>
  )
}

/**
 * Human player area with all three card collections
 */
const HumanPlayerArea = ({
  player,
  isCurrentTurn,
  selectedCards,
  onCardClick,
  onPlayCards,
  onTakePile,
  gamePhase
}) => {
  const hasValidMoves = selectedCards.length > 0
  const totalCards = player.hand.length + player.faceUp.length + player.blind.length

  return (
    <div className={`player-area human ${isCurrentTurn ? 'current-turn' : ''}`}>
      <div className="text-center mb-4">
        <h3 className="text-white font-bold text-lg">Your Cards ({totalCards})</h3>
        {isCurrentTurn && (
          <p className="text-yellow-400 text-sm font-medium">Your Turn!</p>
        )}
      </div>

      {/* Setup Phase - Allow card swapping */}
      {gamePhase === 'setup' && (
        <div className="setup-instructions bg-blue-500/20 p-4 rounded-lg mb-4">
          <p className="text-white text-center">
            Click cards to swap between hand and face-up collections
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Hand Cards */}
        {player.hand.length > 0 && (
          <div className="hand-cards">
            <h4 className="text-white/80 text-sm mb-2 text-center">Hand</h4>
            <CardCollection
              cards={player.hand}
              selectedCards={selectedCards}
              onCardClick={onCardClick}
              layout="spread"
              size="normal"
              className="justify-center"
            />
          </div>
        )}

        {/* Face-up Cards */}
        {player.faceUp.length > 0 && (
          <div className="face-up-cards">
            <h4 className="text-white/80 text-sm mb-2 text-center">Face-up</h4>
            <CardCollection
              cards={player.faceUp}
              selectedCards={selectedCards}
              onCardClick={onCardClick}
              layout="spread"
              size="normal"
              className="justify-center"
            />
          </div>
        )}

        {/* Blind Cards */}
        {player.blind.length > 0 && (
          <div className="blind-cards">
            <h4 className="text-white/80 text-sm mb-2 text-center">Blind</h4>
            <CardCollection
              cards={player.blind.map(() => 'hidden')}
              selectedCards={selectedCards}
              onCardClick={player.hand.length === 0 && player.faceUp.length === 0 ? onCardClick : undefined}
              layout="spread"
              size="normal"
              className="justify-center"
            />
          </div>
        )}
      </div>

      {/* Instructions for player */}
      {gamePhase === 'playing' && isCurrentTurn && (
        <div className="instructions text-center mt-4">
          <p className="text-white/80 text-sm">
            {selectedCards.length > 0 
              ? `Selected ${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''} - use center button to play`
              : 'Click cards to select them, then play using the center button'
            }
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * AI player area showing their cards and status
 */
const AIPlayerArea = ({
  playerId,
  player,
  isCurrentTurn,
  canTarget,
  onTarget,
  onHover
}) => {
  const totalCards = player.hand.length + player.faceUp.length + player.blind.length
  const difficulty = 'Medium' // TODO: Get from AI player config

  return (
    <div 
      className={`player-area ai ${isCurrentTurn ? 'current-turn' : ''} ${canTarget ? 'cursor-pointer hover:ring-4 hover:ring-red-400' : ''}`}
      onClick={canTarget ? onTarget : undefined}
      onMouseEnter={() => onHover?.(playerId)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="text-center mb-3">
        <h4 className="text-white font-medium">AI Player {parseInt(playerId) + 1}</h4>
        <p className="text-white/60 text-xs">{difficulty} • {totalCards} cards</p>
        {isCurrentTurn && (
          <p className="text-yellow-400 text-xs font-medium">Thinking...</p>
        )}
        {canTarget && (
          <p className="text-red-400 text-xs font-medium">Click to target!</p>
        )}
      </div>

      <div className="space-y-2">
        {/* Hand Cards (hidden) */}
        {player.hand.length > 0 && (
          <div className="flex justify-center">
            <CardCollection
              cards={player.hand}
              layout="stack" 
              size="small"
            />
          </div>
        )}

        {/* Face-up Cards */}
        {player.faceUp.length > 0 && (
          <div className="flex justify-center">
            <CardCollection
              cards={player.faceUp}
              layout="spread"
              size="small"
            />
          </div>
        )}

        {/* Blind Cards */}
        {player.blind.length > 0 && (
          <div className="flex justify-center">
            <CardCollection
              cards={player.blind}
              layout="stack"
              size="small"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default GameBoard