document.addEventListener("DOMContentLoaded", () => {
  initIntro();
  initReveal();
  initScrollSigil();
  initContactForm();
  initSpotify();
  initProjects();
  initTerminal();

  initPageTransitions();
});

/* ================= GLOBAL ================= */

const INTRO_DURATION = 2800;

/* ================= INTRO ================= */

function initIntro() {
  const intro = document.getElementById("intro-screen");
  if (!intro) return;

  const alreadyPlayed = sessionStorage.getItem("introPlayed");

  if (alreadyPlayed) {
    intro.style.display = "none";
    return;
  }

  setTimeout(() => {
    intro.classList.add("fade-out");

    setTimeout(() => {
      intro.style.display = "none";
    }, 800);

    sessionStorage.setItem("introPlayed", "true");
  }, 2000);
}
/* ================= REVEAL ================= */

function initReveal() {
  const sections = document.querySelectorAll("section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 },
  );

  sections.forEach((section) => {
    section.classList.add("hidden");
    observer.observe(section);
  });
}

/* ================= SCROLL SIGIL ================= */

function initScrollSigil() {
  const sigil = document.getElementById("scroll-sigil");
  if (!sigil) return;

  let lastScroll = window.scrollY;
  let timeout;

  window.addEventListener("scroll", () => {
    const current = window.scrollY;

    if (current > lastScroll) {
      sigil.style.top = "auto";
      sigil.style.bottom = "40px";
    } else {
      sigil.style.bottom = "auto";
      sigil.style.top = "40px";
    }

    sigil.style.opacity = "1";

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      sigil.style.opacity = "0";
    }, 700);

    lastScroll = current;
  });
}

/* ================= CONTACT FORM ================= */

function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    const btn = form.querySelector(".btn-submit");
    const original = btn.innerText;

    btn.innerText = "Sending...";
    btn.disabled = true;

    status.textContent = "Sending message...";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });

      const data = await res.json();

      if (res.ok) {
        form.reset();

        status.innerHTML = "✓ MESSAGE DELIVERED";
        status.className = "form-status success";

        setTimeout(() => {
          status.innerHTML = "";
        }, 3500);
      } else {
        status.textContent = data.error || "Something went wrong";
        status.className = "form-status error";
      }
    } catch (err) {
      console.error(err);

      status.textContent = "Server error";
      status.className = "form-status error";
    }

    btn.innerText = original;
    btn.disabled = false;
  });
}

/* ================= SPOTIFY ================= */

function initSpotify() {
  fetchSpotify();
  setInterval(fetchSpotify, 15000);
}

async function fetchSpotify() {
  const track = document.querySelector(".spotify-track");
  const cover = document.querySelector(".spotify-cover");
  const label = document.querySelector(".spotify-label");

  if (!track || !cover || !label) return;

  try {
    const res = await fetch("/api/spotify");
    const data = await res.json();

    if (data.isPlaying) {
      label.innerText = "NOW PLAYING";

      track.innerHTML = `
<a href="${data.songUrl}" target="_blank"
style="color:inherit;text-decoration:none;">
${data.artist} – ${data.title}
</a>`;

      cover.src = data.albumImageUrl;
    } else {
      label.innerText = "PAUSED";
      track.innerText = "nic nie leci";
      cover.src = "images/chivas-cover.png";
    }
  } catch (err) {
    console.error("Spotify error:", err);
  }
}

/* ================= PROJECTS ================= */

function initProjects() {
  loadProjects();
}

/* ================= CARD GENERATOR ================= */

function createProjectCard(p, mode = "preview") {
  return `
  <div class="project-card">

    <div class="project-preview">
      <img src="${p.image || "images/project1.png"}" alt="${p.title}">

      ${
        mode === "preview"
          ? `
      <div class="project-overlay">
        ${p.live ? `<a href="${p.live}" target="_blank" class="project-btn">LIVE</a>` : ""}
        ${p.github ? `<a href="${p.github}" target="_blank" class="project-btn">CODE</a>` : ""}
      </div>
      `
          : ""
      }

    </div>

    <div class="project-content">
      <h4>${p.title}</h4>
      <p>${p.description}</p>

      ${
        mode === "full"
          ? `
      <div class="project-actions">
        ${p.live ? `<a href="${p.live}" target="_blank" class="project-link">LIVE</a>` : ""}
        ${p.github ? `<a href="${p.github}" target="_blank" class="project-link secondary">CODE</a>` : ""}
        ${p.WorkInProgress ? `<span class="project-wip">${p.WorkInProgress}</span>` : ""}
      </div>
      `
          : ""
      }

    </div>

  </div>
  `;
}

/* ================= LOAD ================= */

async function loadProjects() {
  const preview = document.getElementById("projects-preview");
  const container = document.getElementById("projects-container");

  try {
    const res = await fetch("/api/projects");
    const projects = await res.json();

    /* ===== GŁÓWNA ===== */

    if (preview) {
      preview.innerHTML = "";

      projects.slice(0, 3).forEach((p) => {
        preview.innerHTML += createProjectCard(p, "preview");
      });
    }

    /* ===== PROJECTS PAGE ===== */

    if (container) {
      container.innerHTML = "";

      projects.forEach((p) => {
        const section = document.createElement("section");
        section.className = "section-box";

        section.innerHTML = `
          <h3>${p.title}</h3>

          ${createProjectCard(p, "full")}

          <div class="tech" style="margin-top:10px;">
            ${p.tech || ""}
          </div>
        `;

        container.appendChild(section);
      });
    }
  } catch (err) {
    console.error("Projects error:", err);
  }
}

/* ================= TERMINAL ================= */
function initTerminal() {
  const text = document.getElementById("terminal-text");
  const inputLine = document.querySelector(".terminal-input-line");
  const input = document.getElementById("terminal-input");

  if (!text) return;

  const lines = [
    "herman@dev:~$ boot portfolio",
    "loading modules...",
    "spotify connected",
    "projects loaded",
    "welcome back, herman",
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
        text.textContent += "\n";
        line++;
        char = 0;
        setTimeout(type, 250);
      }
    } else {
      if (inputLine) inputLine.style.display = "flex";
      if (input) input.focus();
    }
  }

  type();
}
/* ================= BLOCK COPY ================= */

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

document.addEventListener("dragstart", (e) => {
  e.preventDefault();
});

function initPageTransitions() {
  const links = document.querySelectorAll("a");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const url = link.getAttribute("href");

      if (!url) return;
      if (url.startsWith("#")) return;
      if (url.startsWith("http")) return;
      if (link.target === "_blank") return;

      e.preventDefault();

      const transition = document.getElementById("page-transition");

      if (transition) {
        transition.classList.add("active");
      }

      setTimeout(() => {
        window.location.href = url;
      }, 400);
    });
  });
}

// FAILSAFE jeśli coś rozwali JS wcześniej
window.addEventListener("load", () => {
  const intro = document.getElementById("intro-screen");
  if (intro) {
    setTimeout(() => {
      intro.classList.add("fade-out");

      setTimeout(() => {
        intro.style.display = "none";
      }, 800);
    }, 2500);
  }
});
