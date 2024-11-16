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

  const previousSessions = storage.getAllGameSessions()

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

  const handleRejoinGame = async (sessionGameId: string, sessionPlayerName: string) => {
    try {
      // First check if game exists and get its current state
      const { data: games, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', sessionGameId)

      const game = games?.[0]

      if (gameError || !game) {
        alert('Previous journey not found!')
        storage.clearGameSession(sessionGameId)
        return
      }

      // Check if game is in a joinable state
      if (game.status === 'COMPLETED') {
        alert('This journey has ended!')
        return
      }

      // Check if player exists in game and get their previous state
      const { data: players, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', sessionGameId)
        .eq('name', sessionPlayerName)

      const existingPlayer = players?.[0]

      if (!players || playerError || !existingPlayer) {
        // Player not found, check if there's room
        const { data: currentPlayers } = await supabase
          .from('players')
          .select('id')
          .eq('game_id', sessionGameId)

        if (currentPlayers && currentPlayers.length >= MAX_PLAYERS) {
          alert('This journey is full!')
          return
        }

        // Check if this was the host (first player) of the game
        const { data: hostPlayers } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', sessionGameId)
          .eq('is_host', true)

        const hostExists = hostPlayers && hostPlayers.length > 0

        // Create new player entry with default state
        const { error: createError } = await supabase
          .from('players')
          .insert({
            game_id: sessionGameId,
            name: sessionPlayerName,
            is_host: !hostExists, // If no host exists, this player becomes host
            acknowledged: false,
            is_poisoner: false
          })

        if (createError) {
          alert('Error rejoining journey!')
          return
        }
      } else {
        // Player exists, preserve ALL their state
        const preservedState = {
          is_host: existingPlayer.is_host,
          is_poisoner: existingPlayer.is_poisoner,
          acknowledged: existingPlayer.acknowledged,
          // Only reset acknowledgment if game went back to LOBBY
          ...(game.status === 'LOBBY' ? { acknowledged: false } : {})
        }

        const { error: updateError } = await supabase
          .from('players')
          .update(preservedState)
          .eq('id', existingPlayer.id)

        if (updateError) {
          alert('Error restoring previous state!')
          return
        }
      }

      // Update local state
      setPlayerName(sessionPlayerName)
      setGameId(sessionGameId)

      // Update session storage with latest
      storage.saveGameSession(sessionGameId, sessionPlayerName)

      // Show success message
      alert('Successfully reboarded your journey!')

    } catch (error) {
      console.error('Error in handleRejoinGame:', error)
      alert('Error rejoining journey!')
    }
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
              {previousSessions.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h2 className="font-holiday text-polar-gold text-xl">Previous Journeys</h2>
                  {previousSessions.map(session => (
                    <div 
                      key={session.gameId}
                      className="holiday-card p-3 flex justify-between items-center"
                    >
                      <div className="font-ticket text-polar-gold">
                        <div>Ticket #{session.gameId.slice(0, 8)}</div>
                        <div className="text-sm text-polar-steam">
                          Passenger: {session.playerName}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRejoinGame(session.gameId, session.playerName)}
                        className="ticket-button px-4 py-2 text-sm"
                      >
                        Reboard
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      storage.clearGameSession()
                      window.location.reload()
                    }}
                    className="text-sm text-polar-steam hover:text-polar-gold transition-colors"
                  >
                    Clear Journey History
                  </button>
                </div>
              )}

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
    testMode={isTestMode}
  />
}

export default App