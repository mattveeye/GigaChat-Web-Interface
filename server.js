const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const https = require('https');
const config = require('./config');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// HTTPS agent for Sberbank API
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Get access token
async function getAccessToken() {
    try {
        const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': generateRqUID(),
                'Authorization': `Basic ${config.GIGACHAT_API_KEY}`
            },
            body: 'scope=GIGACHAT_API_PERS',
            agent: httpsAgent
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw new Error(`Token error: ${error.message}`);
    }
}

// Generate RqUID
function generateRqUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const tokenData = await getAccessToken();
        
        const chatResponse = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify({
                model: 'GigaChat',
                messages: [
                    { role: 'system', content: 'You are GigaChat AI assistant. Respond in Russian.' },
                    { role: 'user', content: message }
                ],
                stream: false,
                repetition_penalty: 1
            }),
            agent: httpsAgent
        });

        if (!chatResponse.ok) {
            throw new Error(`HTTP error! status: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        res.json(chatData);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 