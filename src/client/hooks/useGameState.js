import { useState, useCallback, useRef } from 'react'
import { ShitheadEngine } from '../../engine/game-engine.js'
import { AIPlayer } from '../../ai/heuristic-ai.js'
import { AI_DIFFICULTY } from '../../shared/constants.js'

/**
 * React hook for managing game state and engine integration
 */
export const useGameState = () => {
  const gameEngineRef = useRef(null)
  const aiPlayersRef = useRef({})
  
  const [gameState, setGameState] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gameMode, setGameMode] = useState('menu') // 'menu', 'setup', 'playing', 'finished'

  // Initialize a new game
  const initializeGame = useCallback(async (config) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { playerCount = 2, aiDifficulties = ['medium'], humanPlayerId = 0 } = config
      
      // Create game engine
      gameEngineRef.current = new ShitheadEngine(playerCount)
      
      // Initialize AI players
      aiPlayersRef.current = {}
      for (let i = 0; i < playerCount; i++) {
        if (i !== humanPlayerId) {
          const difficulty = aiDifficulties[i - (i > humanPlayerId ? 1 : 0)] || AI_DIFFICULTY.MEDIUM
          aiPlayersRef.current[i] = new AIPlayer(difficulty, i)
        }
      }
      
      // Get initial game state
      const initialState = gameEngineRef.current.getPlayerView(humanPlayerId)
      setGameState(initialState)
      setGameMode('setup')
      
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Swap cards during setup phase
  const swapCards = useCallback((handCard, faceUpCard) => {
    try {
      if (!gameEngineRef.current || !gameState) return
      
      const humanPlayerId = 0 // Assuming human is always player 0
      gameEngineRef.current.swapCards(humanPlayerId, handCard, faceUpCard)
      
      const updatedState = gameEngineRef.current.getPlayerView(humanPlayerId)
      setGameState(updatedState)
      
    } catch (err) {
      setError(err.message)
    }
  }, [gameState])

  // Start main game after setup
  const startMainGame = useCallback(() => {
    try {
      if (!gameEngineRef.current) return
      
      gameEngineRef.current.startMainGame()
      const updatedState = gameEngineRef.current.getPlayerView(0)
      setGameState(updatedState)
      setGameMode('playing')
      
      // If AI goes first, process their turn
      if (updatedState.currentPlayer !== 0) {
        processAITurn(updatedState.currentPlayer)
      }
      
    } catch (err) {
      setError(err.message)
    }
  }, [])

  // Process AI turn
  const processAITurn = useCallback(async (playerId) => {
    try {
      if (!gameEngineRef.current || !aiPlayersRef.current[playerId]) return
      
      setIsLoading(true)
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const aiPlayer = aiPlayersRef.current[playerId]
      const currentState = gameEngineRef.current.getGameState()
      
      // Handle Joker target selection if pending
      if (currentState.pendingJokerTarget && currentState.jokerPlayerId === playerId) {
        const target = aiPlayer.selectJokerTarget(currentState)
        gameEngineRef.current.selectJokerTarget(playerId, target)
      } else {
        // Get AI move
        const move = await aiPlayer.getMove(currentState)
        
        if (move.type === 'playCards') {
          gameEngineRef.current.playCards(playerId, move.cards, move.from)
        } else if (move.type === 'takePile') {
          gameEngineRef.current.takePile(playerId)
        }
      }
      
      // Update game state
      const updatedState = gameEngineRef.current.getPlayerView(0)
      setGameState(updatedState)
      
      // Check for game end
      if (updatedState.phase === 'endGame') {
        setGameMode('finished')
        setIsLoading(false)
        return
      }
      
      // Continue AI turns if needed
      if (updatedState.currentPlayer !== 0 && !updatedState.pendingJokerTarget) {
        processAITurn(updatedState.currentPlayer)
      } else {
        setIsLoading(false)
      }
      
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }, [])

  // Human player plays cards
  const playCards = useCallback(async (cards, fromCollection) => {
    try {
      if (!gameEngineRef.current || gameState.currentPlayer !== 0) return
      
      setError(null)
      gameEngineRef.current.playCards(0, cards, fromCollection)
      
      const updatedState = gameEngineRef.current.getPlayerView(0)
      setGameState(updatedState)
      
      // Check for game end
      if (updatedState.phase === 'endGame') {
        setGameMode('finished')
        return
      }
      
      // Process AI turns
      if (updatedState.currentPlayer !== 0 && !updatedState.pendingJokerTarget) {
        processAITurn(updatedState.currentPlayer)
      }
      
    } catch (err) {
      setError(err.message)
    }
  }, [gameState, processAITurn])

  // Human player takes pile
  const takePile = useCallback(async () => {
    try {
      if (!gameEngineRef.current || gameState.currentPlayer !== 0) return
      
      setError(null)
      gameEngineRef.current.takePile(0)
      
      const updatedState = gameEngineRef.current.getPlayerView(0)
      setGameState(updatedState)
      
      // Process AI turns
      if (updatedState.currentPlayer !== 0) {
        processAITurn(updatedState.currentPlayer)
      }
      
    } catch (err) {
      setError(err.message)
    }
  }, [gameState, processAITurn])

  // Human selects Joker target
  const selectJokerTarget = useCallback(async (targetPlayerId) => {
    try {
      if (!gameEngineRef.current || !gameState.pendingJokerTarget) return
      
      setError(null)
      gameEngineRef.current.selectJokerTarget(0, targetPlayerId)
      
      const updatedState = gameEngineRef.current.getPlayerView(0)
      setGameState(updatedState)
      
      // Continue human turn or process AI turns
      if (updatedState.currentPlayer !== 0) {
        processAITurn(updatedState.currentPlayer)
      }
      
    } catch (err) {
      setError(err.message)
    }
  }, [gameState, processAITurn])

  // Get valid moves for human player
  const getValidMoves = useCallback(() => {
    if (!gameEngineRef.current || !gameState || gameState.currentPlayer !== 0) {
      return []
    }
    
    return gameEngineRef.current.getValidMoves(0)
  }, [gameState])

  // Check if cards can be played
  const canPlayCards = useCallback((cards) => {
    if (!gameEngineRef.current || !gameState || gameState.currentPlayer !== 0) {
      return false
    }
    
    return gameEngineRef.current.canPlay(0, cards)
  }, [gameState])

  // Reset game
  const resetGame = useCallback(() => {
    gameEngineRef.current = null
    aiPlayersRef.current = {}
    setGameState(null)
    setGameMode('menu')
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    // State
    gameState,
    gameMode,
    isLoading,
    error,
    
    // Actions
    initializeGame,
    swapCards,
    startMainGame,
    playCards,
    takePile,
    selectJokerTarget,
    resetGame,
    
    // Helpers
    getValidMoves,
    canPlayCards,
    
    // Computed
    isHumanTurn: gameState?.currentPlayer === 0,
    humanPlayer: gameState?.players?.[0],
    aiPlayers: gameState?.players ? Object.fromEntries(
      Object.entries(gameState.players).filter(([id]) => id !== '0')
    ) : {},
  }
}