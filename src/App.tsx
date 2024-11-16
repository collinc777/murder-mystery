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
      <div className="min-h-screen p-4 bg-snow-pattern">
        <div className="max-w-md mx-auto">
          <div className="holiday-card p-6">
            <h1 className="text-4xl font-holiday text-polar-gold text-center mb-8">
              The Polar Express
              <div className="text-2xl steam-text">Murder Mystery</div>
            </h1>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-ticket text-polar-gold">Your Ticket Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full p-2 bg-polar-night border-2 border-polar-gold rounded 
                           font-ticket text-polar-gold placeholder-polar-steam/50
                           focus:outline-none focus:ring-2 focus:ring-polar-gold"
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleCreateGame}
                  disabled={!playerName}
                  className="ticket-button w-full p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Board New Train
                </button>
                
                <div className="text-center font-ticket text-polar-steam">or</div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ticket number"
                    className="flex-1 p-2 bg-polar-night border-2 border-polar-gold rounded 
                             font-ticket text-polar-gold placeholder-polar-steam/50
                             focus:outline-none focus:ring-2 focus:ring-polar-gold"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                  <button
                    onClick={() => handleJoinGame(joinCode)}
                    disabled={!playerName || !joinCode}
                    className="ticket-button px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Board
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="font-ticket text-sm text-polar-steam">
                All aboard for a mysterious journey...
              </p>
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