// src/App.tsx
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { GameRoom } from './components/GameRoom'
import { storage } from './lib/storage'

const MAX_PLAYERS = 20

function App() {
  const [gameId, setGameId] = useState<string | null>(() => {
    const session = storage.getGameSession();
    return session?.gameId || null;
  });
  
  const [playerName, setPlayerName] = useState(() => {
    const session = storage.getGameSession();
    return session?.playerName || '';
  });
  
  const [joinCode, setJoinCode] = useState('')
  
  const [isTestMode, setIsTestMode] = useState(false)

  useEffect(() => {
    const checkTestMode = async () => {
      if (!gameId || !playerName) return;
      
      if (window.location.search.includes('test=true')) {
        const { data: player } = await supabase
          .from('players')
          .select('is_host')
          .eq('game_id', gameId)
          .eq('name', playerName)
          .single()
        
        setIsTestMode(player?.is_host ?? false)
      }
    }

    checkTestMode()
  }, [gameId, playerName])

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

    const { data: existingPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', gameCode)

    if (existingPlayers && existingPlayers.length >= MAX_PLAYERS) {
      alert('Game room is full!')
      return
    }

    const { error: playerError } = await supabase
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

    storage.saveGameSession(game.id, playerName);
    setGameId(game.id)
  }

  const handleCreateGame = async () => {
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

    const { error: playerError } = await supabase
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

    storage.saveGameSession(game.id, playerName);
    setGameId(game.id)
  }

  const handleLeaveGame = async () => {
    if (!gameId) return;
    
    await supabase
      .from('players')
      .delete()
      .eq('game_id', gameId)
      .eq('name', playerName);
    
    storage.clearGameSession();
    setGameId(null);
    setPlayerName('');
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
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button
                onClick={() => handleJoinGame(joinCode)}
                disabled={!playerName || !joinCode}
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

  return <GameRoom 
    gameId={gameId} 
    playerName={playerName} 
    onLeaveGame={handleLeaveGame}
    testMode={isTestMode}
  />
}

export default App