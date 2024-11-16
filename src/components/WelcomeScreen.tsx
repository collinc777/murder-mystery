import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Game } from '../types/game'
import { CharacterSelect } from './CharacterSelect'
import { storage } from '../lib/storage'
import trainImage from "../assets/train.jpeg"

export function WelcomeScreen() {
  const [showTrain, setShowTrain] = useState(false)
  const [showText, setShowText] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [takenNames, setTakenNames] = useState<string[]>([])
  const [isHost, setIsHost] = useState(false)
  const redirecting = false

  useEffect(() => {
    // Check if user is already a host or player in the active game
    const checkExistingSession = async () => {
      const session = storage.getGameSession()
      if (session?.gameId && session?.playerName) {
        const { data: player } = await supabase
          .from('players')
          .select('is_host')
          .eq('game_id', session.gameId)
          .eq('name', session.playerName)
          .single()

        if (player) {
          setIsHost(player.is_host ?? false)
          return true
        }
      }
      return false
    }

    // Check for active game only if we're not redirecting
    const checkActiveGame = async () => {
      const isRedirecting = await checkExistingSession()
      if (isRedirecting) return

      const { data: games } = await supabase
        .from('games')
        .select('*')
        .not('status', 'eq', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (games) {
        setActiveGame(games)
        // Get taken names for this game
        const { data: players } = await supabase
          .from('players')
          .select('name')
          .eq('game_id', games.id)

        setTakenNames(players?.map(p => p.name) || [])
      } else {
        setActiveGame(null)
        setTakenNames([])
      }
    }

    // Only set up subscriptions if we're not redirecting
    if (!redirecting) {
      checkActiveGame()

      // Subscribe to games changes
      const gamesSubscription = supabase
        .channel('games-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'games'
          },
          () => {
            // Refetch active game when any game changes
            checkActiveGame()
          }
        )
        .subscribe()

      // Subscribe to players changes if there's an active game
      let playersSubscription: ReturnType<typeof supabase.channel> | null = null
      
      if (activeGame) {
        playersSubscription = supabase
          .channel(`players-${activeGame.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'players',
              filter: `game_id=eq.${activeGame.id}`
            },
            async () => {
              // Refetch taken names when players change
              const { data: players } = await supabase
                .from('players')
                .select('name')
                .eq('game_id', activeGame.id)

              setTakenNames(players?.map(p => p.name) || [])
            }
          )
          .subscribe()
      }

      // Stagger the animations
      setTimeout(() => setShowTrain(true), 500)
      setTimeout(() => setShowText(true), 1500)
      setTimeout(() => setShowContent(true), 2500)

      // Cleanup subscriptions
      return () => {
        gamesSubscription.unsubscribe()
        if (playersSubscription) {
          playersSubscription.unsubscribe()
        }
      }
    }
  }, [activeGame?.id, redirecting])

  const handleCharacterSelect = async (name: string) => {
    if (!activeGame) return
    
    try {
      // Add player to game
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: activeGame.id,
          name: name,
          is_host: false,
        })
        .select()
        .single()

      if (playerError) {
        alert('Error joining game!')
        return
      }

      // Save session and refresh the page
      storage.saveGameSession(activeGame.id, name)
      window.location.reload()

    } catch (error) {
      console.error('Error joining game:', error)
      alert('Error joining game!')
    }
  }

  return (
    <div>
      <div className="min-h-screen p-4 bg-snow-pattern relative overflow-hidden">
        {/* Steam effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute top-0 w-4 h-20 bg-gradient-to-b from-polar-steam/30 to-transparent 
                          animate-steam-1"></div>
            <div className="absolute top-0 left-6 w-4 h-16 bg-gradient-to-b from-polar-steam/20 to-transparent 
                          animate-steam-2"></div>
            <div className="absolute top-0 left-12 w-4 h-24 bg-gradient-to-b from-polar-steam/25 to-transparent 
                          animate-steam-3"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Train Image */}
          <div 
            className={`transition-all duration-1000 transform ${
              showTrain ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
            }`}
          >
            <div className="relative">
              <img 
                src={trainImage} 
                alt="Polar Express Train" 
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg brightness-75"
              />
              {/* Add a subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-polar-night/50 to-transparent rounded-lg"></div>
            </div>
          </div>

          {/* Title */}
          <div 
            className={`text-center mt-12 transition-all duration-1000 ${
              showText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'
            }`}
          >
            <h1 className="text-6xl font-holiday text-polar-gold mb-4">
              The Polar Express
            </h1>
            <div className="text-3xl font-holiday steam-text">
              Murder Mystery
            </div>
          </div>

          {/* Content */}
          <div 
            className={`mt-12 transition-all duration-1000 ${
              showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'
            }`}
          >
            {activeGame ? (
              <CharacterSelect 
                takenNames={takenNames}
                onSelect={handleCharacterSelect}
              />
            ) : (
              <div className="text-center">
                <h2 className="text-4xl font-holiday text-polar-gold mb-4">
                  Welcome to the Station
                </h2>
                <p className="font-ticket text-polar-steam text-lg">
                  The next journey will begin soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 