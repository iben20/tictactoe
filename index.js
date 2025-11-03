import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Initialize leaderboard file if it doesn't exist
if (!fs.existsSync(LEADERBOARD_FILE)) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
}

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const leaderboard = JSON.parse(data);
    // Sort by wins (descending), then by games played (ascending)
    const sorted = leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.games - b.games;
    });
    res.json(sorted.slice(0, 10)); // Return top 10
  } catch (error) {
    res.status(500).json({ error: 'Failed to read leaderboard' });
  }
});

// Add or update player score
app.post('/api/leaderboard', (req, res) => {
  try {
    const { playerName, result } = req.body;
    
    if (!playerName || !result) {
      return res.status(400).json({ error: 'Player name and result are required' });
    }

    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    let leaderboard = JSON.parse(data);

    // Find existing player
    const playerIndex = leaderboard.findIndex(p => p.name === playerName);

    if (playerIndex !== -1) {
      // Update existing player
      leaderboard[playerIndex].games += 1;
      if (result === 'win') {
        leaderboard[playerIndex].wins += 1;
      } else if (result === 'loss') {
        leaderboard[playerIndex].losses += 1;
      } else if (result === 'draw') {
        leaderboard[playerIndex].draws += 1;
      }
    } else {
      // Add new player
      const newPlayer = {
        name: playerName,
        games: 1,
        wins: result === 'win' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        draws: result === 'draw' ? 1 : 0
      };
      leaderboard.push(newPlayer);
    }

    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// Reset leaderboard (for testing)
app.delete('/api/leaderboard', (req, res) => {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset leaderboard' });
  }
});

app.listen(PORT, () => {
  console.log(`Leaderboard API running on http://localhost:${PORT}`);
});