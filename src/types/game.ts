// src/types/game.ts
export type GameStatus = 'LOBBY' | 'SELECTING' | 'ACTIVE' | 'COMPLETED'

export interface Player {
  id: string
  name: string
  game_id: string
  is_host: boolean
  is_poisoner: boolean | null
  acknowledged: boolean
}

export interface Game {
  id: string
  status: GameStatus
  player_count: number
  created_at: string
}

// src/lib/supabase.ts


