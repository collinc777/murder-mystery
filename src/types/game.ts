// src/types/game.ts
import { Database } from '../lib/database.types'

// Extract types from Database type
export type Game = Database['public']['Tables']['games']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type GameStatus = NonNullable<Game['status']>

// Export some type helpers if needed
export const isGameStatus = (status: string | null): status is GameStatus => {
  return status !== null && ['LOBBY', 'SELECTING', 'ACTIVE', 'COMPLETED'].includes(status)
}


