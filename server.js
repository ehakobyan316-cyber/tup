const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const GAMESTATE_FILE = path.join(DATA_DIR, 'gamestate.json');

// Initialize data directory and files
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}

if (!fs.existsSync(GAMESTATE_FILE)) {
    fs.writeFileSync(GAMESTATE_FILE, JSON.stringify({ gamePlayed: false, clickedBoxIndex: -1, wasWin: false }));
}

// Helper functions
const readMessages = () => {
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
};

const writeMessages = (messages) => {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
};

const readGameState = () => {
    const data = fs.readFileSync(GAMESTATE_FILE, 'utf8');
    return JSON.parse(data);
};

const writeGameState = (gameState) => {
    fs.writeFileSync(GAMESTATE_FILE, JSON.stringify(gameState, null, 2));
};

// API Routes

// Winning Messages
app.get('/api/messages/winning', (req, res) => {
    try {
        const messages = readMessages().filter(m => m.type === 'winning');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages/winning', (req, res) => {
    try {
        const { header, symbol } = req.body;
        const messages = readMessages();
        const message = { _id: Date.now().toString(), header, symbol, type: 'winning' };
        messages.push(message);
        writeMessages(messages);
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/messages/winning/:id', (req, res) => {
    try {
        const messages = readMessages().filter(m => m._id !== req.params.id);
        writeMessages(messages);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Losing Messages
app.get('/api/messages/losing', (req, res) => {
    try {
        const messages = readMessages().filter(m => m.type === 'losing');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages/losing', (req, res) => {
    try {
        const { header, symbol } = req.body;
        const messages = readMessages();
        const message = { _id: Date.now().toString(), header, symbol, type: 'losing' };
        messages.push(message);
        writeMessages(messages);
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/messages/losing/:id', (req, res) => {
    try {
        const messages = readMessages().filter(m => m._id !== req.params.id);
        writeMessages(messages);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Game State
app.get('/api/gamestate', (req, res) => {
    try {
        const gameState = readGameState();
        res.json(gameState);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/gamestate', (req, res) => {
    try {
        const gameState = readGameState();
        Object.assign(gameState, req.body);
        writeGameState(gameState);
        res.json(gameState);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/gamestate', (req, res) => {
    try {
        writeGameState({ gamePlayed: false, clickedBoxIndex: -1, wasWin: false });
        res.json({ message: 'Game state reset' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, HOST, () => {
    const localIP = require('os').networkInterfaces().eth0?.[0]?.address || require('os').networkInterfaces()['Wi-Fi']?.[0]?.address || 'your-local-ip';
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Local access: http://localhost:${PORT}/index.html`);
    console.log(`Network access: http://${localIP}:${PORT}/index.html`);
    console.log(`Admin: http://${localIP}:${PORT}/admin.html`);
});
