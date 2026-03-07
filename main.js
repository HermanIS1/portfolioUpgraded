document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. INTRO (Ładowanie strony)
    // ==========================================
    const introScreen = document.getElementById("intro-screen");
    if (introScreen) {
        if (!sessionStorage.getItem("introPlayed")) {
            setTimeout(() => {
                introScreen.classList.add("fade-out");
                sessionStorage.setItem("introPlayed", "true");
                setTimeout(() => {
                    introScreen.style.display = "none";
                }, 800); 
            }, 2000);
        } else {
            introScreen.style.display = "none";
        }
    }

    // ==========================================
    // 2. INTENT (Podświetlanie sekcji po najechaniu)
    // ==========================================
    const intentSections = document.querySelectorAll(".section-box");
    intentSections.forEach(section => {
        section.addEventListener("mouseenter", () => section.classList.add("intent"));
        section.addEventListener("mouseleave", () => section.classList.remove("intent"));
    });

    // ==========================================
    // 3. REVEAL (Pojawianie się sekcji przy scrollu)
    // ==========================================
    const revealSections = document.querySelectorAll("section");
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.2 });

    revealSections.forEach(section => {
        section.classList.add("hidden");
        revealObserver.observe(section);
    });

    // ==========================================
    // 4. SCROLL SIGIL (Pentagram na dole)
    // ==========================================
    let lastScrollY = window.scrollY;
    let sigilTimeout = null;
    const sigil = document.getElementById("scroll-sigil");

    if (sigil) {
        window.addEventListener("scroll", () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY) {
                sigil.style.top = "auto";
                sigil.style.bottom = "30px";
            } else {
                sigil.style.bottom = "auto";
                sigil.style.top = "30px";
            }

            sigil.style.opacity = "1";

            if (sigilTimeout) clearTimeout(sigilTimeout);
            sigilTimeout = setTimeout(() => {
                sigil.style.opacity = "0";
            }, 600);

            lastScrollY = currentScrollY;
        });
    }

    // Reset scrolla na start
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        history.scrollRestoration = "manual";
        window.scrollTo(0, 0);
    }

    // ==========================================
    // 5. OBSŁUGA FORMULARZA KONTAKTOWEGO
    // ==========================================
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("email").value;
            const messageInput = document.getElementById("message").value;
            const submitBtn = contactForm.querySelector('.btn-submit');

            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Wysyłanie...";
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput, message: messageInput })
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Wiadomość wysłana! Dzięki.");
                    contactForm.reset();
                } else {
                    alert("Ups: " + result.error);
                }
            } catch (error) {
                console.error("Błąd sieci:", error);
                alert("Nie udało się połączyć z serwerem.");
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 6. SPOTIFY WIDGET NA ŻYWO
    // ==========================================
    const fetchSpotifyData = async () => {
        const trackElement = document.querySelector('.track');
        const coverElement = document.querySelector('.cover img');
        const labelElement = document.querySelector('.label');
        const cdDisc = document.querySelector('.cd-disc');

        if (!trackElement || !coverElement || !labelElement || !cdDisc) return;

        try {
            const response = await fetch('/api/spotify');
            const data = await response.json();

            if (data.isPlaying) {
                labelElement.innerText = "NOW LISTENING";
                trackElement.innerHTML = `<a href="${data.songUrl}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px solid var(--green);">${data.artist} – ${data.title}</a>`;
                coverElement.src = data.albumImageUrl;
                cdDisc.style.left = '85px';
                cdDisc.style.animationPlayState = 'running';
            } else {
                labelElement.innerText = "PAUSED";
                trackElement.innerText = "Cisza w eterze...";
                coverElement.src = "images/chivas-cover.png";
                cdDisc.style.left = '45px';
                cdDisc.style.animationPlayState = 'paused';
            }
        } catch (error) {
            console.error("Błąd ładowania Spotify:", error);
        }
    };

    // ==========================================
    // 7. DYNAMICZNE ŁADOWANIE PROJEKTÓW
    // ==========================================
    const loadProjects = async () => {
        const container = document.getElementById('projects-container');
        if (!container) return;

        try {
            const response = await fetch('/api/projects');
            const projects = await response.json();

            container.innerHTML = ""; 

            projects.forEach(p => {
                const section = document.createElement('section');
                section.className = 'section-box visible'; 
                section.innerHTML = `
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                    <span>${p.tech}</span>
                    <div class="links">
                        ${p.live ? `<a href="${p.live}" target="_blank">live</a>` : ''}
                        <a href="${p.github}" target="_blank">github</a>
                    </div>
                `;
                container.appendChild(section);
            });
        } catch (error) {
            console.error("Błąd ładowania projektów:", error);
            container.innerHTML = "<p>Nie udało się załadować projektów.</p>";
        }
    };

    // Odpalanie funkcji
    fetchSpotifyData();
    setInterval(fetchSpotifyData, 15000);
    loadProjects();

}); // <--- TEGO BRAKOWAŁO! To zamyka całe DOMContentLoaded