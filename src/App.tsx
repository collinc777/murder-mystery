// src/App.tsx
import { useState } from 'react'
import { GameRoom } from './components/GameRoom'
import { storage } from './lib/storage'
import { WelcomeScreen } from './components/WelcomeScreen'
import { NewGame } from './components/NewGame'
import { JoinGame } from './components/JoinGame'
import { Layout } from './components/Layout'
import { ClaimHost } from './components/ClaimHost'

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

  // Only show GameRoom if we have an active session AND we're not trying to start/join a new game
  if (gameId && playerName && path === '/') {
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
    case '/claim-host':
      return (
        <Layout>
          <ClaimHost />
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