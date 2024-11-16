// src/components/GameRoom.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { TestControls } from './TestControls'
import confetti from 'canvas-confetti'
import { HostIndicator } from './HostIndicator'
import { TrainCarView } from './TrainCarView'
import { CHARACTERS } from '../constants/characters'
import { storage } from '../lib/storage'

type Game = Database['public']['Tables']['games']['Row']
type Player = Database['public']['Tables']['players']['Row']

interface GameRoomProps {
  gameId: string
  playerName: string
  testMode?: boolean
}

// Add this constant at the top with other constants
const MAX_PLAYERS = 20

function generateRandomName(): string {
  // Use the CHARACTERS constant to get a random character name
  const allCharacters = Object.values(CHARACTERS).flatMap(family => 
    family.members.map(member => member.name)
  )
  return allCharacters[Math.floor(Math.random() * allCharacters.length)]
}

const triggerCelebration = () => {
  // Fire multiple bursts of confetti
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 1500
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  // Fire confetti in sequence
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

export function GameRoom({ gameId, playerName, testMode = false }: GameRoomProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    // Load initial game and player data
    const loadInitialData = async () => {
      try {
        // Load game data
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single()

        if (gameError || !gameData) {
          console.error('Error loading game:', gameError)
          return
        }

        // If game is completed, clear session and return to station
        if (gameData.status === 'COMPLETED') {
          storage.clearGameSession(gameId)
          window.location.reload()
          return
        }

        setGame(gameData)

        // Load current player data
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId)
          .eq('name', playerName)
          .single()

        if (playerError || !playerData) {
          console.error('Error loading player:', playerError)
          storage.clearGameSession(gameId)
          window.location.reload()
          return
        }

        setCurrentPlayer(playerData)

        // Load all players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId)

        if (playersError) {
          console.error('Error loading players:', playersError)
          return
        }

        setPlayers(playersData || [])
      } catch (error) {
        console.error('Error in loadInitialData:', error)
      }
    }

    loadInitialData()

    // Set up subscriptions
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
        (payload: any) => {
          setGame(payload.new as Game)
        }
      )
      .subscribe()

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
        async (payload: any) => {
          switch (payload.eventType) {
            case 'INSERT': {
              // Fetch all players again to ensure we have the latest state
              const { data: playersData } = await supabase
                .from('players')
                .select('*')
                .eq('game_id', gameId)
              
              if (playersData) {
                setPlayers(playersData)
              }
              break
            }
            case 'DELETE': {
              // If current player was removed, clear session and return to station
              if (payload.old.name === playerName) {
                storage.clearGameSession(gameId)
                window.location.reload()
                return
              }
              
              // Immediately update players list for everyone else
              setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
              break
            }
            case 'UPDATE': {
              const updatedPlayer = payload.new as Player
              setPlayers(prev => prev.map(p => 
                p.id === updatedPlayer.id ? updatedPlayer : p
              ))
              if (updatedPlayer.name === playerName) {
                setCurrentPlayer(updatedPlayer)
              }
              break
            }
          }
        }
      )
      .subscribe()

    return () => {
      gameSubscription.unsubscribe()
      playerSubscription.unsubscribe()
    }
  }, [gameId, playerName])

  if (!game || !currentPlayer || !players.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-polar-gold font-holiday text-2xl">
          Boarding train...
        </div>
      </div>
    )
  }

  // Update handleStartSelection with better feedback and logging
  const handleStartSelection = async () => {
    if (!currentPlayer?.is_host) return
    
    if (players.length < 4) {
      setNotification({
        message: 'Need at least 4 players to start!',
        type: 'error'
      })
      setTimeout(() => setNotification(null), 3000)
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
        setNotification({
          message: 'Error updating game status!',
          type: 'error'
        })
        setTimeout(() => setNotification(null), 3000)
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
      setNotification({
        message: 'Selection phase started! Players will now see their roles.',
        type: 'success'
      })
      setTimeout(() => setNotification(null), 3000)

    } catch (error) {
      console.error('Error in handleStartSelection:', error)
      setNotification({
        message: 'Error starting selection phase!',
        type: 'error'
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Update the handleAcknowledge function
  const handleAcknowledge = async () => {
    if (!currentPlayer) return
    
    try {
      const { error } = await supabase
        .from('players')
        .update({ acknowledged: true })
        .eq('id', currentPlayer.id)
        .select()
        .single()

      if (error) {
        alert('Failed to acknowledge role!')
      }
    } catch (error) {
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

    } catch (error) {
      console.error('Error in handleAddTestPlayers:', error)
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) {
        setNotification({
          message: 'Failed to remove passenger',
          type: 'error'
        })
      } else {
        setNotification({
          message: 'Passenger removed from train',
          type: 'success'
        })
      }
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error in handleRemovePlayer:', error)
    }
  }

  // Render different content based on game state
  const renderGameContent = () => {
    switch (game?.status) {
      case 'LOBBY':
        return (
          <div className="space-y-4">
            <TrainCarView 
              players={players}
              currentPlayerName={playerName}
              isHost={currentPlayer?.is_host}
              gameStatus={game.status}
              onRemovePlayer={handleRemovePlayer}
            />
            {currentPlayer?.is_host && (
              <>
                {testMode && (
                  <button
                    onClick={handleAddTestPlayers}
                    disabled={players.length >= MAX_PLAYERS}
                    className="ticket-button w-full p-2 disabled:opacity-50"
                  >
                    Add Test Passengers
                  </button>
                )}
                <button
                  onClick={handleStartSelection}
                  disabled={players.length < 4}
                  className="ticket-button w-full p-2 disabled:opacity-50"
                >
                  Begin Journey
                  {players.length < 4 && " (Need at least 4 passengers)"}
                </button>
              </>
            )}
          </div>
        )

      case 'SELECTING':
        return (
          <div className="space-y-4">
            <TrainCarView 
              players={players}
              currentPlayerName={playerName}
              isHost={currentPlayer?.is_host}
              gameStatus={game.status}
            />
            
            {currentPlayer && !currentPlayer.acknowledged && (
              <div className="holiday-card p-4">
                <p className="font-holiday text-polar-gold text-lg mb-2">
                  {currentPlayer.is_poisoner 
                    ? "🎭 You are the mysterious poisoner! Stay undetected on this journey."
                    : "You are an innocent passenger. Find the poisoner among us!"
                  }
                </p>
                <button
                  onClick={handleAcknowledge}
                  className="ticket-button w-full p-2"
                >
                  Punch My Ticket
                </button>
              </div>
            )}
            
            {currentPlayer?.acknowledged && (
              <div className="holiday-card p-4">
                <p className="font-holiday text-polar-gold text-lg">
                  {currentPlayer.is_poisoner 
                    ? "Remember: You are the mysterious poisoner!"
                    : "Remember: You are an innocent passenger!"
                  }
                </p>
              </div>
            )}
            
            <div className="holiday-card p-4 text-center">
              <p className="font-holiday text-polar-gold text-lg">
                Waiting for passengers to board...
              </p>
              <p className="font-ticket text-polar-steam text-2xl mt-2">
                {players.filter(p => p.acknowledged).length} of {players.length} ready
              </p>
            </div>

            {currentPlayer?.is_host && players.every(p => p.acknowledged) && (
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from('games')
                    .update({ status: 'ACTIVE' })
                    .eq('id', gameId)
                  
                  if (!error) {
                    triggerCelebration()
                    setNotification({
                      message: '🎉 All Aboard! The journey begins!',
                      type: 'success'
                    })
                    setTimeout(() => setNotification(null), 3000)
                  }
                }}
                className="ticket-button w-full p-3 text-lg"
              >
                Depart Station
              </button>
            )}
          </div>
        )

      case 'ACTIVE':
        return (
          <div className="space-y-4">
            <TrainCarView 
              players={players}
              currentPlayerName={playerName}
              isHost={currentPlayer?.is_host}
              gameStatus={game.status}
            />
            <div className="holiday-card p-4 text-center">
              <h2 className="font-holiday text-polar-gold text-2xl">Journey in Progress</h2>
              <p className="font-ticket text-polar-steam mt-2">
                The mystery unfolds as we travel through the night...
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      {currentPlayer.is_host && <HostIndicator />}
      <div className="p-4 max-w-4xl mx-auto">
        {testMode && (
          <div className="mb-4 p-2 bg-polar-red/20 text-polar-gold rounded text-center font-holiday">
            🔧 TEST MODE ACTIVE 🔧
          </div>
        )}
        
        {notification && (
          <div 
            className={`mb-4 p-3 rounded-lg text-center font-holiday animate-fade-in
              ${notification.type === 'success' 
                ? 'bg-polar-green/20 text-polar-gold border border-polar-gold' 
                : 'bg-polar-red/20 text-polar-gold border border-polar-red'
              }`}
          >
            {notification.message}
          </div>
        )}
        
        <div className="holiday-card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-holiday text-polar-gold">
              The Polar Express Mystery
            </h1>
            <div className="font-ticket text-polar-steam">
              <span>Ticket #{gameId.slice(0, 8)}</span>
              <div className="text-sm">
                Passengers: {players.length}/{MAX_PLAYERS}
              </div>
            </div>
          </div>

          {renderGameContent()}

          {testMode && game && (
            <TestControls 
              game={game}
              players={players}
              gameId={gameId}
              setPlayers={setPlayers}
              currentPlayerName={playerName}
            />
          )}
        </div>
      </div>
    </div>
  )
}
