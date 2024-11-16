// src/App.tsx
import { useState } from 'react'
import { GameRoom } from './components/GameRoom'
import { storage } from './lib/storage'
import { WelcomeScreen } from './components/WelcomeScreen'
import { NewGame } from './components/NewGame'
import { JoinGame } from './components/JoinGame'

function App() {
  const [gameId, setGameId] = useState<string | null>(() => {
    const session = storage.getGameSession();
    return session?.gameId || null;
  });
  
  const [playerName, setPlayerName] = useState(() => {
    const session = storage.getGameSession();
    return session?.playerName || '';
  });

  // Get the current route
  const path = window.location.pathname;

  // If we have an active game session, show the game room
  if (gameId && playerName) {
    return <GameRoom 
      gameId={gameId} 
      playerName={playerName}
      testMode={window.location.search.includes('test=true')}
    />;
  }

  // Route to appropriate component based on path
  switch (path) {
    case '/new':
      return <NewGame />;
    case '/join':
      return <JoinGame />;
    default:
      return <WelcomeScreen />;
  }
}

export default App