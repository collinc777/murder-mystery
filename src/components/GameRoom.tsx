// src/components/GameRoom.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Player = Database['public']['Tables']['players']['Row']

interface GameRoomProps {
  gameId: string
  playerName: string
}

export function GameRoom({ gameId, playerName }: GameRoomProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)

  useEffect(() => {
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

    // Subscribe to player changes
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
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
          } else {
            const player = payload.new as Player
            if (player.name === playerName) {
              setCurrentPlayer(player)
            }
            setPlayers(prev => {
              const exists = prev.some(p => p.id === player.id)
              if (exists) {
                return prev.map(p => p.id === player.id ? player : p)
              } else {
                return [...prev, player]
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      gameSubscription.unsubscribe()
      playerSubscription.unsubscribe()
    }
  }, [gameId, playerName])

  // Host controls
  const handleStartSelection = async () => {
    if (!currentPlayer?.is_host) return
    
    // Update game status
    await supabase
      .from('games')
      .update({ status: 'SELECTING' })
      .eq('id', gameId)

    // Randomly select a poisoner
    const randomPlayer = players[Math.floor(Math.random() * players.length)]
    await supabase
      .from('players')
      .update({ is_poisoner: true })
      .eq('id', randomPlayer.id)
  }

  // Player acknowledgment
  const handleAcknowledge = async () => {
    if (!currentPlayer) return
    
    await supabase
      .from('players')
      .update({ acknowledged: true })
      .eq('id', currentPlayer.id)
  }

  if (!game || !currentPlayer) return <div>Loading...</div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Game Room</h1>
        <div className="text-sm">
          Game ID: <span className="font-mono">{gameId}</span>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Players</h2>
        <div className="grid grid-cols-2 gap-2">
          {players.map(player => (
            <div 
              key={player.id}
              className="p-2 border rounded flex justify-between items-center"
            >
              <span>{player.name} {player.is_host ? '(Host)' : ''}</span>
              {player.acknowledged && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {currentPlayer.is_host && game.status === 'LOBBY' && (
          <button
            onClick={handleStartSelection}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Start Selection
          </button>
        )}

        {game.status === 'SELECTING' && currentPlayer.is_poisoner !== null && !currentPlayer.acknowledged && (
          <div className="p-4 border rounded bg-yellow-50">
            <p className="font-bold mb-2">
              {currentPlayer.is_poisoner 
                ? "You are the poisoner!"
                : "You are not the poisoner."
              }
            </p>
            <button
              onClick={handleAcknowledge}
              className="w-full p-2 bg-green-500 text-white rounded"
            >
              Acknowledge
            </button>
          </div>
        )}

        {game.status === 'SELECTING' && (
          <div className="text-center">
            {players.filter(p => p.acknowledged).length} of {players.length} players have acknowledged
          </div>
        )}
      </div>
    </div>
  )
}
