const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const GAMESTATE_FILE = path.join(DATA_DIR, 'gamestate.json');

// Init files
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}

if (!fs.existsSync(GAMESTATE_FILE)) {
    fs.writeFileSync(GAMESTATE_FILE, JSON.stringify({
        gamePlayed: false,
        clickedBoxIndex: -1,
        wasWin: false
    }));
}

// Async helpers (ավելի լավ է, քան sync)
const readJSON = async (file) => {
    const data = await fs.promises.readFile(file, 'utf8');
    return JSON.parse(data);
};

const writeJSON = async (file, data) => {
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2));
};

// Validation
const validateMessage = (body) => {
    return body.header && body.symbol;
};

// -------- ROUTES --------

// Winning
app.get('/api/messages/winning', async (req, res) => {
    try {
        const messages = (await readJSON(MESSAGES_FILE)).filter(m => m.type === 'winning');
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/messages/winning', async (req, res) => {
    try {
        if (!validateMessage(req.body)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        const messages = await readJSON(MESSAGES_FILE);
        const newMsg = {
            _id: Date.now().toString(),
            header: req.body.header,
            symbol: req.body.symbol,
            type: 'winning'
        };

        messages.push(newMsg);
        await writeJSON(MESSAGES_FILE, messages);

        res.json(newMsg);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/messages/winning/:id', async (req, res) => {
    try {
        const messages = await readJSON(MESSAGES_FILE);
        const filtered = messages.filter(m => m._id !== req.params.id);

        await writeJSON(MESSAGES_FILE, filtered);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Losing
app.get('/api/messages/losing', async (req, res) => {
    try {
        const messages = (await readJSON(MESSAGES_FILE)).filter(m => m.type === 'losing');
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/messages/losing', async (req, res) => {
    try {
        if (!validateMessage(req.body)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        const messages = await readJSON(MESSAGES_FILE);

        const newMsg = {
            _id: Date.now().toString(),
            header: req.body.header,
            symbol: req.body.symbol,
            type: 'losing'
        };

        messages.push(newMsg);
        await writeJSON(MESSAGES_FILE, messages);

        res.json(newMsg);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/messages/losing/:id', async (req, res) => {
    try {
        const messages = await readJSON(MESSAGES_FILE);
        const filtered = messages.filter(m => m._id !== req.params.id);

        await writeJSON(MESSAGES_FILE, filtered);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GameState
app.get('/api/gamestate', async (req, res) => {
    try {
        const gameState = await readJSON(GAMESTATE_FILE);
        res.json(gameState);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/gamestate', async (req, res) => {
    try {
        const gameState = await readJSON(GAMESTATE_FILE);

        const updated = { ...gameState, ...req.body };

        await writeJSON(GAMESTATE_FILE, updated);
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/gamestate', async (req, res) => {
    try {
        const reset = {
            gamePlayed: false,
            clickedBoxIndex: -1,
            wasWin: false
        };

        await writeJSON(GAMESTATE_FILE, reset);
        res.json({ message: 'Reset done' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Better IP detection
const getLocalIP = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

// Start
app.listen(PORT, HOST, () => {
    const ip = getLocalIP();

    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://${ip}:${PORT}`);
    console.log(`Admin: http://${ip}:${PORT}/admin.html`);
});