import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

export function ClaimHost() {
  const [isClaiming, setIsClaiming] = useState(false)

  const handleClaim = async () => {
    const {data: game, error: gameError} = await supabase.from('games').select('*').neq('status', 'COMPLETED').single()
    console.log(game)
    if (gameError || !game) {
      alert('No active game found!')
      return
    }
    setIsClaiming(true)

    try {
      // Verify game exists

      // Get current host
      const { data: currentHost, error: hostError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_host', true)
        .single()

      if (hostError || !currentHost) {
        alert('No host found!')
        return
      }

      storage.saveGameSession(game.id, 'RUSSELL TINSLEBOTTOM')

      // Redirect to game
      window.location.href = '/'

    } catch (error) {
      console.error('Error in host transfer:', error)
      alert('Error transferring host!')
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-snow-pattern">
      <div className="max-w-md mx-auto">
        <div className="holiday-card p-6">
          <h1 className="text-4xl font-holiday text-polar-gold text-center mb-8">
            Host Transfer
          </h1>
          
          <div className="space-y-6">
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="ticket-button w-full p-3 disabled:opacity-50"
            >
              {isClaiming ? 'Claiming...' : 'Claim Host'}
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