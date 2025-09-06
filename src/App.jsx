import React, { useState } from 'react'

function App() {
  const [gameMode, setGameMode] = useState('menu')

  return (
    <div className="min-h-screen bg-table-green">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Shithead Card Game</h1>
          <p className="text-green-200">The classic card shedding game</p>
        </header>

        {gameMode === 'menu' && (
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
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={() => setGameMode('multiplayer')}
              >
                Multiplayer Online
              </button>
              
              <button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                onClick={() => setGameMode('local')}
              >
                Local Multiplayer
              </button>
            </div>
          </div>
        )}

        {gameMode === 'single-player' && (
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Single Player Setup</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">AI Difficulty</label>
              <select className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white">
                <option value="easy">Easy - Basic strategy</option>
                <option value="medium">Medium - Smart plays</option>
                <option value="hard">Hard - Advanced tactics</option>
                <option value="expert">Expert - MCTS AI</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Number of AI Opponents</label>
              <select className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white">
                <option value="1">1 AI Player</option>
                <option value="2">2 AI Players</option>
                <option value="3">3 AI Players</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
        )}

        {gameMode !== 'menu' && gameMode !== 'single-player' && (
          <div className="text-center">
            <p className="text-white text-xl mb-4">Coming soon!</p>
            <button 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              onClick={() => setGameMode('menu')}
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App