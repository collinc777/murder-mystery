// src/components/GameRoom.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { TestControls } from './TestControls'

type Game = Database['public']['Tables']['games']['Row']
type Player = Database['public']['Tables']['players']['Row']

interface GameRoomProps {
  gameId: string
  playerName: string
  onLeaveGame: () => void
  testMode?: boolean
}

// Add these arrays at the top level for name generation
const ADJECTIVES = ['Happy', 'Sleepy', 'Grumpy', 'Silly', 'Clever', 'Sneaky', 'Lucky', 'Clumsy', 'Brave', 'Shy']
const NOUNS = ['Penguin', 'Dragon', 'Unicorn', 'Panda', 'Fox', 'Wolf', 'Bear', 'Tiger', 'Lion', 'Rabbit']

// Replace the TEST_PLAYERS constant with this function
function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(Math.random() * 100)
  return `${adjective}${noun}${number}`
}

// Add this constant at the top with other constants
const MAX_PLAYERS = 20

export function GameRoom({ gameId, playerName, onLeaveGame, testMode = false }: GameRoomProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  useEffect(() => {
    // Add this at the start of your useEffect
    const channel = supabase.channel('test')
    channel
      .subscribe(status => {
        console.log('Realtime subscription status:', status)
      })

    // Load initial game data
    const loadGame = async () => {
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()
      
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)

      const { data: currentPlayerData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .eq('name', playerName)
        .single()

      setGame(gameData)
      setPlayers(playersData || [])
      setCurrentPlayer(currentPlayerData)
    }

    loadGame()

    // Subscribe to game changes
    const gameSubscription = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          setGame(payload.new as Game)
        }
      )
      .subscribe()

    // Subscribe to player changes with improved handling
    const playerSubscription = supabase
      .channel(`players-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        (payload: any) => {
          console.log('Received player change:', {
            eventType: payload.eventType,
            old: payload.old,
            new: payload.new
          })
          
          switch (payload.eventType) {
            case 'INSERT': {
              const newPlayer = payload.new as Player
              setPlayers(prev => {
                // Check if player already exists
                if (prev.some(p => p.id === newPlayer.id)) {
                  return prev
                }
                return [...prev, newPlayer]
              })
              break
            }
            case 'UPDATE': {
              const updatedPlayer = payload.new as Player
              console.log('Processing player update:', {
                id: updatedPlayer.id,
                name: updatedPlayer.name,
                acknowledged: updatedPlayer.acknowledged
              })
              
              setPlayers(prev => {
                const newPlayers = prev.map(p => 
                  p.id === updatedPlayer.id ? updatedPlayer : p
                )
                console.log('Players after update:', 
                  newPlayers.map(p => ({
                    id: p.id,
                    name: p.name,
                    acknowledged: p.acknowledged
                  }))
                )
                return newPlayers
              })
              
              if (updatedPlayer.name === playerName) {
                console.log('Updating current player:', updatedPlayer)
                setCurrentPlayer(updatedPlayer)
              }
              break
            }
            case 'DELETE': {
              setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
              break
            }
          }
        }
      )
      .subscribe()

    return () => {
      gameSubscription.unsubscribe()
      playerSubscription.unsubscribe()
      channel.unsubscribe()
    }
  }, [gameId, playerName])

  // Update handleStartSelection with better feedback and logging
  const handleStartSelection = async () => {
    if (!currentPlayer?.is_host) return
    
    if (players.length < 4) {
      alert('Need at least 4 players to start!')
      return
    }
    
    try {
      console.log('Starting selection phase...')
      
      // Remove unused game variable
      const { error: gameError } = await supabase
        .from('games')
        .update({ status: 'SELECTING' })
        .eq('id', gameId)

      if (gameError) {
        console.error('Error updating game status:', gameError)
        alert('Error updating game status!')
        return
      }
      
      console.log('Game status updated to SELECTING')

      // Reset all players
      const { error: resetError } = await supabase
        .from('players')
        .update({ 
          acknowledged: false,
          is_poisoner: false
        })
        .eq('game_id', gameId)

      if (resetError) {
        console.error('Error resetting players:', resetError)
        alert('Error resetting players!')
        return
      }
      
      console.log('Players reset successfully')

      // Randomly select a poisoner
      const randomIndex = Math.floor(Math.random() * players.length)
      const selectedPoisoner = players[randomIndex]
      
      console.log('Selected poisoner:', selectedPoisoner.name)
      
      const { error: poisonerError } = await supabase
        .from('players')
        .update({ is_poisoner: true })
        .eq('id', selectedPoisoner.id)

      if (poisonerError) {
        console.error('Error setting poisoner:', poisonerError)
        alert('Error selecting poisoner!')
        return
      }

      console.log('Selection phase started successfully!')
      alert('Selection phase started! A poisoner has been chosen.')

    } catch (error) {
      console.error('Error in handleStartSelection:', error)
      alert('Error starting selection phase!')
    }
  }

  // Update the handleAcknowledge function
  const handleAcknowledge = async () => {
    if (!currentPlayer) return
    
    try {
      console.log('Acknowledging role...')
      
      // Remove local state updates since realtime will handle it
      const { error } = await supabase
        .from('players')
        .update({ acknowledged: true })
        .eq('id', currentPlayer.id)

      if (error) {
        console.error('Error acknowledging role:', error)
        alert('Failed to acknowledge role!')
      }
    } catch (error) {
      console.error('Error in handleAcknowledge:', error)
      alert('Error acknowledging role!')
    }
  }

  // Update the handleAddTestPlayers function
  const handleAddTestPlayers = async () => {
    if (!currentPlayer?.is_host) return
    
    const availableSlots = MAX_PLAYERS - players.length
    if (availableSlots <= 0) {
      alert('Game room is at maximum capacity!')
      return
    }
    
    try {
      const testPlayers = Array.from({ length: Math.min(19, availableSlots) }, () => ({
        game_id: gameId,
        name: generateRandomName(),
        is_host: false,
        acknowledged: false,
        is_poisoner: false
      }))
      
      // Remove local state update since realtime will handle it
      const { error } = await supabase
        .from('players')
        .insert(testPlayers)
        .select()
      
      if (error) {
        console.error('Error adding players:', error)
      }

      // Update player count in game
      await supabase
        .from('games')
        .update({ player_count: players.length + testPlayers.length })
        .eq('id', gameId)

    } catch (error) {
      console.error('Error in handleAddTestPlayers:', error)
    }
  }

  // Render different content based on game state
  const renderGameContent = () => {
    switch (game?.status) {
      case 'LOBBY':
        return (
          <div className="space-y-4">
            {currentPlayer?.is_host && (
              <>
                <button
                  onClick={handleAddTestPlayers}
                  disabled={players.length >= MAX_PLAYERS}
                  className="w-full p-2 bg-gray-500 text-white rounded disabled:opacity-50"
                >
                  Add Test Players
                </button>
                <button
                  onClick={handleStartSelection}
                  disabled={players.length < 4}
                  className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  Start Selection Phase
                  {players.length < 4 && " (Need at least 4 players)"}
                </button>
              </>
            )}
          </div>
        )

      case 'SELECTING':
        return (
          <div className="space-y-4">
            {currentPlayer && !currentPlayer.acknowledged && (
              <div className="p-4 border rounded bg-yellow-50">
                <p className="font-bold mb-2">
                  {currentPlayer.is_poisoner 
                    ? "🎭 You are the poisoner! Try to remain undetected."
                    : "You are not the poisoner. Try to identify who is!"
                  }
                </p>
                <button
                  onClick={handleAcknowledge}
                  className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-700"
                >
                  I Understand My Role
                </button>
              </div>
            )}
            
            {currentPlayer?.acknowledged && (
              <div className="p-4 border rounded bg-green-50">
                <p className="font-bold text-green-800">
                  {currentPlayer.is_poisoner 
                    ? "Remember: You are the poisoner!"
                    : "Remember: You are not the poisoner!"
                  }
                </p>
              </div>
            )}
            
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-lg font-semibold">
                Waiting for players to acknowledge their roles...
              </p>
              <p className="text-2xl mt-2">
                {players.filter(p => p.acknowledged).length} of {players.length} ready
              </p>
            </div>

            {currentPlayer?.is_host && players.every(p => p.acknowledged) && (
              <button
                onClick={() => {
                  supabase
                    .from('games')
                    .update({ status: 'ACTIVE' })
                    .eq('id', gameId)
                }}
                className="w-full p-2 bg-blue-500 text-white rounded"
              >
                Start Game
              </button>
            )}
          </div>
        )

      case 'ACTIVE':
        return (
          <div className="p-4 text-center">
            <h2 className="text-xl font-bold">Game in Progress</h2>
            {/* We'll implement the actual game UI later */}
          </div>
        )

      default:
        return null
    }
  }

  if (!game || !currentPlayer) return <div>Loading...</div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {testMode && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded text-center font-bold">
          🔧 TEST MODE ACTIVE 🔧
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Game Room</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm space-x-4">
            {/* Add player count indicator */}
            <span className={`${players.length >= MAX_PLAYERS ? 'text-red-500 font-bold' : ''}`}>
              Players: {players.length}/{MAX_PLAYERS}
            </span>
            <span>
              Game ID: <span className="font-mono">{gameId}</span>
            </span>
          </div>
          <button
            onClick={onLeaveGame}
            className="px-2 py-1 text-sm bg-red-500 text-white rounded"
          >
            Leave Game
          </button>
        </div>
      </div>

      {players.length >= MAX_PLAYERS && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          Game room is at maximum capacity
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Players</h2>
        <div className="grid grid-cols-2 gap-2">
          {players.map(player => (
            <div 
              key={player.id}
              className={`p-2 border rounded flex justify-between items-center
                ${game.status === 'SELECTING' && player.acknowledged ? 'bg-green-50' : ''}
              `}
            >
              <span>
                {player.name} 
                {player.is_host ? ' (Host)' : ''}
              </span>
              {player.acknowledged && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {renderGameContent()}

      {testMode && game && (
        <TestControls 
          game={game}
          players={players}
          gameId={gameId}
          setPlayers={setPlayers}
        />
      )}
    </div>
  )
}
