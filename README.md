# ReMingo

A Chrome/Edge browser extension that rewrites a dictated or typed email draft in your own
writing style, directly inside Gmail, Outlook, WEB.DE, or any webmail — no custom mail client
needed. A small local server calls Gemini to do the rewriting; nothing about your email content
goes anywhere except to Google's Gemini API, using your own API key.

## What it does

1. Draft an email as usual — dictate it, type it, whatever — in any webmail compose box.
2. Click the ReMingo toolbar icon. A small button appears next to the relevant text (a
   selection if you've highlighted one, otherwise the whole field; a subject field gets its own
   "Generate subject" button).
3. Click it. The draft is sent to your local server, which asks Gemini to rewrite it in your
   style (or generate a subject line).
4. A preview panel shows the result before anything is written back — **Accept** it, **Cancel**
   it, or type what you'd like changed and click **Improve** to revise it, looping as needed.

## Quick start (non-technical / zero setup)

If you just want to run this without touching any code, use the prebuilt zip from the
[Releases](../../releases) page instead of this repo directly: it bundles its own copy of
Node.js, has all dependencies pre-installed, and only needs a Gemini API key pasted into one
file. See the README inside that zip for the exact steps.

## Running from source

**Requirements:** Node.js 18+.

```bash
cd server
npm install
cp .env.example .env
```

Then get a free Gemini API key from https://aistudio.google.com/apikey, paste it into
`server/.env` after `GEMINI_API_KEY=`, and start the server:

```bash
npm run dev
```

It listens on `http://localhost:4318`. Confirm it's up with `http://localhost:4318/health`.

For running it silently in the background instead of in a terminal window, see the scripts in
`server/autostart/` (Windows only for now).

**Load the extension:**
1. Go to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**, select this repo's `extension/` folder.
4. Reload any already-open webmail tab so the content script attaches.

## Making it sound like you

`server/data/mail-skill.md` is the writing-style guide every rewrite is built around. The
version in this repo is a generic template — replace its rules and examples with your own
greeting/closing conventions, tone, and a few real sample sentences. The more specific it is,
the more the output sounds like you instead of a generic assistant. Restart the server after
editing it.

## Architecture, known limitations, and design notes

See [SPEC.md](SPEC.md) for how the pieces fit together (why it works across any webmail
provider including ones that load their compose UI in an iframe, why the style guide is a
Markdown file, security notes on the API key, etc.).

## License

MIT — see [LICENSE](LICENSE).
