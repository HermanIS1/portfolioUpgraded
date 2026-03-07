require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); 
const rateLimit = require('express-rate-limit'); // <--- Nowa paczka

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === SEKCJA: LIMITER (Ochrona przed spamem) ===
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina (w milisekundach)
    max: 3, // Limit: 3 prośby na IP na godzinę
    message: { error: 'Wysłałeś za dużo wiadomości. Spróbuj ponownie za godzinę.' },
    standardHeaders: true, 
    legacyHeaders: false,
});

// === SEKCJA 1: MAILE (Z DODANYM LIMITEREM) ===
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Dodajemy 'contactLimiter' jako drugi parametr tutaj:
app.post('/api/contact', contactLimiter, async (req, res) => {
    const { email, message } = req.body;
    if (!email || !message) return res.status(400).json({ error: 'Wypełnij wszystkie pola!' });
    
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, 
            to: process.env.EMAIL_USER,
            replyTo: email, 
            subject: `Wiadomość od: ${email}`, 
            text: message
        });
        res.status(200).json({ success: 'Wiadomość wysłana pomyślnie!' });
    } catch (error) {
        res.status(500).json({ error: 'Wystąpił błąd serwera.' });
    }
});

// === SEKCJA 2: SPOTIFY (Bez limitera, bo to tylko odczyt) ===
const getSpotifyAccessToken = async () => {
    const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
        }).toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
        }
    });
    return response.data.access_token;
};

app.get('/api/spotify', async (req, res) => {
    try {
        const accessToken = await getSpotifyAccessToken();
        const response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/me/player/currently-playing',
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        if (response.status === 204 || !response.data || !response.data.item) {
            return res.status(200).json({ isPlaying: false });
        }

        const track = response.data.item;
        res.status(200).json({
            isPlaying: response.data.is_playing,
            title: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            albumImageUrl: track.album.images[0].url,
            songUrl: track.external_urls.spotify
        });
    } catch (error) {
        res.status(500).json({ error: 'Błąd Spotify' });
    }
});

app.listen(PORT, () => {
    console.log(`Serwer śmiga na http://127.0.0.1:${PORT}`);
});

const fs = require('fs');

app.get('/api/projects', (req, res) => {
    fs.readFile('./projects.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd ładowania projektów' });
        }
        res.json(JSON.parse(data));
    });
});