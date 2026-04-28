const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const GAMESTATE_FILE = path.join(DATA_DIR, 'gamestate.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// INIT FILES
const initFile = (file, defaultValue) => {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
        } else {
            const data = fs.readFileSync(file, 'utf8');
            if (!data || data.trim() === "") {
                fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
            }
        }
    } catch (e) {
        console.log("Init error:", e.message);
        fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
    }
};

initFile(MESSAGES_FILE, []);
initFile(GAMESTATE_FILE, { users: {}, winsEnabled: true });

// SAFE READ
const readJSON = async (file, fallback) => {
    try {
        const data = await fs.promises.readFile(file, 'utf8');
        if (!data || data.trim() === "") return fallback;
        return JSON.parse(data);
    } catch (e) {
        console.log("JSON read error:", file, e.message);
        return fallback;
    }
};

// WRITE
const writeJSON = async (file, data) => {
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2));
};

const validateMessage = (b) => b && b.header && b.symbol;

// WINNING
app.get('/api/messages/winning', async (req, res) => {
    const messages = await readJSON(MESSAGES_FILE, []);
    res.json(messages.filter(m => m.type === 'winning'));
});

app.post('/api/messages/winning', async (req, res) => {
    if (!validateMessage(req.body)) return res.status(400).json({ error: 'Invalid' });

    const messages = await readJSON(MESSAGES_FILE, []);

    const newMsg = {
        _id: Date.now().toString(),
        header: req.body.header,
        symbol: req.body.symbol,
        type: 'winning'
    };

    messages.push(newMsg);
    await writeJSON(MESSAGES_FILE, messages);

    res.json(newMsg);
});

app.delete('/api/messages/winning/:id', async (req, res) => {
    const messages = await readJSON(MESSAGES_FILE, []);
    const filtered = messages.filter(m => m._id !== req.params.id);
    await writeJSON(MESSAGES_FILE, filtered);
    res.json({ message: 'Deleted' });
});

// LOSING
app.get('/api/messages/losing', async (req, res) => {
    const messages = await readJSON(MESSAGES_FILE, []);
    res.json(messages.filter(m => m.type === 'losing'));
});

app.post('/api/messages/losing', async (req, res) => {
    if (!validateMessage(req.body)) return res.status(400).json({ error: 'Invalid' });

    const messages = await readJSON(MESSAGES_FILE, []);

    const newMsg = {
        _id: Date.now().toString(),
        header: req.body.header,
        symbol: req.body.symbol,
        type: 'losing'
    };

    messages.push(newMsg);
    await writeJSON(MESSAGES_FILE, messages);

    res.json(newMsg);
});

app.delete('/api/messages/losing/:id', async (req, res) => {
    const messages = await readJSON(MESSAGES_FILE, []);
    const filtered = messages.filter(m => m._id !== req.params.id);
    await writeJSON(MESSAGES_FILE, filtered);
    res.json({ message: 'Deleted' });
});

// GAMESTATE
app.get('/api/gamestate', async (req, res) => {
    const { userId } = req.query;
    const all = await readJSON(GAMESTATE_FILE, { users: {} });

    if (!userId) return res.json(all);

    res.json(all.users[userId] || {
        gamePlayed: false,
        clickedBoxIndex: -1,
        wasWin: false
    });
});

app.post('/api/gamestate', async (req, res) => {
    const { userId, gamePlayed, clickedBoxIndex, wasWin } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const all = await readJSON(GAMESTATE_FILE, { users: {} });

    // Merge with existing state (partial update)
    const existing = all.users[userId] || {
        gamePlayed: false,
        clickedBoxIndex: -1,
        wasWin: false
    };

    all.users[userId] = {
        gamePlayed: 'gamePlayed' in req.body ? !!gamePlayed : existing.gamePlayed,
        clickedBoxIndex: 'clickedBoxIndex' in req.body ? (clickedBoxIndex ?? -1) : existing.clickedBoxIndex,
        wasWin: 'wasWin' in req.body ? !!wasWin : existing.wasWin
    };

    await writeJSON(GAMESTATE_FILE, all);
    res.json(all.users[userId]);
});

app.delete('/api/gamestate', async (req, res) => {
    await writeJSON(GAMESTATE_FILE, { users: {} });
    res.json({ message: 'reset done' });
});

// SETTINGS
app.get('/api/settings', async (req, res) => {
    const all = await readJSON(GAMESTATE_FILE, { users: {}, winsEnabled: true });
    res.json({ winsEnabled: all.winsEnabled !== false });
});

app.post('/api/settings', async (req, res) => {
    const { winsEnabled } = req.body;
    const all = await readJSON(GAMESTATE_FILE, { users: {}, winsEnabled: true });
    all.winsEnabled = !!winsEnabled;
    await writeJSON(GAMESTATE_FILE, all);
    res.json({ winsEnabled: all.winsEnabled });
});

// ROOT
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});