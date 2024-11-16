// src/App.tsx
import { useEffect, useState } from 'react'
import { Database } from './lib/database.types'
import { supabase } from './lib/supabase'

type Game = Database['public']['Tables']['games']['Row']
type Player = Database['public']['Tables']['players']['Row']

function App() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  
  // Join existing game
  const handleJoinGame = async (gameCode: string) => {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameCode)
      .single()
    
    if (error || !game) {
      alert('Game not found!')
      return
    }

    // Add player to game
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: playerName,
        is_host: false,
      })
      .select()
      .single()

    if (playerError) {
      alert('Error joining game!')
      return
    }

    setGameId(game.id)
  }

  // Create new game
  const handleCreateGame = async () => {
    // Create game
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        status: 'LOBBY',
        player_count: 1,
      })
      .select()
      .single()

    if (error || !game) {
      alert('Error creating game!')
      return
    }

    // Add host player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: playerName,
        is_host: true,
      })
      .select()
      .single()

    if (playerError) {
      alert('Error creating player!')
      return
    }

    setGameId(game.id)
  }

  if (!gameId) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Murder Mystery Game</h1>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your name"
            />
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleCreateGame}
              disabled={!playerName}
              className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Create New Game
            </button>
            
            <div className="text-center">or</div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter game code"
                className="flex-1 p-2 border rounded"
                onChange={(e) => setGameId(e.target.value)}
              />
              <button
                onClick={() => gameId && handleJoinGame(gameId)}
                disabled={!playerName}
                className="p-2 bg-green-500 text-white rounded disabled:opacity-50"
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render game room when we have a gameId
  return (
    <div>
      <h1>Game Room {gameId}</h1>
      {/* We'll build this next */}
    </div>
  )
}

export default App