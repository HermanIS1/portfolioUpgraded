require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); 
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1); 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 100, 
    message: { error: 'Wysłałeś za dużo wiadomości. Spróbuj ponownie później.' },
    standardHeaders: true, 
    legacyHeaders: false,
});

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("SMTP ERROR:", error);
    } else {
        console.log("SMTP READY - serwer może wysyłać maile");
    }
});

app.post('/api/contact', contactLimiter, async (req, res) => {
    console.log("Form request:", req.body);
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
        console.log("SUKCES: Mail wysłany od " + email);
        res.status(200).json({ success: 'Wysłano!' });
    } catch (error) {
        console.error("BŁĄD NODEMAILER:", error.message); 
        res.status(500).json({ error: 'Błąd serwera.' });
    }
});

// === POPRAWIONE LINKI SPOTIFY (Prawdziwe API) ===
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
        res.status(500).json({ isPlaying: false });
    }
});

app.get('/api/projects', (req, res) => {
    fs.readFile('./projects.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Błąd projektów' });
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => console.log(`Serwer na porcie ${PORT}`));