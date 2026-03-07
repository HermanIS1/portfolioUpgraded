require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); 
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();
// Render automatycznie przypisuje port 10000.
const PORT = process.env.PORT || 10000;

// KLUCZOWE DLA RENDERA: Umożliwia poprawne działanie limitera za proxy.
app.set('trust proxy', 1); 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === SEKCJA: LIMITER (Zwiększyłem limit do 100 na czas testów) ===
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina
    max: 100, // Zwiększone z 3 na 100, żebyś się nie zablokował przy testach.
    message: { error: 'Wysłałeś za dużo wiadomości. Spróbuj ponownie później.' },
    standardHeaders: true, 
    legacyHeaders: false,
});

const transporter = nodemailer.createTransport({
    // Zamiast 'smtp.gmail.com' wpisujemy bezpośredni adres IPv4:
    host: '74.125.140.108', 
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        // Ta linia dodatkowo wymusza IPv4:
        servername: 'smtp.gmail.com' 
    }
});
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
        console.log("SUKCES: Mail wysłany od " + email); // Zobaczysz to w logach Rendera.
        res.status(200).json({ success: 'Wiadomość wysłana pomyślnie!' });
    } catch (error) {
        // Loguje dokładny błąd (np. brak hasła), żebyś wiedział co poprawić.
        console.error("BŁĄD NODEMAILER:", error); 
        res.status(500).json({ error: 'Błąd serwera podczas wysyłki maila.' });
    }
});

// === SEKCJA 2: SPOTIFY (Poprawione adresy API) ===
const getSpotifyAccessToken = async () => {
    const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token', // Poprawny URL Spotify.
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
            url: 'https://api.spotify.com/v1/me/player/currently-playing', // Poprawny URL Spotify.
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
        console.error("BŁĄD SPOTIFY:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Błąd połączenia ze Spotify' });
    }
});

// === SEKCJA 3: PROJEKTY ===
app.get('/api/projects', (req, res) => {
    fs.readFile('./projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error("BŁĄD PROJEKTÓW:", err);
            return res.status(500).json({ error: 'Błąd ładowania projektów' });
        }
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Serwer śmiga na porcie ${PORT}`); // Potwierdzenie w logach Rendera.
});