document.addEventListener('DOMContentLoaded', () => {
    initIntro();
    initReveal();
    initScrollSigil();
    initContactForm();
    initProjects();
    initTerminal();
    initTaskbarClock();
    initSecretFolder();

    initPageTransitions();
});

const INTRO_DURATION = 2800;

function initIntro() {
    const intro = document.getElementById('intro-screen');
    const percent = document.getElementById('hack-percent');
    const progress = document.getElementById('hack-progress');
    const log = document.getElementById('hack-log');
    const hackPhase = document.getElementById('hack-phase');
    const accessPhase = document.getElementById('access-phase');

    if (!intro) return;

    const alreadyPlayed = sessionStorage.getItem('introPlayed');

    if (alreadyPlayed) {
        intro.style.display = 'none';
        return;
    }

    const logs = [
        '[SCAN] searching exposed portfolio ports...',
        '[FOUND] /api/projects endpoint',
        '[INJECT] loading interface payload',
        '[DECRYPT] visual_layer.css',
        '[DECRYPT] interface_modules.js',
        '[AUTH] bypassing portfolio protection',
        '[BYPASS] injecting HermanOS kernel',
        '[MOUNT] /public/index.html',
        '[SYNC] synchronizing project database',
        '[VERIFY] checking developer signature',
        '[AUTH] verifying user: HERMAN',
        '[OK] access level elevated',
        '[BOOT] loading interface modules',
        '[OK] HermanOS shell ready',
    ];

    let value = 0;
    let logIndex = 0;

    const percentInterval = setInterval(() => {
        const jump = Math.floor(Math.random() * 7) + 2;

        value += jump;

        if (value > 100) value = 100;

        if (percent) {
            percent.textContent = `${value}%`;
        }

        if (progress) {
            progress.style.width = `${value}%`;
        }

        if (log && logIndex < logs.length && value >= logIndex * 7) {
            log.textContent += logs[logIndex] + '\n';

            log.scrollTop = log.scrollHeight;

            logIndex++;
        }

        if (value >= 100) {
            clearInterval(percentInterval);

            setTimeout(() => {
                if (hackPhase) {
                    hackPhase.style.transition = '0.4s ease';
                    hackPhase.style.opacity = '0';
                }

                if (accessPhase) {
                    accessPhase.classList.add('active');
                }
            }, 450);

            setTimeout(() => {
                intro.classList.add('fade-out');
            }, 2200);

            setTimeout(() => {
                intro.style.display = 'none';

                sessionStorage.setItem('introPlayed', 'true');
            }, 3000);
        }
    }, 115);
}

function initReveal() {
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        { threshold: 0.2 }
    );

    sections.forEach((section) => {
        section.classList.add('hidden');
        observer.observe(section);
    });
}

function initScrollSigil() {
    const sigil = document.getElementById('scroll-sigil');
    if (!sigil) return;

    let lastScroll = window.scrollY;
    let timeout;

    window.addEventListener('scroll', () => {
        const current = window.scrollY;

        if (current > lastScroll) {
            sigil.style.top = 'auto';
            sigil.style.bottom = '40px';
        } else {
            sigil.style.bottom = 'auto';
            sigil.style.top = '40px';
        }

        sigil.style.opacity = '1';

        clearTimeout(timeout);

        timeout = setTimeout(() => {
            sigil.style.opacity = '0';
        }, 700);

        lastScroll = current;
    });
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    if (!form || !status) return;

    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const websiteInput = document.getElementById('website');
    const button = form.querySelector('.mail-send-btn');

    if (!emailInput || !messageInput || !button) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        const website = websiteInput?.value ?? '';

        const originalButtonText = button.textContent;

        button.disabled = true;
        button.textContent = 'TRANSMITTING...';

        status.textContent = '> ESTABLISHING SECURE CHANNEL...';
        status.className = 'form-status';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    message,
                    website,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Message transmission failed.');
            }

            form.reset();

            status.textContent = '> TRANSMISSION COMPLETE // MESSAGE DELIVERED';
            status.className = 'form-status success';
        } catch (error) {
            console.error('Contact form error:', error.message);

            status.textContent = '> TRANSMISSION FAILED // CONTACT NODE UNAVAILABLE';
            status.className = 'form-status error';
        } finally {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    });
}

