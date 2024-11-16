import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

// List of approved passenger characters
export const PASSENGER_NAMES = [
  'MOLLY SNOWFLAKE',
  'CHRISTOPHER CAROL',
  'NORMAN \'NODDY\' SLEIGH',
  'AUGUSTUS PRESENT',
  'RONALD TINSLEBOTTOM',
  'ARABELLA TINSLEBOTTOM',
  'RUSSELL TINSLEBOTTOM',
  'ANYA JOLLY',
  'LAYLA JOLLY',
  'JAX \'JJ\' JOLLY',
  'SKYLAR JOLLY',
  'JADE BAUBLES',
  'OLIVER BAUBLES',
  'TIM \'TINY\' BAUBLES',
  'MARLEY BAUBLES',
  'ESTELLA BAUBLES',
  'KINGSLEY ANGEL',
  'SCARLET ANGEL',
  'KAHLO ANGEL'
] as const;

type PassengerName = typeof PASSENGER_NAMES[number]

export function JoinGame() {
  const [gameId, setGameId] = useState('')
  const [selectedName, setSelectedName] = useState<PassengerName | ''>('')
  const [availableNames, setAvailableNames] = useState<PassengerName[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check available names when game ID is entered
  const checkAvailableNames = async (gameCode: string) => {
    setIsLoading(true)
    try {
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('name')
        .eq('game_id', gameCode)

      const takenNames = new Set(existingPlayers?.map(p => p.name) || [])
      const available = PASSENGER_NAMES.filter(name => !takenNames.has(name))
      setAvailableNames(available)
    } catch (error) {
      console.error('Error checking names:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGame = async () => {
    if (!gameId || !selectedName) return

    try {
      setIsLoading(true)

      // Check if game exists and is joinable
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (!game || game.status === 'COMPLETED') {
        alert('This train has already departed!')
        return
      }

      // Add player to game
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: gameId,
          name: selectedName,
          is_host: false,
        })

      if (playerError) {
        alert('Error boarding train!')
        return
      }

      // Save session and redirect to home
      storage.saveGameSession(gameId, selectedName)
      window.location.href = '/'

    } catch (error) {
      console.error('Error joining game:', error)
      alert('Error joining game!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-snow-pattern">
      <div className="max-w-md mx-auto">
        <div className="holiday-card p-6">
          <h1 className="text-4xl font-holiday text-polar-gold text-center mb-8">
            Board the Train
            <div className="text-2xl steam-text">Select Your Character</div>
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-ticket text-polar-gold">
                Ticket Number
              </label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => {
                  setGameId(e.target.value)
                  if (e.target.value.length >= 8) {
                    checkAvailableNames(e.target.value)
                  }
                }}
                className="w-full p-2 bg-polar-night border-2 border-polar-gold rounded 
                         font-ticket text-polar-gold focus:outline-none focus:ring-2 
                         focus:ring-polar-gold"
                placeholder="Enter ticket number"
              />
            </div>

            {gameId.length >= 8 && (
              <div>
                <label className="block mb-2 font-ticket text-polar-gold">
                  Select Your Character
                </label>
                <select
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value as PassengerName)}
                  className="w-full p-2 bg-polar-night border-2 border-polar-gold rounded 
                           font-ticket text-polar-gold focus:outline-none focus:ring-2 
                           focus:ring-polar-gold"
                  disabled={isLoading || availableNames.length === 0}
                >
                  <option value="">Select a character...</option>
                  {availableNames.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {availableNames.length === 0 && !isLoading && (
                  <p className="mt-2 text-sm font-ticket text-polar-steam">
                    No available characters for this journey
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleJoinGame}
              disabled={!gameId || !selectedName || isLoading}
              className="ticket-button w-full p-3 disabled:opacity-50"
            >
              {isLoading ? 'Boarding...' : 'Board Train'}
            </button>

            <div className="text-center">
              <a 
                href="/"
                className="font-ticket text-sm text-polar-steam hover:text-polar-gold transition-colors"
              >
                Return to Station
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 