// src/App.tsx
import { useState } from 'react'
import { GameRoom } from './components/GameRoom'
import { storage } from './lib/storage'
import { WelcomeScreen } from './components/WelcomeScreen'
import { NewGame } from './components/NewGame'
import { JoinGame } from './components/JoinGame'
import { Layout } from './components/Layout'

function App() {
  const [gameId] = useState<string | null>(() => {
    const session = storage.getGameSession();
    return session?.gameId || null;
  });
  
  const [playerName] = useState(() => {
    const session = storage.getGameSession();
    return session?.playerName || '';
  });

  // Get the current route
  const path = window.location.pathname;

  // If we have an active game session, show the game room
  if (gameId && playerName) {
    return (
      <Layout isHost={playerName === 'RUSSELL TINSLEBOTTOM'}>
        <GameRoom 
          gameId={gameId} 
          playerName={playerName}
          testMode={window.location.search.includes('test=true')}
        />
      </Layout>
    );
  }

  // Route to appropriate component based on path
  switch (path) {
    case '/new':
      return (
        <Layout>
          <NewGame />
        </Layout>
      );
    case '/join':
      return (
        <Layout>
          <JoinGame />
        </Layout>
      );
    default:
      return (
        <Layout>
          <WelcomeScreen />
        </Layout>
      );
  }
}

export default App