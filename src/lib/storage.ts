interface GameSession {
  gameId: string;
  playerName: string;
  timestamp: number;
}

const MAX_RECENT_SESSIONS = 5;

export const storage = {
  saveGameSession: (gameId: string, playerName: string) => {
    const sessions = storage.getAllGameSessions();
    
    const newSession = {
      gameId,
      playerName,
      timestamp: Date.now()
    };

    const updatedSessions = [newSession, ...sessions]
      .filter((s, i, arr) => 
        arr.findIndex(x => x.gameId === s.gameId) === i
      )
      .slice(0, MAX_RECENT_SESSIONS);

    localStorage.setItem('gameSessions', JSON.stringify(updatedSessions));
  },
  
  getAllGameSessions: (): GameSession[] => {
    const sessions = localStorage.getItem('gameSessions');
    return sessions ? JSON.parse(sessions) : [];
  },
  
  getGameSession: (): GameSession | null => {
    const sessions = storage.getAllGameSessions();
    return sessions[0] || null;
  },
  
  clearGameSession: (gameId?: string) => {
    if (gameId) {
      const sessions = storage.getAllGameSessions();
      const updatedSessions = sessions.filter(s => s.gameId !== gameId);
      localStorage.setItem('gameSessions', JSON.stringify(updatedSessions));
    } else {
      localStorage.removeItem('gameSessions');
    }
  },

  clearOldSessions: () => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const sessions = storage.getAllGameSessions();
    const recentSessions = sessions.filter(
      s => Date.now() - s.timestamp < ONE_DAY
    );
    localStorage.setItem('gameSessions', JSON.stringify(recentSessions));
  }
}; 