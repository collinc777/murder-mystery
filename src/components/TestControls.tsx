import { Game, Player } from '../types/game'
import { supabase } from '../lib/supabase'
import { CHARACTERS } from '../constants/characters'
import { storage } from '../lib/storage'

interface TestControlsProps {
  game: Game
  players: Player[]
  gameId: string
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  currentPlayerName: string
}

function generateRandomName(): string {
  // Flatten all character names into a single array
  const allCharacters = Object.values(CHARACTERS).flatMap(family => 
    family.members.map(member => member.name)
  )
  
  // Pick a random character name
  return allCharacters[Math.floor(Math.random() * allCharacters.length)]
}

export function TestControls({ game, players, gameId, setPlayers, currentPlayerName }: TestControlsProps) {
  const handleForceGameState = async (status: Game['status']) => {
    await supabase
      .from('games')
      .update({ status })
      .eq('id', gameId)

    // If completing the game, clear the session
    if (status === 'COMPLETED') {
      storage.clearGameSession(gameId)
      // Refresh the page to return to station
      window.location.reload()
    }
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

    // Simulate random delays for each player
    const simulatePlayerAcknowledge = async (player: Player) => {
      // Random delay between 1-5 seconds
      const delay = Math.random() * 4000 + 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
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

  const handleMakeMePoisoner = async () => {
    try {
      // First reset all players to not be poisoner
      await supabase
        .from('players')
        .update({ is_poisoner: false })
        .eq('game_id', gameId)

      // Then make current player the poisoner
      const { error } = await supabase
        .from('players')
        .update({ is_poisoner: true })
        .eq('game_id', gameId)
        .eq('name', currentPlayerName)

      if (error) {
        console.error('Error making current player poisoner:', error)
      }
    } catch (error) {
      console.error('Error in handleMakeMePoisoner:', error)
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
              className="ticket-button px-3 py-1 text-sm"
            >
              Force LOBBY
            </button>
            <button
              onClick={() => handleForceGameState('SELECTING')}
              className="ticket-button px-3 py-1 text-sm"
            >
              Force SELECTING
            </button>
            <button
              onClick={() => handleForceGameState('ACTIVE')}
              className="ticket-button px-3 py-1 text-sm"
            >
              Force ACTIVE
            </button>
            <button
              onClick={() => handleForceGameState('COMPLETED')}
              className="ticket-button px-3 py-1 text-sm bg-polar-red hover:bg-polar-red/80"
            >
              Force COMPLETE
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Player Controls</h3>
          <button
            onClick={handleResetAllAcknowledgments}
            className="ticket-button px-3 py-1 text-sm"
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
                className="ticket-button px-3 py-1 text-sm"
                disabled={players.every(p => p.acknowledged)}
              >
                Simulate One Acknowledgment
              </button>
              <button
                onClick={handleSimulateAcknowledgments}
                className="ticket-button px-3 py-1 text-sm"
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

        <div>
          <h3 className="font-semibold mb-2">Role Controls</h3>
          <div className="flex gap-2">
            <button
              onClick={handleMakeMePoisoner}
              className="ticket-button px-3 py-1 text-sm"
            >
              Make Me Poisoner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 