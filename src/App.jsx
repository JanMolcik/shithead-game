import React, { useState } from 'react'
import { useGameState } from './client/hooks/useGameState.js'
import GameBoard from './client/components/GameBoard.jsx'
import { AI_DIFFICULTY } from './shared/constants.js'

function App() {
  const [gameMode, setGameMode] = useState('menu')
  const [selectedCards, setSelectedCards] = useState([])
  const [gameConfig, setGameConfig] = useState({
    aiDifficulty: 'medium',
    aiCount: 1
  })
  
  const {
    gameState,
    isLoading,
    error,
    initializeGame,
    swapCards,
    startMainGame,
    playCards,
    takePile,
    selectJokerTarget,
    resetGame,
    canPlayCards,
    isHumanTurn
  } = useGameState()

  // Handle starting a new single-player game
  const handleStartGame = async () => {
    const config = {
      playerCount: parseInt(gameConfig.aiCount) + 1, // +1 for human
      aiDifficulties: Array(parseInt(gameConfig.aiCount)).fill(gameConfig.aiDifficulty),
      humanPlayerId: 0
    }
    
    await initializeGame(config)
  }

  // Handle card selection
  const handleCardClick = (card) => {
    if (!isHumanTurn) return

    if (gameState?.phase === 'setup') {
      // Handle card swapping during setup
      // This would need more complex logic to determine swap
      console.log('Setup phase - implement card swapping')
      return
    }

    // Toggle card selection
    setSelectedCards(prev => 
      prev.includes(card) 
        ? prev.filter(c => c !== card)
        : [...prev, card]
    )
  }

  // Handle playing selected cards
  const handlePlayCards = () => {
    if (selectedCards.length === 0 || !canPlayCards(selectedCards)) return

    // Determine which collection the cards come from
    const humanPlayer = gameState?.players?.[0]
    let fromCollection = 'hand'
    
    if (humanPlayer?.hand.length === 0) {
      fromCollection = 'faceUp'
    } else if (humanPlayer?.hand.length === 0 && humanPlayer?.faceUp.length === 0) {
      fromCollection = 'blind'
    }

    playCards(selectedCards, fromCollection)
    setSelectedCards([])
  }

  // Handle taking the pile
  const handleTakePile = () => {
    takePile()
    setSelectedCards([])
  }

  // Handle Joker target selection
  const handleJokerTarget = (targetPlayerId) => {
    selectJokerTarget(targetPlayerId)
  }

  // Handle finishing setup phase
  const handleStartMainGame = () => {
    startMainGame()
  }

  // Handle game reset
  const handleResetGame = () => {
    resetGame()
    setSelectedCards([])
    setGameMode('menu')
  }

  return (
    <div className="min-h-screen bg-table-green">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-white">Processing...</p>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameMode === 'menu' && (
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Shithead Card Game</h1>
            <p className="text-green-200">The classic card shedding game</p>
          </header>

          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Choose Game Mode</h2>
            
            <div className="space-y-4">
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={() => setGameMode('single-player')}
              >
                Single Player (vs AI)
              </button>
              
              <button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                onClick={() => setGameMode('multiplayer')}
              >
                Multiplayer Online (Coming Soon)
              </button>
              
              <button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                onClick={() => setGameMode('local')}
              >
                Local Multiplayer (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Player Setup */}
      {gameMode === 'single-player' && !gameState && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Single Player Setup</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-white">AI Difficulty</label>
              <select 
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                value={gameConfig.aiDifficulty}
                onChange={(e) => setGameConfig(prev => ({ ...prev, aiDifficulty: e.target.value }))}
              >
                <option value="easy">Easy - Basic strategy</option>
                <option value="medium">Medium - Smart plays</option>
                <option value="hard">Hard - Advanced tactics</option>
                <option value="expert">Expert - MCTS AI (Coming Soon)</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-white">Number of AI Opponents</label>
              <select 
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                value={gameConfig.aiCount}
                onChange={(e) => setGameConfig(prev => ({ ...prev, aiCount: e.target.value }))}
              >
                <option value="1">1 AI Player</option>
                <option value="2">2 AI Players</option>
                <option value="3">3 AI Players</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={handleStartGame}
                disabled={isLoading}
              >
                Start Game
              </button>
              <button 
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={() => setGameMode('menu')}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Phase */}
      {gameMode === 'single-player' && gameState?.phase === 'setup' && (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Setup Phase</h2>
            <p className="text-green-200">Arrange your cards, then start the game</p>
          </div>

          <GameBoard
            gameState={gameState}
            selectedCards={selectedCards}
            onCardClick={handleCardClick}
          />

          <div className="text-center mt-6">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              onClick={handleStartMainGame}
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Main Game */}
      {gameMode === 'single-player' && gameState?.phase === 'mainPlay' && (
        <div>
          {/* Game Header */}
          <div className="bg-black/30 p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-xl font-bold">Shithead Game</h2>
                <p className="text-sm text-white/70">Turn: Player {gameState.currentPlayer + 1}</p>
              </div>
              <div className="space-x-4">
                <button
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  onClick={handleResetGame}
                >
                  New Game
                </button>
              </div>
            </div>
          </div>

          <GameBoard
            gameState={gameState}
            selectedCards={selectedCards}
            onCardClick={handleCardClick}
            onPlayCards={handlePlayCards}
            onTakePile={handleTakePile}
            onJokerTarget={handleJokerTarget}
          />
        </div>
      )}

      {/* Game Finished */}
      {gameMode === 'single-player' && gameState?.phase === 'endGame' && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
            
            {gameState.winner === '0' ? (
              <div className="mb-6">
                <p className="text-green-400 text-xl font-bold mb-2">🎉 You Win!</p>
                <p className="text-white/80">Congratulations! You got rid of all your cards first.</p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-red-400 text-xl font-bold mb-2">💀 You're the Shithead!</p>
                <p className="text-white/80">Better luck next time!</p>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={handleStartGame}
              >
                Play Again
              </button>
              <button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={handleResetGame}
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modes */}
      {(gameMode === 'multiplayer' || gameMode === 'local') && (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-white text-xl mb-4">Coming soon!</p>
            <button 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              onClick={() => setGameMode('menu')}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App