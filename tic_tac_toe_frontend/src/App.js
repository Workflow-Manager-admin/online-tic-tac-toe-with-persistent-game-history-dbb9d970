import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// The backend API base URL. Update if the backend is served from a custom URL.
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Minimal cell for the Tic Tac Toe board
function Square({ value, onClick, disabled }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      disabled={disabled || value}
      aria-label={value ? `Cell ${value}` : 'Empty cell'}
      style={{
        width: 64,
        height: 64,
        fontSize: '2.2rem',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        color: value === 'X' ? '#1976d2' : '#388e3c',
        fontWeight: 'bold',
        cursor: disabled || value ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s'
      }}
    >
      {value || ''}
    </button>
  );
}

// 3x3 board component, controlled by parent game state
function Board({ board, onCellClick, disabled }) {
  return (
    <div className="ttt-board" style={{
      display: 'grid',
      gridTemplateRows: 'repeat(3, 1fr)',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 0,
      margin: '0 auto',
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '0 2px 10px #0001',
      width: 194,
      height: 194
    }}>
      {board.map((row, r) =>
        row.map((val, c) =>
          <Square
            key={`${r}-${c}`}
            value={val}
            onClick={() => onCellClick(r, c)}
            disabled={disabled}
          />
        )
      )}
    </div>
  );
}

