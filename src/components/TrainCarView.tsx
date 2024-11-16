interface TrainCarViewProps {
  players: Array<{
    id: string;
    name: string;
    is_host: boolean | null;
    acknowledged: boolean | null;
  }>;
  currentPlayerName: string;
  isHost: boolean | null;
  gameStatus?: string;
  onRemovePlayer?: (playerId: string) => void;
}

export function TrainCarView({ 
  players, 
  currentPlayerName, 
  isHost, 
  gameStatus,
  onRemovePlayer 
}: TrainCarViewProps) {
  const maxSeatsPerSide = Math.ceil(players.length / 2)
  const leftSideSeats = players.slice(0, maxSeatsPerSide)
  const rightSideSeats = players.slice(maxSeatsPerSide)

  const canRemovePassengers = isHost && gameStatus === 'LOBBY' && onRemovePlayer

  const renderSeat = (player: TrainCarViewProps['players'][0]) => (
    <div 
      key={player.id}
      className={`
        h-16 border-2 rounded-lg p-2 relative
        ${player.name === currentPlayerName 
          ? 'border-polar-gold bg-polar-gold/20' 
          : 'border-polar-gold/50 bg-polar-night'
        }
      `}
    >
      <div className="font-ticket text-polar-gold text-sm truncate">
        {player.name}
        {player.is_host && ' 🎅'}
      </div>
      {player.acknowledged && (
        <div className="text-xs text-polar-steam">Ready</div>
      )}
      {canRemovePassengers && !player.is_host && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemovePlayer(player.id)
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-polar-red 
                     text-polar-snow flex items-center justify-center
                     hover:bg-polar-red/80 transition-colors"
          title="Remove passenger"
        >
          ×
        </button>
      )}
    </div>
  )

  return (
    <div className="holiday-card p-4">
      <div className="relative bg-polar-night border-2 border-polar-gold rounded-lg p-2">
        <div className="absolute inset-0 border-4 border-polar-gold rounded-lg" />
        
        <div className="flex justify-between min-h-[300px]">
          <div className="w-[45%] space-y-2">
            {leftSideSeats.map(renderSeat)}
          </div>

          <div className="w-[10%] bg-polar-gold/10 rounded-lg" />

          <div className="w-[45%] space-y-2">
            {rightSideSeats.map(renderSeat)}
          </div>
        </div>

        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1 bg-polar-night border-2 border-polar-gold rounded-full">
            <span className="font-ticket text-polar-gold text-sm">
              Car 1
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 