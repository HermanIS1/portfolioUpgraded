require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// ==============================
// RATE LIMITER FORMULARZA
// ==============================

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: { error: 'Wysłałeś za dużo wiadomości. Spróbuj ponownie później.' },
    standardHeaders: true,
    legacyHeaders: false,
});


app.post('/api/contact', contactLimiter, async (req, res) => {

    console.log("Form request:", req.body);

    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Wypełnij wszystkie pola!' });
    }

    try {

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: process.env.EMAIL_USER,
            subject: `Wiadomość od: ${email}`,
            text: message,
            reply_to: email
        });

        console.log("MAIL WYSŁANY");

        res.status(200).json({ success: 'Wysłano!' });

    } catch (error) {

        console.error("MAIL ERROR:", error);

        res.status(500).json({ error: 'Błąd serwera.' });
    }
});


// ==============================
// SPOTIFY API
// ==============================

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
            'Authorization':
                'Basic ' +
                Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID +
                    ':' +
                    process.env.SPOTIFY_CLIENT_SECRET
                ).toString('base64')
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
            headers: { Authorization: 'Bearer ' + accessToken }
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


// ==============================
// PROJEKTY
// ==============================

app.get('/api/projects', (req, res) => {

    fs.readFile('./projects.json', 'utf8', (err, data) => {

        if (err) {
            return res.status(500).json({ error: 'Błąd projektów' });
        }

        res.json(JSON.parse(data));
    });
});


// ==============================
// START SERWERA
// ==============================

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});