// Simple loading spinner for async UI
function Spinner() {
  return <div className="spinner" style={{
    margin: '16px auto', width: 24, height: 24, border: '3px solid #ddd',
    borderTop: '3px solid #1976d2', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />;
}

// Game State/Result display area
function GameStatusDisplay({ gameState, loading }) {
  if (!gameState) return null;

  let msg;
  if (loading) {
    msg = "Loading game...";
  } else if (gameState.status === "completed") {
    if (gameState.winner) {
      msg = (
        <span>
          Winner: <strong style={{ color: gameState.winner === "X" ? "#1976d2" : "#388e3c" }}>{gameState.winner}</strong> 🎉
        </span>
      );
    } else {
      msg = <span>Game ended in a <strong>draw</strong> 🤝</span>;
    }
  } else if (gameState.status === "in_progress") {
    msg = (
      <span>
        Next Turn: <strong style={{ color: gameState.next_player === "X" ? "#1976d2" : "#388e3c" }}>{gameState.next_player}</strong>
      </span>
    );
  } else {
    msg = <span>Unknown game status</span>;
  }

  return (
    <div className="game-status-display" style={{
      margin: '12px 0', fontSize: '1.18rem', minHeight: 32
    }}>
      {msg}
    </div>
  );
}

// Game controls (new game, restart, etc)
function GameControls({ onNewGame, isActive, disabled, firstPlayer, setFirstPlayer }) {
  return (
    <div className="game-controls" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={{marginRight:8}}>
          First Player: 
        </label>
        <select value={firstPlayer} disabled={isActive || disabled}
          onChange={e=>setFirstPlayer(e.target.value)}
          style={{
            fontSize:'1rem',padding:2,borderRadius:4,border:'1px solid #ccc',
            color: firstPlayer === 'X' ? '#1976d2' : '#388e3c'
          }}
        >
          <option value="X">X</option>
          <option value="O">O</option>
        </select>
      </div>
      <button className="theme-toggle btn"
        style={{
          fontWeight: 'bold',
          letterSpacing: 0.7,
          marginTop: 4,
          background: "var(--button-bg)",
          color: "var(--button-text)",
          border: "none",
          borderRadius: 8,
          padding: "8px 22px",
          fontSize: 16,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: "background 0.2s"
        }}
        onClick={onNewGame}
        disabled={disabled}
        aria-label="Start a new game"
      >
        {isActive ? "Start New Game" : "New Game"}
      </button>
    </div>
  );
}

// Game history list (completed & in-progress)
function GameHistory({ games, onSelect, currentGameId, loading }) {
  return (
    <aside style={{
      minWidth: 180,
      background: "var(--bg-secondary)",
      border: '2px solid var(--border-color)',
      borderRadius: 8,
      padding: 10,
      marginLeft: 18,
      maxHeight: 360,
      overflowY: 'auto',
      boxShadow:'0 2px 10px #0001'
    }}>
      <div style={{
        fontWeight: 700, marginBottom: 10, fontSize: '1.05rem', letterSpacing:0.1
      }}>Game History</div>
      {loading ? <Spinner /> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {games.length === 0 && !loading && (
          <li style={{ color: '#555', fontSize: 13 }}>No games found.</li>
        )}
        {games.map(g => (
          <li key={g.id}>
            <button
              onClick={()=>onSelect(g.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: g.id === currentGameId ? '#eee' : 'transparent',
                fontWeight: g.id === currentGameId ? 700 : 400,
                border: "none",
                borderRadius: 4,
                padding: '6px 5px 5px 5px',
                margin: "2px 0",
                fontSize: 14,
                color: g.winner === "X" ? "#1976d2" :
                      g.winner === "O" ? "#388e3c" : "#888",
                opacity: g.status === "in_progress" ? 0.78 : 1,
                cursor: "pointer",
                letterSpacing:0.1,
                boxShadow: g.id === currentGameId ? '0 1px 2px #0001' : "none"
              }}
              aria-current={g.id === currentGameId}
            >
              <span>
                #{g.id.slice(-4).toUpperCase()}:&nbsp; 
                <strong>{g.first_player}</strong>
                {g.status === "completed" && g.winner
                  ? ` → Winner: ${g.winner}`
                  : g.status === "completed"
                  ? " → Draw"
                  : " (In Progress)"}
                &nbsp; ({g.moves} moves)
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}


// PUBLIC_INTERFACE
function App() {
  // Theme management
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Game logic state
  const [gameState, setGameState] = useState(null);        // Current game state object from backend
  const [games, setGames] = useState([]);                  // List of games for history panel
  const [loading, setLoading] = useState(false);           // Loading indicator for main board/api
  const [historyLoading, setHistoryLoading] = useState(false); // For history panel loading
  const [error, setError] = useState("");                  // For error alert
  const [firstPlayer, setFirstPlayer] = useState("X");     // First player when starting a game

  // Load game list (history)
  const fetchGames = useCallback(() => {
    setHistoryLoading(true);
    fetch(`${API_BASE}/games?include_in_progress=true`)
      .then(r => r.json())
      .then(setGames)
      .catch(() => setError("Failed to load game history."))
      .finally(() => setHistoryLoading(false));
  }, []);

  // Load specific game state by ID
  const fetchGameState = useCallback((gameId) => {
    setLoading(true);
    fetch(`${API_BASE}/games/${gameId}`)
      .then(r => r.json())
      .then(setGameState)
      .catch(() => setError("Failed to fetch game."))
      .finally(() => setLoading(false));
  }, []);

  // Start a new game
  const startNewGame = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_player: firstPlayer })
    })
      .then(async (r) => {
        if (!r.ok) {
          const e = await r.json();
          throw (e && e.detail) ? new Error(e.detail) : new Error('API error');
        }
        return r.json();
      })
      .then(game => {
        setGameState(game);
        fetchGames(); // refresh list
      })
      .catch(e => setError("Failed to start new game."))
      .finally(() => setLoading(false));
  }, [firstPlayer, fetchGames]);

  // Make a move
  const makeMove = (row, col) => {
    if (!gameState || gameState.status !== "in_progress") return;
    setLoading(true);
    setError("");

    fetch(`${API_BASE}/games/${gameState.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row, col, player: gameState.next_player })
    })
      .then(async (r) => {
        if (!r.ok) {
          const e = await r.json();
          throw (e && e.detail) ? new Error(e.detail) : new Error('Move not accepted');
        }
        return r.json();
      })
      .then(setGameState)
      .then(() => fetchGames())
      .catch(() => setError("Invalid move or server error."))
      .finally(() => setLoading(false));
  };

  // When selecting a game from history
  const handleSelectGame = (gameId) => {
    fetchGameState(gameId);
  };

  // Initial load
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Start a new game by default (on mount) if nothing loaded
  useEffect(() => {
    if (!gameState && games.length === 0 && !loading && !historyLoading) {
      startNewGame();
    }
  }, [gameState, games, loading, historyLoading, startNewGame]);

  // Set board to blank if no game loaded
  const board = gameState?.board || [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  return (
    <div className="App">
      <header className="App-header" style={{
        alignItems: "flex-start",
        justifyContent: "flex-start",
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: "30px 0 18px 0"
      }}>
        {/* Theme toggle button */}
        <button
          className="theme-toggle"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* Main layout */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: 36,
          alignItems: "flex-start",
          margin: "0 auto",
          width: "100%",
          justifyContent: "center",
          maxWidth: 870
        }}>
          {/* Left: Main game area */}
          <div>
            <h1 className="title"
              style={{
                marginBottom: 20,
                fontWeight: 700,
                color: "#1976d2",
                fontSize: '2.1rem',
                letterSpacing: 0.1,
                textAlign: "center"
              }}
            >
              Tic Tac Toe
            </h1>
            <Board
              board={board}
              disabled={loading || (gameState && gameState.status !== "in_progress")}
              onCellClick={(r, c) => {
                // Only allow click if game is in progress, cell empty, no loading
                if (
                  !loading &&
                  gameState &&
                  gameState.status === "in_progress" &&
                  !board[r][c]
                ) {
                  makeMove(r, c);
                }
              }}
            />
            <GameStatusDisplay gameState={gameState} loading={loading} />
            {loading ? <Spinner /> : null}
            <GameControls
              onNewGame={startNewGame}
              isActive={!!gameState && gameState.status === "in_progress"}
              disabled={loading}
              firstPlayer={firstPlayer}
              setFirstPlayer={setFirstPlayer}
            />
            
            {error && (
              <div style={{
                color: "#c62828",
                background: "#fff7f7",
                marginTop: 16,
                padding: 7,
                borderRadius: 4,
                border: "1px solid #eed",
                maxWidth: 310,
                textAlign: "center",
                fontSize: 14
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Right: Game history panel */}
          <GameHistory
            games={games}
            onSelect={handleSelectGame}
            currentGameId={gameState?.id}
            loading={historyLoading}
          />
        </div>
        
        {/* Minimal responsive style tweak */}
        <style>{`
          @media (max-width: 850px) {
            .App-header > div { flex-direction: column; gap: 24px; }
            aside { margin-left: 0 !important; margin-top: 26px; width:100% !important;}
          }
        `}</style>

        {/* Custom board styles */}
        <style>{`
          .ttt-board .ttt-square:focus {
            outline: 2px solid #1976d2 !important;
          }
          .ttt-square {
            border-radius: 0 !important;
          }
        `}</style>
        {/* Spinner keyframes */}
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg);} }
        `}</style>
      </header>
    </div>
  );
}

export default App;
