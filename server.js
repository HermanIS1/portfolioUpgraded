require("dotenv").config();

const { getNowPlaying } = require("./services/spotify");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { Resend } = require("resend");

const app = express();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ======================================================
// BASIC HARDENING
// ======================================================

app.disable("x-powered-by");

// Render / reverse proxy

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://i.scdn.co"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
    frameguard: {
      action: "deny",
    },
  }),
);

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );

  next();
});
app.use(
  express.json({
    limit: "10kb",
    type: "application/json",
  }),
);

// ======================================================
// RATE LIMITS
// ======================================================

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  keyGenerator: (req) => {
    if (process.env.RENDER === "true") {
      console.log("IP DEBUG:", {
        xff: req.get("X-Forwarded-For"),
        cfConnectingIp: req.get("CF-Connecting-IP"),
        remoteAddress: req.socket.remoteAddress,
      });

      const forwardedFor = req.get("X-Forwarded-For");

      if (forwardedFor) {
        const clientIp = forwardedFor.split(",")[0].trim();
        return ipKeyGenerator(clientIp);
      }
    }

    return ipKeyGenerator(req.socket.remoteAddress);
  },
});

// ======================================================
// API
// ======================================================

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.get("/debug/ip", (req, res) => {
  if (process.env.IS_PULL_REQUEST !== "true") {
    return res.status(404).json({
      error: "Not found",
    });
  }

  return res.status(200).json({
    render: process.env.RENDER ?? null,
    isPullRequest: process.env.IS_PULL_REQUEST ?? null,
    xForwardedFor: req.get("X-Forwarded-For") || null,
    cfConnectingIp: req.get("CF-Connecting-IP") || null,
    remoteAddress: req.socket.remoteAddress || null,
  });
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  const { email, message, website } = req.body ?? {};

  // Honeypot
  if (website) {
    return res.status(200).json({
      success: true,
    });
  }

  if (typeof email !== "string" || typeof message !== "string") {
    return res.status(400).json({
      error: "Nieprawidłowe dane.",
    });
  }

  const cleanEmail = email.trim();
  const cleanMessage = message.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    cleanEmail.length < 3 ||
    cleanEmail.length > 254 ||
    !emailRegex.test(cleanEmail)
  ) {
    return res.status(400).json({
      error: "Podaj poprawny adres e-mail.",
    });
  }

  if (cleanMessage.length < 10 || cleanMessage.length > 3000) {
    return res.status(400).json({
      error: "Wiadomość musi mieć od 10 do 3000 znaków.",
    });
  }

  if (!resend || !process.env.MAIL_TO) {
    console.error("Missing email configuration");

    return res.status(503).json({
      error: "Formularz kontaktowy jest chwilowo niedostępny.",
    });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || "Herman Portfolio <onboarding@resend.dev>",

      to: process.env.MAIL_TO,

      replyTo: cleanEmail,

      subject: "Nowa wiadomość z hermanportfolio.pl",

      text: [`Nadawca: ${cleanEmail}`, "", cleanMessage].join("\n"),
    });

    if (error) {
      console.error("Resend error:", {
        name: error.name,
        message: error.message,
      });

      return res.status(502).json({
        error: "Nie udało się wysłać wiadomości.",
      });
    }

    console.log("Contact email sent:", data?.id);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Unexpected contact error:", error?.message);

    return res.status(500).json({
      error: "Błąd serwera.",
    });
  }
});

app.get("/api/spotify/now-playing", async (req, res) => {
  try {
    const nowPlaying = await getNowPlaying();

    return res.status(200).json(nowPlaying);
  } catch (error) {
    console.error("Spotify error:", error?.message || "Unknown Spotify error");

    return res.status(503).json({
      error: "Spotify temporarily unavailable.",
    });
  }
});

// ======================================================
// STATIC FRONTEND
// ======================================================

app.use(
  express.static(PUBLIC_DIR, {
    etag: true,
    maxAge: "1h",
  }),
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "Not found",
    });
  }

  return res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request body too large.",
    });
  }

  // Błędny JSON wysłany przez klienta.
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON.",
    });
  }

  console.error("Unhandled server error:", error?.message);

  return res.status(500).json({
    error: "Internal server error.",
  });
});

// ======================================================
// START
// ======================================================

app.listen(PORT, () => {
  console.log(`Herman Portfolio listening on port ${PORT}`);
});
