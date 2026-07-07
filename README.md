# ReMingo

A Chrome/Edge extension that rewrites a dictated or typed email draft in your own writing
style, right inside Gmail, Outlook, WEB.DE, or any webmail. No custom mail client needed. A
small local server calls Gemini to do the rewriting. Nothing about your email content goes
anywhere except to Google's Gemini API, using your own API key.

## What it does

1. Draft an email as usual in any webmail compose box, dictated or typed.
2. Click the ReMingo toolbar icon. A small button appears next to the relevant text: a
   selection if you've highlighted one, otherwise the whole field. A subject field gets its
   own "Generate subject" button.
3. Click it. The draft goes to your local server, which asks Gemini to rewrite it in your
   style, or generate a subject line.
4. A preview panel shows the result before anything is written back. **Accept** it, **Cancel**
   it, or type what you'd like changed and click **Improve** to revise it again.

## Quick start (non-technical, zero setup)

If you just want to run this without touching any code, grab the prebuilt zip from
[Releases](../../releases) instead of this repo. It bundles its own copy of Node.js, has all
dependencies already installed, and only needs a Gemini API key. See the README inside that
zip for the exact steps.

## Running from source

**Requirements:** Node.js 18+.

```bash
cd server
npm install
cp .env.example .env
```

Get a free Gemini API key from https://aistudio.google.com/apikey, paste it into
`server/.env` after `GEMINI_API_KEY=`, then start the server:

```bash
npm run dev
```

It listens on `http://localhost:4318`. Check it's up at `http://localhost:4318/health`.

To run it silently in the background instead of in a terminal window, see the scripts in
`server/autostart/` (Windows only for now).

**Load the extension:**
1. Go to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**, select this repo's `extension/` folder.
4. Reload any already-open webmail tab so the content script attaches.

## Making it sound like you

`server/data/mail-skill.md` is the writing-style guide every rewrite is built around. The one
in this repo is a generic template. Replace its rules and examples with your own
greeting/closing habits, tone, and a few real sample sentences. The more specific it is, the
more the output sounds like you instead of a generic assistant. Restart the server after
editing it.

## Architecture and design notes

See [SPEC.md](SPEC.md) for how the pieces fit together: why it works across any webmail
provider, including ones that load their compose UI in an iframe, why the style guide is a
plain Markdown file, and notes on the API key.

## License

MIT. See [LICENSE](LICENSE).
