const SERVER_BASE = "http://localhost:4318";
const ENDPOINTS = { REWRITE: "/rewrite", SUBJECT: "/subject", IMPROVE: "/improve" };

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "SHOW_BUTTON" });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const path = ENDPOINTS[message?.type];
  if (!path) return undefined;

  fetch(`${SERVER_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message.text, instruction: message.instruction }),
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        sendResponse({ ok: false, error: data.error ?? `Server error (${response.status})` });
        return;
      }
      sendResponse({ ok: true, text: data.text ?? "" });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: `Could not reach the local server on localhost:4318. Is it running? (${error.message ?? error})`,
      });
    });

  return true; // keep the message channel open for the async sendResponse above
});
