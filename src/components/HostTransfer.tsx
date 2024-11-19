import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

export function HostTransfer() {
  const [isTransferring, setIsTransferring] = useState(false)

  const handleTransfer = async () => {
    const {data: game, error: gameError} = await supabase.from('games').select('*').neq('status', 'COMPLETED').single()
    console.log(game)
    if (gameError || !game) {
      alert('No active game found!')
      return
    }
    setIsTransferring(true)

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

      // Update host status
      const { error: updateError } = await supabase
        .from('players')
        .update({ is_host: false })
        .eq('id', currentHost.id)

      if (updateError) {
        alert('Error updating host status!')
        return
      }

      // Save new session
      storage.saveGameSession(game.id, 'RUSSELL TINSLEBOTTOM')

      // Create new host player
      const { error: newHostError } = await supabase
        .from('players')
        .insert({
          game_id: game.id,
          name: 'RUSSELL TINSLEBOTTOM',
          is_host: true,
        })

      if (newHostError) {
        alert('Error creating new host!')
        return
      }

      // Redirect to game
      window.location.href = '/'

    } catch (error) {
      console.error('Error in host transfer:', error)
      alert('Error transferring host!')
    } finally {
      setIsTransferring(false)
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
              onClick={handleTransfer}
              disabled={isTransferring}
              className="ticket-button w-full p-3 disabled:opacity-50"
            >
              {isTransferring ? 'Transferring...' : 'Transfer Host'}
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