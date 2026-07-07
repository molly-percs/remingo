# ReMingo

A Chrome/Edge browser extension that rewrites a dictated email draft (e.g. from Wispr Flow)
in your own writing style, directly inside Gmail, Outlook, WEB.DE, or any webmail — no custom
mail client needed.

## Workflow

1. Dictate or type a rough draft into any email compose box, using Wispr Flow or just typing.
   The extension has nothing to do with drafting itself — it only acts on text already there.
2. Click the ReMingo toolbar icon. A small "✎ Rewrite in my style" button appears next to
   whatever's relevant: a partial text selection takes priority if you've highlighted one,
   otherwise the whole focused field. Focusing a subject-line field instead shows
   "✎ Generate subject."
   - If nothing is focused/selected, a brief hint explains what to do instead of doing nothing.
3. Click that button. The draft is sent to a local server, which asks Gemini to rewrite it in
   your style (or generate a subject line based on the email body).
4. A preview panel shows the result before anything is written back. From there:
   - **Accept** writes it into the field.
   - **Cancel** discards it, untouched.
   - Type what you'd like changed and click **Improve** to revise the current preview and try
     again — loop as many times as needed before accepting.

## Architecture

```
extension/              Manifest V3 Chrome/Edge extension
  manifest.json          permissions, content script registration (all_frames +
                         match_origin_as_fallback, so it also works inside webmail providers
                         that load their compose UI in a nested/cross-origin iframe, e.g. WEB.DE)
  background.js          service worker; the only piece allowed to fetch localhost (CORS-exempt
                         via host_permissions); relays the toolbar-icon click to content scripts
  content.js              tracks focus/selection continuously (not just at click time, since
                         clicking the toolbar icon blurs the page first); shows the trigger
                         button, the accept/improve preview panel, and the no-target hint;
                         reads/writes the field via native setters or execCommand("insertText")
  content.css             styling for the button, panel, and hint
  icons/                  16/32/48/128 px, generated from the ReMingo logo
  new-logo/               drop a replacement logo PNG here to regenerate the icon set

server/                 Minimal local Express server (Node/TypeScript)
  src/index.ts             POST /rewrite, /subject, /improve
  src/gemini.ts             Gemini API client (plain API key, no Google Cloud project needed)
  src/skill.ts              loads server/data/mail-skill.md (personal writing-style guide)
  src/rewrite.ts            draft -> full styled email, preserving facts, matching input language
  src/subject.ts            email body -> subject line, matching input language
  src/improve.ts            current draft + a free-text instruction -> revised draft
  data/mail-skill.md        the writing-style guide every prompt is built around
  .env                      GEMINI_API_KEY (from https://aistudio.google.com/apikey)
  autostart/                scripts to run the server silently in the background at login,
                            with no terminal window: Start/Stop Server Now, Enable/Disable
                            Autostart (see their own comments for details)
```

## Why "any webmail," not just Gmail

Instead of writing Gmail-specific (then Outlook-specific, then ...) DOM scraping, the content
script acts on **whatever editable field currently has focus or is selected** — textarea,
`<input>`, or any `contenteditable` element, in any frame on the page. That works identically
across webmail providers with zero per-site code, including ones that load their compose UI in
a separate iframe.

## Why the writing style is a Markdown skill file, not a JSON profile

`server/data/mail-skill.md` is a structured, hand-written style guide (greeting/closing rules,
du/Sie logic, tone examples, structure template) — more precise for an LLM to follow than a
flat JSON summary would be. To update your style, edit this file directly and restart the
server; no other code needs to change.

## Security note

The Gemini API key **must never be embedded in the extension** — extensions are unzippable,
client-side code, so any secret placed there is effectively public. The key lives only in
`server/.env`; the extension's background script never touches it directly, it only ever calls
`http://localhost:4318/*` on the local server, which holds the key server-side.

## Running it

**Server** (must be running for the extension to work):
```
cd server
npm install   # first time only
npm run dev
```
Listens on `http://localhost:4318`. For running it silently in the background instead of in a
terminal, see `server/autostart/`.

**Extension** (load once per browser, unpacked — no store review needed for personal use):
- Chrome: go to `chrome://extensions`, enable **Developer mode** (top right), click
  **Load unpacked**, select the `extension/` folder.
- Edge: go to `edge://extensions`, enable **Developer mode**, click **Load unpacked**, select
  the same `extension/` folder. Same package, no changes needed.

After loading, reload any already-open webmail tab so the content script attaches.

## Known limitations / things to revisit later

- `execCommand("insertText", ...)` (used to write text back into `contenteditable` compose
  boxes) is a deprecated API, but still broadly supported and the most reliable way to make
  frameworks like Gmail's own editor recognize a programmatic text change. The fallback is a
  direct text assignment plus a manual `input` event, which is less reliable at getting the
  host page's own JS to notice the change.
- The extension itself is always loaded as raw unpacked source (Chrome doesn't allow silently
  installing unpacked extensions any other way). The server has a separate zero-setup build
  (bundled Node runtime, precompiled server, production `node_modules`) published as a zip
  under Releases, for people who don't want to install Node or run npm themselves.
- Single-user, single writing-style profile, single Gemini API key. No per-user accounts or
  multi-tenant support.
