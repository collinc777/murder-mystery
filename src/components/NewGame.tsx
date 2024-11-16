import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

export function NewGame() {
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateGame = async () => {
    setIsCreating(true)
    try {
      // Create new game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          status: 'LOBBY',
        })
        .select()
        .single()

      if (gameError || !game) {
        alert('Error creating game!')
        return
      }

      // Add host player as Russell Tinslebottom
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: game.id,
          name: 'RUSSELL TINSLEBOTTOM',
          is_host: true,
        })
        .select()
        .single()

      if (playerError) {
        alert('Error creating host!')
        return
      }

      // Save session and redirect to home
      storage.saveGameSession(game.id, 'RUSSELL TINSLEBOTTOM')
      window.location.href = '/'

    } catch (error) {
      console.error('Error in handleCreateGame:', error)
      alert('Error creating game!')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-snow-pattern">
      <div className="max-w-md mx-auto">
        <div className="holiday-card p-6">
          <h1 className="text-4xl font-holiday text-polar-gold text-center mb-8">
            Create New Journey
          </h1>
          
          <div className="space-y-6">
            <button
              onClick={handleCreateGame}
              disabled={isCreating}
              className="ticket-button w-full p-3 disabled:opacity-50"
            >
              {isCreating ? 'Preparing Journey...' : 'Begin New Journey'}
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