function initProjects() {
    loadProjects();
}

function createProjectLink(url, text) {
    try {
        const parsedUrl = new URL(url, window.location.origin);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return null;
        }

        const link = document.createElement('a');

        link.href = parsedUrl.href;
        link.textContent = text;
        link.className = 'project-btn';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        return link;
    } catch {
        return null;
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const preview = document.createElement('div');
    preview.className = 'project-preview';

    const image = document.createElement('img');
    image.src = project.image || 'images/project1.png';
    image.alt = project.title || 'Project preview';

    const projectStatus = document.createElement('div');
    projectStatus.className = 'project-status';
    projectStatus.textContent = project.WorkInProgress ? 'WIP' : 'ONLINE';

    preview.append(image, projectStatus);

    const content = document.createElement('div');
    content.className = 'project-content';

    const title = document.createElement('h4');
    title.textContent = project.title || 'Untitled project';

    const description = document.createElement('p');
    description.textContent = project.description || '';

    const tech = document.createElement('div');
    tech.className = 'project-tech';

    if (typeof project.tech === 'string') {
        project.tech
            .split(/[,.·]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 4)
            .forEach((item) => {
                const tag = document.createElement('span');
                tag.textContent = item;
                tech.append(tag);
            });
    }

    const actions = document.createElement('div');
    actions.className = 'project-actions';

    if (project.live) {
        const liveLink = createProjectLink(project.live, 'LIVE');

        if (liveLink) {
            actions.append(liveLink);
        }
    }

    if (project.github) {
        const githubLink = createProjectLink(project.github, 'CODE');

        if (githubLink) {
            actions.append(githubLink);
        }
    }

    if (project.WorkInProgress) {
        const workInProgress = document.createElement('span');
        workInProgress.className = 'project-wip';
        workInProgress.textContent = String(project.WorkInProgress);

        actions.append(workInProgress);
    }

    content.append(title, description, tech, actions);
    card.append(preview, content);

    return card;
}

function showProjectsError(container, message) {
    if (!container) return;

    const error = document.createElement('p');
    error.className = 'projects-error';
    error.textContent = message;

    container.replaceChildren(error);
}

async function loadProjects() {
    const preview = document.getElementById('projects-preview');
    const container = document.getElementById('projects-container');

    try {
        const res = await fetch('/data/projects.json');

        if (!res.ok) {
            throw new Error(`Projects request failed: ${res.status}`);
        }

        const projects = await res.json();

        if (!Array.isArray(projects)) {
            throw new Error('Projects data is not an array');
        }

        if (preview) {
            preview.replaceChildren();

            projects.slice(0, 3).forEach((project) => {
                preview.append(createProjectCard(project));
            });
        }

        if (container) {
            container.replaceChildren();

            projects.forEach((project) => {
                container.append(createProjectCard(project));
            });
        }
    } catch (error) {
        console.error('Projects error:', error);

        showProjectsError(preview, 'failed to load projects');
        showProjectsError(container, 'failed to load projects database');
    }
}

function initTerminal() {
    const text = document.getElementById('terminal-text');
    const inputLine = document.querySelector('.terminal-input-line');
    const input = document.getElementById('terminal-input');

    if (!text) return;

    const lines = [
        'herman@dev:~$ boot portfolio',
        'loading modules...',
        'security modules loaded',
        'projects loaded',
        'welcome back, herman',
    ];

    let line = 0;
    let char = 0;

    function type() {
        if (line < lines.length) {
            if (char < lines[line].length) {
                text.textContent += lines[line][char];
                char++;
                setTimeout(type, 25);
            } else {
                text.textContent += '\n';
                line++;
                char = 0;
                setTimeout(type, 250);
            }
        } else {
            if (inputLine) inputLine.style.display = 'flex';
            if (input) input.focus();
        }
    }

    type();
}

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});

