import { useState } from 'react'
import { CHARACTERS } from '../constants/characters'

interface CharacterSelectProps {
  takenNames: string[]
  onSelect: (name: string) => void
  gameId: string
}

export function CharacterSelect({ takenNames, onSelect, gameId }: CharacterSelectProps) {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [hoveredFamily, setHoveredFamily] = useState<string | null>(null)

  const handleConfirm = () => {
    if (selectedName) {
      onSelect(selectedName)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-holiday text-polar-gold text-center mb-8">
        Choose Your Character
      </h2>

      {/* Confirmation Modal */}
      {selectedName && (
        <div className="fixed inset-0 bg-polar-night/80 flex items-center justify-center z-50">
          <div className="holiday-card p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-holiday text-polar-gold mb-4">
              Confirm Your Character
            </h3>
            <p className="font-ticket text-polar-gold mb-6">
              Would you like to board as {selectedName}?
            </p>
            <div className="text-sm text-polar-steam mb-6">
              {Object.values(CHARACTERS).map(family => 
                family.members.find(m => m.name === selectedName)?.role
              ).filter(Boolean)[0]}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                className="ticket-button flex-1 p-3"
              >
                Yes, Board Train
              </button>
              <button
                onClick={() => setSelectedName(null)}
                className="ticket-button flex-1 p-3 bg-polar-night hover:bg-polar-gold text-polar-gold hover:text-polar-night"
              >
                Choose Another
              </button>
            </div>
          </div>
        </div>
      )}

      {Object.entries(CHARACTERS).map(([familyKey, family]) => (
        <div 
          key={familyKey}
          className="mb-8"
          onMouseEnter={() => setHoveredFamily(familyKey)}
          onMouseLeave={() => setHoveredFamily(null)}
        >
          <h3 className="font-holiday text-xl text-polar-gold mb-4">
            {family.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {family.members.map(character => {
              const isTaken = takenNames.includes(character.name)
              const isHovered = hoveredFamily === familyKey
              
              return (
                <div 
                  key={character.name}
                  onClick={() => !isTaken && setSelectedName(character.name)}
                  className={`
                    holiday-card p-4 transition-all duration-300
                    ${isTaken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                    ${isHovered ? 'border-polar-gold' : ''}
                    ${selectedName === character.name ? 'ring-2 ring-polar-gold' : ''}
                  `}
                >
                  <div className="font-ticket text-polar-gold text-lg mb-2">
                    {character.name}
                    {isTaken && <span className="ml-2 text-polar-steam">(Taken)</span>}
                  </div>
                  <div className="text-sm text-polar-steam">
                    {character.role}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
} 