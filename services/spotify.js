const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';

const NOW_PLAYING_CACHE_MS = 10_000;

let accessToken = null;
let accessTokenExpiresAt = 0;

let nowPlayingCache = null;
let nowPlayingCacheAt = 0;

function getMockNowPlaying() {
    return {
        isPlaying: true,
        title: 'Mock Track',
        artist: 'CHIVAS',
        album: 'Spotify V2 Development',
        albumImageUrl: '/images/chivas-cover.png',
        songUrl: 'https://open.spotify.com/',
        progressMs: 87_000,
        durationMs: 194_000,

        lyrics: [
            { timeMs: 0, text: 'SYSTEM INITIALIZED' },
            { timeMs: 30_000, text: 'signal detected' },
            { timeMs: 60_000, text: 'connection established' },
            { timeMs: 85_000, text: 'NOW PLAYING // LIVE SESSION' },
            { timeMs: 105_000, text: 'synchronizing audio stream' },
            { timeMs: 130_000, text: 'packet flow stable' },
            { timeMs: 160_000, text: 'session approaching end' },
        ],

        fetchedAt: Date.now(),
    };
}

async function getAccessToken() {
    if (accessToken && Date.now() < accessTokenExpiresAt - 30_000) {
        return accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Spotify credentials are not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error(`Spotify token request failed: ${response.status}`);
    }

    const data = await response.json();

    accessToken = data.access_token;
    accessTokenExpiresAt = Date.now() + data.expires_in * 1000;

    return accessToken;
}

async function fetchNowPlaying() {
    const token = await getAccessToken();

    const response = await fetch(NOW_PLAYING_URL, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 204) {
        return {
            isPlaying: false,
            fetchedAt: Date.now(),
        };
    }

    if (!response.ok) {
        throw new Error(`Spotify now playing request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.item) {
        return {
            isPlaying: false,
            fetchedAt: Date.now(),
        };
    }

    return {
        isPlaying: Boolean(data.is_playing),
        title: data.item.name || '',
        artist: data.item.artists?.map((artist) => artist.name).join(', ') || '',
        album: data.item.album?.name || '',
        albumImageUrl: data.item.album?.images?.[0]?.url || null,
        songUrl: data.item.external_urls?.spotify || null,
        progressMs: typeof data.progress_ms === 'number' ? data.progress_ms : 0,
        durationMs: typeof data.item.duration_ms === 'number' ? data.item.duration_ms : 0,
        fetchedAt: Date.now(),
    };
}

async function getNowPlaying() {
    if (process.env.SPOTIFY_MOCK === 'true') {
        return getMockNowPlaying();
    }

    const now = Date.now();

    if (nowPlayingCache && now - nowPlayingCacheAt < NOW_PLAYING_CACHE_MS) {
        return nowPlayingCache;
    }

    const data = await fetchNowPlaying();

    nowPlayingCache = data;
    nowPlayingCacheAt = now;

    return data;
}

module.exports = {
    getNowPlaying,
};
