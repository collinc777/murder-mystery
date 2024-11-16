import { Game, Player } from '../types/game'
import { supabase } from '../lib/supabase'

interface TestControlsProps {
  game: Game
  players: Player[]
  gameId: string
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
}

export function TestControls({ game, players, gameId, setPlayers }: TestControlsProps) {
  const handleForceGameState = async (status: Game['status']) => {
    await supabase
      .from('games')
      .update({ status })
      .eq('id', gameId)
  }

  const handleResetAllAcknowledgments = async () => {
    try {
      console.log('Resetting all acknowledgments...')
      
      const { error } = await supabase
        .from('players')
        .update({ acknowledged: false })
        .eq('game_id', gameId)

      if (error) {
        console.error('Error resetting acknowledgments:', error)
      }
    } catch (error) {
      console.error('Error in handleResetAllAcknowledgments:', error)
    }
  }

  const handleTogglePlayerPoisoner = async (playerId: string, isPoisoner: boolean) => {
    await supabase
      .from('players')
      .update({ is_poisoner: isPoisoner })
      .eq('id', playerId)
  }

  const handleSimulateAcknowledgments = async () => {
    const unacknowledgedPlayers = players.filter(p => !p.acknowledged)
    if (unacknowledgedPlayers.length === 0) return

    console.log('Starting batch acknowledgment simulation')

    // Simulate random delays for each player
    const simulatePlayerAcknowledge = async (player: Player) => {
      // Random delay between 1-5 seconds
      const delay = Math.random() * 4000 + 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      console.log('Acknowledging player:', player.name)
      const { error } = await supabase
        .from('players')
        .update({ acknowledged: true })
        .eq('id', player.id)

      if (error) {
        console.error('Error acknowledging player:', player.name, error)
      }
    }

    // Start all simulations concurrently
    await Promise.all(
      unacknowledgedPlayers.map(player => simulatePlayerAcknowledge(player))
    )
  }

  const handleSimulateOneAcknowledgment = async () => {
    const unacknowledgedPlayers = players.filter(p => !p.acknowledged)
    if (unacknowledgedPlayers.length === 0) return

    const randomPlayer = unacknowledgedPlayers[
      Math.floor(Math.random() * unacknowledgedPlayers.length)
    ]

    console.log('Simulating acknowledgment for:', randomPlayer.name)
    
    const { error } = await supabase
      .from('players')
      .update({ acknowledged: true })
      .eq('id', randomPlayer.id)

    if (error) {
      console.error('Error simulating acknowledgment:', error)
    }
  }

  const handleIndividualAcknowledge = async (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    console.log('Acknowledging individual player:', player.name)
    
    // Update local state first
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, acknowledged: true } : p
    ))
    
    // Then update database
    const { error } = await supabase
      .from('players')
      .update({ acknowledged: true })
      .eq('id', playerId)
      .select()

    if (error) {
      console.error('Error acknowledging player:', error)
      // Revert local state if error occurs
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, acknowledged: false } : p
      ))
    }
  }

  return (
    <div className="mt-8 p-4 border-t-2 border-red-500">
      <h2 className="text-xl font-bold text-red-500 mb-4">🔧 Test Controls</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Game State Controls</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleForceGameState('LOBBY')}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Force LOBBY
            </button>
            <button
              onClick={() => handleForceGameState('SELECTING')}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Force SELECTING
            </button>
            <button
              onClick={() => handleForceGameState('ACTIVE')}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Force ACTIVE
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Player Controls</h3>
          <button
            onClick={handleResetAllAcknowledgments}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Reset All Acknowledgments
          </button>
        </div>

        {game.status === 'SELECTING' && (
          <div>
            <h3 className="font-semibold mb-2">Acknowledgment Simulation</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSimulateOneAcknowledgment}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                disabled={players.every(p => p.acknowledged)}
              >
                Simulate One Acknowledgment
              </button>
              <button
                onClick={handleSimulateAcknowledgments}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                disabled={players.every(p => p.acknowledged)}
              >
                Simulate All Acknowledgments
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {players.filter(p => p.acknowledged).length} of {players.length} players acknowledged
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Player Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {players.map(player => (
              <div key={player.id} className="p-2 border rounded">
                <div className="flex justify-between items-center mb-1">
                  <span>{player.name}</span>
                  <span className="text-sm">
                    {player.is_host ? '👑 ' : ''} 
                    {player.acknowledged ? '✓ ' : ''} 
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Poisoner:</span>
                  <button
                    onClick={() => handleTogglePlayerPoisoner(player.id, !player.is_poisoner)}
                    className={`px-2 py-0.5 text-xs rounded ${
                      player.is_poisoner 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {player.is_poisoner ? 'YES' : 'NO'}
                  </button>
                  {!player.acknowledged && game.status === 'SELECTING' && (
                    <button
                      onClick={() => handleIndividualAcknowledge(player.id)}
                      className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded"
                    >
                      Ack
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-2 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="text-sm font-mono">
            <div>Game Status: {game.status}</div>
            <div>Player Count: {players.length}</div>
            <div>Acknowledged: {players.filter(p => p.acknowledged).length}</div>
            <div>Poisoners: {players.filter(p => p.is_poisoner).length}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 