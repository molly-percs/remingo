(function () {
  const REWRITE_LABEL = "✎ Rewrite in my style";
  const SUBJECT_LABEL = "✎ Generate subject";

  let button = null;
  let panel = null;
  let hint = null;
  let hintHideTimer = null;
  let lastBodyText = "";

  // Continuously refreshed from focus/selection events. Clicking the toolbar icon is a
  // browser-chrome interaction, which blurs the page's focused element (document.activeElement
  // becomes <body>) before our SHOW_BUTTON message ever arrives. Reading document.activeElement
  // fresh at that point would always see nothing, so instead we track the last valid
  // field/selection as it happens and use that snapshot when the icon is clicked.
  let lastTarget = null;
  // Frozen copy of lastTarget for the action currently in flight (from icon click through
  // Accept/Cancel), so it doesn't get clobbered by focus changes while a request is pending.
  let currentTarget = null;
  // Set once a draft (or subject) has come back from the server: holds it in the preview
  // panel until the user accepts it, instead of writing straight into the page.
  let pendingText = null;
  let pendingAction = null; // "rewrite" | "subject"

  function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      return ["text", "email", "search", ""].includes(type);
    }
    return el.isContentEditable === true;
  }

  // Soft heuristic (name/id/aria-label/placeholder), not per-site DOM scraping: catches
  // Gmail's subjectbox, Outlook's "Add a subject" field, and similar patterns elsewhere.
  function looksLikeSubjectField(el) {
    if (el.tagName !== "INPUT") return false;
    const hints = [el.name, el.id, el.getAttribute("aria-label"), el.placeholder]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return /subject|betreff/.test(hints);
  }

  function getText(el) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value;
    return el.innerText;
  }

  // Uses the native property setter (not el.value = ...) so frameworks like React/Gmail's
  // own editor, which patch the value setter to track changes, actually notice the update.
  function setInputValue(el, text) {
    const prototype = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
    setter.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // execCommand("insertText") on the given range mimics real typing, so rich editors
  // (Gmail's compose body included) pick up the change through their own input listeners
  // instead of silently ignoring a direct innerText/textContent assignment.
  function replaceRange(range, text) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const inserted = document.execCommand("insertText", false, text);
    if (!inserted) {
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
    }
  }

  function replaceFieldSelection(el, start, end, text) {
    const value = el.value;
    setInputValue(el, value.slice(0, start) + text + value.slice(end));
    const cursor = start + text.length;
    el.setSelectionRange(cursor, cursor);
  }

  // Figures out what the rewrite (or subject generation) should read from and write back
  // to: a focused subject-like field switches to subject mode; otherwise a partial highlight
  // takes precedence over the whole focused field's drafted text. Must be called while the
  // relevant field/selection is still genuinely focused (see lastTarget above for why).
  function computeCurrentTarget() {
    const active = document.activeElement;
    if (!isEditable(active)) return null;

    if (looksLikeSubjectField(active)) {
      return { kind: "subject", el: active };
    }

    if (active.tagName === "TEXTAREA" || active.tagName === "INPUT") {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (typeof start === "number" && typeof end === "number" && end > start) {
        return { kind: "field-selection", el: active, start, end, text: active.value.slice(start, end) };
      }
      const text = getText(active);
      return text && text.trim() ? { kind: "field", el: active, text } : null;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed && active.contains(selection.anchorNode)) {
      const text = selection.toString();
      if (text && text.trim()) {
        return { kind: "range", el: active, range: selection.getRangeAt(0).cloneRange(), text };
      }
    }
    const text = getText(active);
    return text && text.trim() ? { kind: "field", el: active, text } : null;
  }

  function writeBack(target, text) {
    if (target.kind === "field" || target.kind === "subject") {
      if (target.el.tagName === "TEXTAREA" || target.el.tagName === "INPUT") {
        setInputValue(target.el, text);
      } else {
        target.el.focus();
        const range = document.createRange();
        range.selectNodeContents(target.el);
        replaceRange(range, text);
      }
    } else if (target.kind === "field-selection") {
      replaceFieldSelection(target.el, target.start, target.end, text);
    } else if (target.kind === "range") {
      target.el.focus();
      replaceRange(target.range, text);
    }
  }

  function ensureButton() {
    if (button) return button;
    button = document.createElement("button");
    button.textContent = REWRITE_LABEL;
    button.className = "mail-style-rewrite-btn";
    button.addEventListener("mousedown", (event) => {
      // Without this, clicking the button first blurs the text field, and by the time the
      // click handler runs, the target's focus context (and sometimes selection) is gone.
      event.preventDefault();
    });
    button.addEventListener("click", onTriggerClick);
    document.documentElement.appendChild(button);
    return button;
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "mail-style-panel";
    panel.innerHTML = `
      <div class="mail-style-panel-preview"></div>
      <div class="mail-style-panel-actions">
        <button type="button" class="mail-style-accept-btn">Accept</button>
        <button type="button" class="mail-style-cancel-btn">Cancel</button>
      </div>
      <div class="mail-style-panel-improve">
        <input type="text" class="mail-style-improve-input" placeholder="What should change?" />
        <button type="button" class="mail-style-improve-btn">Improve</button>
      </div>
    `;
    panel.addEventListener("mousedown", (event) => {
      if (event.target.tagName !== "INPUT") event.preventDefault();
    });
    panel.querySelector(".mail-style-accept-btn").addEventListener("click", onAcceptClick);
    panel.querySelector(".mail-style-cancel-btn").addEventListener("click", onCancelClick);
    panel.querySelector(".mail-style-improve-btn").addEventListener("click", onImproveClick);
    document.documentElement.appendChild(panel);
    return panel;
  }

  // Placed to the right of the field (clamped to stay on-screen) so it never sits on top
  // of the text being edited.
  function positionNear(el, node) {
    const rect = el.getBoundingClientRect();
    node.style.display = node === panel ? "flex" : "inline-flex";
    const width = node.offsetWidth || 170;
    const height = node.offsetHeight || 40;
    const gap = 8;
    let left = rect.right + gap;
    if (left + width > window.innerWidth - 4) left = window.innerWidth - width - 4;
    left = Math.max(4, left);
    let top = rect.top;
    if (top + height > window.innerHeight - 4) top = window.innerHeight - height - 4;
    top = Math.max(4, top);
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  }

  function hideButton() {
    if (button) button.style.display = "none";
  }

  function ensureHint() {
    if (hint) return hint;
    hint = document.createElement("div");
    hint.className = "mail-style-hint";
    hint.innerHTML = `
      <span class="mail-style-hint-text">Select the text you'd like to improve, then click the ReMingo icon again — a small pop-up will appear where you can review or edit it.</span>
      <button type="button" class="mail-style-hint-close" aria-label="Dismiss">×</button>
    `;
    hint.querySelector(".mail-style-hint-close").addEventListener("click", hideHint);
    document.documentElement.appendChild(hint);
    return hint;
  }

  function showHint() {
    const h = ensureHint();
    h.style.display = "flex";
    clearTimeout(hintHideTimer);
    hintHideTimer = setTimeout(hideHint, 2000);
  }

  function hideHint() {
    clearTimeout(hintHideTimer);
    if (hint) hint.style.display = "none";
  }

  function resetAll() {
    hideButton();
    if (panel) panel.style.display = "none";
    currentTarget = null;
    pendingText = null;
    pendingAction = null;
  }

  function refreshLastTarget() {
    const target = computeCurrentTarget();
    if (target) lastTarget = target;
  }

  // Selection/focus can only be read reliably while the field genuinely has it, so we
  // snapshot on every event that could mean "the user just finished picking something":
  // focusing a field, releasing a mouse-drag selection, or extending a selection with the
  // keyboard. selectionchange covers contenteditable; it does not fire for input/textarea
  // internal selection, which mouseup/keyup cover instead.
  document.addEventListener("focusin", refreshLastTarget, true);
  document.addEventListener("selectionchange", refreshLastTarget);
  document.addEventListener("mouseup", refreshLastTarget, true);
  document.addEventListener("keyup", refreshLastTarget, true);

  // The idle trigger button and the no-target hint both dismiss immediately on any outside
  // click; the review panel is exempt (it holds an in-progress draft, so it only closes via
  // Accept/Cancel).
  document.addEventListener(
    "mousedown",
    (event) => {
      if (button && button.style.display !== "none" && event.target !== button) {
        hideButton();
        currentTarget = null;
      }
      if (hint && hint.style.display !== "none" && !hint.contains(event.target)) {
        hideHint();
      }
    },
    true,
  );

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "SHOW_BUTTON") return;
    if (pendingText !== null) resetAll(); // a fresh icon click always starts over, not a no-op

    // The icon click itself may already have blurred the page (document.activeElement can
    // be <body> by the time this message arrives), so re-checking live focus here would
    // regress to the old bug. Trust the last snapshot captured while the field/selection
    // was still actually active, and confirm its element is still on the page.
    const target = lastTarget && document.contains(lastTarget.el) ? lastTarget : null;
    if (!target) {
      showHint();
      return;
    }
    hideHint();
    if (target.kind !== "subject") lastBodyText = target.text;
    currentTarget = target;
    ensureButton().textContent = target.kind === "subject" ? SUBJECT_LABEL : REWRITE_LABEL;
    positionNear(target.el, button);
  });

  function onTriggerClick() {
    if (!currentTarget) return;
    const target = currentTarget;
    const isSubject = target.kind === "subject";
    const label = isSubject ? SUBJECT_LABEL : REWRITE_LABEL;
    const text = isSubject ? lastBodyText : target.text;
    if (!text || !text.trim()) return;

    button.textContent = isSubject ? "Generating..." : "Rewriting...";
    button.disabled = true;

    chrome.runtime.sendMessage({ type: isSubject ? "SUBJECT" : "REWRITE", text }, (response) => {
      button.disabled = false;
      if (!response || !response.ok) {
        button.textContent = response ? "Error, see console" : "No response, try again";
        if (response && !response.ok) console.error("[Mail Style Rewriter]", response.error);
        setTimeout(() => (button.textContent = label), 2500);
        return;
      }
      pendingAction = isSubject ? "subject" : "rewrite";
      pendingText = response.text;
      hideButton();
      showPanel(target.el);
    });
  }

  function showPanel(el) {
    const p = ensurePanel();
    p.querySelector(".mail-style-panel-preview").textContent = pendingText;
    p.querySelector(".mail-style-improve-input").value = "";
    positionNear(el, p);
  }

  function onAcceptClick() {
    if (!currentTarget || pendingText === null) return;
    writeBack(currentTarget, pendingText);
    if (pendingAction === "rewrite") lastBodyText = pendingText;
    resetAll();
  }

  function onCancelClick() {
    resetAll();
  }

  function onImproveClick() {
    if (pendingText === null) return;
    const input = panel.querySelector(".mail-style-improve-input");
    const instruction = input.value.trim();
    if (!instruction) return;

    const improveBtn = panel.querySelector(".mail-style-improve-btn");
    improveBtn.disabled = true;
    improveBtn.textContent = "Improving...";

    chrome.runtime.sendMessage({ type: "IMPROVE", text: pendingText, instruction }, (response) => {
      improveBtn.disabled = false;
      improveBtn.textContent = "Improve";
      if (!response || !response.ok) {
        console.error("[Mail Style Rewriter]", response ? response.error : "No response from server");
        return;
      }
      pendingText = response.text;
      panel.querySelector(".mail-style-panel-preview").textContent = pendingText;
      input.value = "";
    });
  }
})();