function initPageTransitions() {
    const links = document.querySelectorAll('a');

    links.forEach((link) => {
        link.addEventListener('click', (e) => {
            const url = link.getAttribute('href');

            if (!url) return;
            if (url.startsWith('#')) return;
            if (url.startsWith('http')) return;
            if (link.target === '_blank') return;

            e.preventDefault();

            const transition = document.getElementById('page-transition');

            if (transition) {
                transition.classList.add('active');
            }

            setTimeout(() => {
                window.location.href = url;
            }, 400);
        });
    });
}

function initTaskbarClock() {
    const clock = document.getElementById('taskbar-clock');
    const date = document.getElementById('taskbar-date');

    if (!clock || !date) return;

    function updateClock() {
        const now = new Date();

        clock.textContent = now.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
        });

        date.textContent = now.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    updateClock();
    setInterval(updateClock, 1000);
}

function initSecretFolder() {
    const folder = document.getElementById('secret-folder');
    const modal = document.getElementById('secret-modal');
    const input = document.getElementById('secret-password');
    const submit = document.getElementById('secret-submit');
    const close = document.getElementById('secret-close');
    const status = document.getElementById('secret-status');

    if (!folder || !modal || !input || !submit || !close || !status) return;

    function openModal() {
        modal.classList.add('active');
        input.value = '';
        status.textContent = '';
        setTimeout(() => input.focus(), 50);
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    function checkPassword() {
        if (input.value === '2137') {
            status.style.color = 'var(--green)';
            status.textContent = 'ACCESS GRANTED';

            setTimeout(() => {
                window.open('https://www.youtube.com/watch?v=iik25wqIuFo', '_blank');
                closeModal();
            }, 500);
        } else {
            status.style.color = 'rgba(255, 60, 90, 0.9)';
            status.textContent = 'ACCESS DENIED';
            input.value = '';
            input.focus();
        }
    }

    folder.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    submit.addEventListener('click', checkPassword);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkPassword();
        if (e.key === 'Escape') closeModal();
    });

    close.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function initCVModal() {
    const openBtn = document.getElementById('open-cv-btn');
    const overlay = document.getElementById('cv-modal-overlay');
    const closeBtn = document.getElementById('cv-close-btn');

    if (!openBtn || !overlay || !closeBtn) return;

    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCVModal();
});

let spotifyState = null;
let spotifyProgressTimer = null;

function formatSpotifyTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return `${minutes}:${seconds}`;
}

function getSpotifyProgress() {
    if (!spotifyState) return 0;

    let progress = spotifyState.progressMs || 0;

    if (spotifyState.isPlaying) {
        progress += Date.now() - spotifyState.receivedAt;
    }

    return Math.min(progress, spotifyState.durationMs || progress);
}

function updateSpotifyProgress() {
    if (!spotifyState) return;

    const fill = document.getElementById('spotify-progress-fill');
    const currentTime = document.getElementById('spotify-current-time');
    const duration = document.getElementById('spotify-duration');

    if (!fill || !currentTime || !duration) return;

    const progress = getSpotifyProgress();
    const durationMs = spotifyState.durationMs || 0;

    const percentage = durationMs > 0 ? Math.min((progress / durationMs) * 100, 100) : 0;

    fill.style.width = `${percentage}%`;

    currentTime.textContent = formatSpotifyTime(progress);
    duration.textContent = formatSpotifyTime(durationMs);
    updateSpotifyLyrics();
}
function updateSpotifyLyrics() {
    if (!spotifyState?.lyrics?.length) return;

    const previous = document.getElementById('spotify-lyrics-prev');
    const current = document.getElementById('spotify-lyrics-current');
    const next = document.getElementById('spotify-lyrics-next');

    if (!previous || !current || !next) return;

    const progress = getSpotifyProgress();

    let currentIndex = 0;

    for (let i = 0; i < spotifyState.lyrics.length; i++) {
        if (spotifyState.lyrics[i].timeMs <= progress) {
            currentIndex = i;
        } else {
            break;
        }
    }

    previous.textContent = spotifyState.lyrics[currentIndex - 1]?.text || '';

    current.textContent = spotifyState.lyrics[currentIndex]?.text || '---';

    next.textContent = spotifyState.lyrics[currentIndex + 1]?.text || '';
}

