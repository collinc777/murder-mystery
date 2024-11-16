interface GameSession {
  gameId: string;
  playerName: string;
}

export const storage = {
  saveGameSession: (gameId: string, playerName: string) => {
    localStorage.setItem('gameSession', JSON.stringify({ gameId, playerName }));
  },
  
  getGameSession: (): GameSession | null => {
    const session = localStorage.getItem('gameSession');
    return session ? JSON.parse(session) : null;
  },
  
  clearGameSession: () => {
    localStorage.removeItem('gameSession');
  }
}; 