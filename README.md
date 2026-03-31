# Lumos

**"Lumos!" — Illuminate your knowledge, one slide at a time.**

Lumos is a client-side web app that turns lecture slides into interactive study sessions powered by Gemini AI. Upload a PDF, get instant summaries and per-slide explanations, and chat with AI about any slide — all from your browser, no backend required.

[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://wngjs3.github.io/lumos/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Features

- **PDF Upload & AI Analysis** — Drop in a lecture PDF and Gemini AI generates a concise summary plus detailed explanations for every slide.
- **Per-Slide Q&A Chat** — Ask follow-up questions on any slide with full conversation history preserved.
- **Smart Caching** — LocalStorage caching means you never re-process the same PDF twice.
- **Cost Transparency** — See estimated API cost before processing and track real-time spending via Gemini usage metadata.
- **Custom Prompts** — Tailor the system prompts for summaries, explanations, and Q&A to fit your study style.
- **Math Rendering** — KaTeX support for clean rendering of equations and formulas.
- **Keyboard Navigation** — Browse slides quickly with keyboard shortcuts.
- **Dark Theme UI** — Easy on the eyes during late-night study sessions.

## Quick Start

1. **Visit the live site** — [https://wngjs3.github.io/lumos/](https://wngjs3.github.io/lumos/)
2. **Enter your Gemini API key** when prompted.
3. **Upload a lecture PDF.**
4. **Review** the generated summary and per-slide explanations.
5. **Ask questions** on any slide using the chat panel.

To run locally, clone the repo and serve the files with any static server:

```bash
git clone https://github.com/wngjs3/lumos.git
cd lumos
# Use any static file server, for example:
npx serve .
```

No build step, no dependencies to install — just open and go.

## Tech Stack

| Layer | Technology |
|-------|------------|
| AI | Gemini API (`gemini-3.1-pro-preview`) |
| PDF Parsing | PDF.js |
| Math Rendering | KaTeX |
| Frontend | Vanilla JS (ES modules), HTML, CSS |
| Hosting | GitHub Pages |

## License

This project is licensed under the [MIT License](LICENSE).
