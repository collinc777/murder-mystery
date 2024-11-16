# Murder Mystery Game Requirements Documentation

## Functional Requirements

### Game Setup
1. Host can create a new game
   - Receives unique game ID
   - Automatically joins as host
2. Players can join existing game
   - Must provide game ID
   - Must provide name
   - Cannot join if game is in progress
3. Lobby system shows:
   - List of connected players
   - Game ID for sharing
   - Host controls
   - Player count

### Poisoner Selection Phase
1. Only host can initiate selection
2. System randomly selects one player as poisoner
3. Each player must be notified of their role
   - Poisoner sees "You are the poisoner"
   - Others see "You are not the poisoner"
4. Players must acknowledge their role
5. Host sees acknowledgment progress
6. Everyone sees how many players have acknowledged (but not who)

### Game Progression
1. Game status transitions:
   - LOBBY → SELECTING → ACTIVE → COMPLETED
2. All state changes must be realtime
3. All players must see updates simultaneously
4. Host controls game flow
5. Players can't see others' roles

## Technical Requirements

### Frontend Architecture
```typescript
// Core Types
type GameStatus = 'LOBBY' | 'SELECTING' | 'ACTIVE' | 'COMPLETED'

interface Game {
  id: string
  status: GameStatus
  player_count: number
  created_at: string
  updated_at: string
}

interface Player {
  id: string
  game_id: string
  name: string
  is_host: boolean
  is_poisoner: boolean | null
  acknowledged: boolean
  created_at: string
  updated_at: string
}
```

### Database Schema
```sql
-- Games table
create table games (
    id uuid primary key default gen_random_uuid(),
    status game_status default 'LOBBY',
    player_count integer not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Players table
create table players (
    id uuid primary key default gen_random_uuid(),
    game_id uuid references games(id) on delete cascade,
    name text not null,
    is_host boolean default false,
    is_poisoner boolean default null,
    acknowledged boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### Tech Stack
1. Frontend:
   - Vite + React
   - TypeScript
   - Tailwind CSS for styling
2. Backend:
   - Supabase for database and realtime
   - No custom backend needed
3. State Management:
   - Direct Supabase subscriptions
   - Local React state for UI
4. Hosting:
   - Frontend on Vercel/Netlify
   - Supabase free tier for backend

### Realtime Requirements
1. Required subscriptions:
   ```typescript
   // Game changes
   supabase
     .channel(`game-${id}`)
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'games',
       filter: `id=eq.${gameId}`
     })

   // Player changes
   supabase
     .channel(`players-${id}`)
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'players',
       filter: `game_id=eq.${gameId}`
     })
   ```

2. Events to handle:
   - Player joins/leaves
   - Role assignments
   - Acknowledgments
   - Game state changes

### Security Considerations
1. No RLS needed (party game)
2. Basic data validation on frontend
3. Simple random selection logic
4. No persistent data requirements

### Performance Requirements
1. Support 4-20 simultaneous players
2. Real-time updates within 1 second
3. Single game session only
4. No data persistence needed
5. Mobile-friendly UI

### Development Priorities
1. Core game loop:
   - Game creation
   - Player joining
   - Role assignment
   - Acknowledgment system
2. UI/UX:
   - Clear role communication
   - Simple host controls
   - Player status visibility
3. Nice-to-haves:
   - Leave/rejoin capability
   - Game completion handling
   - Better error handling
   - UI polish