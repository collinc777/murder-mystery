// src/hooks/useGame.ts
import { create } from 'zustand'
import { Player, Game } from '../types/game'

interface GameState {
  game: Game | null
  players: Player[]
  currentPlayer: Player | null
  setGame: (game: Game | null) => void
  setPlayers: (players: Player[]) => void
  setCurrentPlayer: (player: Player | null) => void
}

export const useGame = create<GameState>((set) => ({
  game: null,
  players: [],
  currentPlayer: null,
  setGame: (game) => set({ game }),
  setPlayers: (players) => set({ players }),
  setCurrentPlayer: (player) => set({ currentPlayer })
}))