function renderSpotify(data) {
    const miniCover = document.getElementById('spotify-mini-cover');
    const miniStatus = document.getElementById('spotify-mini-status');
    const miniTitle = document.getElementById('spotify-mini-title');
    const miniArtist = document.getElementById('spotify-mini-artist');

    const popupCover = document.getElementById('spotify-popup-cover');
    const popupTitle = document.getElementById('spotify-popup-title');
    const popupArtist = document.getElementById('spotify-popup-artist');
    const popupAlbum = document.getElementById('spotify-popup-album');

    const liveIndicator = document.getElementById('spotify-live-indicator');
    const openLink = document.getElementById('spotify-open-link');

    if (
        !miniCover ||
        !miniStatus ||
        !miniTitle ||
        !miniArtist ||
        !popupCover ||
        !popupTitle ||
        !popupArtist ||
        !popupAlbum ||
        !liveIndicator ||
        !openLink
    ) {
        return;
    }

    if (!data.isPlaying && !data.title) {
        miniStatus.textContent = 'SPOTIFY IDLE';
        miniTitle.textContent = 'nothing playing';
        miniArtist.textContent = '---';

        liveIndicator.textContent = '○ IDLE';

        return;
    }

    const cover = data.albumImageUrl || '/images/chivas-cover.png';

    miniCover.src = cover;
    popupCover.src = cover;

    miniTitle.textContent = data.title || 'Unknown track';
    miniArtist.textContent = data.artist || 'Unknown artist';

    popupTitle.textContent = data.title || 'Unknown track';
    popupArtist.textContent = data.artist || 'Unknown artist';
    popupAlbum.textContent = data.album || 'Unknown album';

    miniStatus.textContent = data.isPlaying ? 'NOW PLAYING' : 'PAUSED';
    liveIndicator.textContent = data.isPlaying ? '● LIVE' : 'Ⅱ PAUSED';

    if (data.songUrl) {
        try {
            const url = new URL(data.songUrl);

            if (['http:', 'https:'].includes(url.protocol)) {
                openLink.href = url.href;
            }
        } catch {
            openLink.href = 'https://open.spotify.com/';
        }
    }

    spotifyState = {
        isPlaying: Boolean(data.isPlaying),
        progressMs: Number(data.progressMs) || 0,
        durationMs: Number(data.durationMs) || 0,
        receivedAt: Date.now(),
        lyrics: Array.isArray(data.lyrics) ? data.lyrics : [],
    };

    updateSpotifyProgress();
}

async function fetchSpotifyV2() {
    try {
        const response = await fetch('/api/spotify/now-playing');

        if (!response.ok) {
            throw new Error(`Spotify request failed: ${response.status}`);
        }

        const data = await response.json();

        renderSpotify(data);
    } catch (error) {
        console.error('Spotify V2 error:', error.message);

        const status = document.getElementById('spotify-mini-status');

        if (status) {
            status.textContent = 'SPOTIFY OFFLINE';
        }
    }
}

function initSpotifyV2() {
    fetchSpotifyV2();

    setInterval(fetchSpotifyV2, 10_000);

    spotifyProgressTimer = setInterval(updateSpotifyProgress, 500);
}
