"use strict";

const chatDialog = document.querySelector("#assistant");
const chatFrame = chatDialog.querySelector("iframe");
let opener;
for (const button of document.querySelectorAll("[data-chat]")) {
  button.addEventListener("click", () => {
    opener = button;
    if (!chatFrame.hasAttribute("src")) chatFrame.src = chatFrame.dataset.src;
    chatDialog.showModal();
  });
}
chatDialog.querySelector("[data-close]").addEventListener("click", () => chatDialog.close());
chatDialog.addEventListener("close", () => opener?.focus());
chatDialog.addEventListener("click", (event) => {
  if (event.target !== chatDialog) return;
  const box = chatDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom) chatDialog.close();
});

for (const button of document.querySelectorAll("[data-copy]")) {
  const original = button.textContent;
  let timer;
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    let copied = false;
    try {
      await navigator.clipboard.writeText(source.textContent);
      copied = true;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try { copied = document.execCommand("copy"); } catch { /* Text remains selected for manual copy. */ }
    }
    button.textContent = copied ? "Copied ✓" : "Text selected — copy to clipboard";
    clearTimeout(timer);
    timer = setTimeout(() => { button.textContent = original; }, 3500);
  });
}

const video = document.querySelector("video");
if (video) {
  const playButton = document.querySelector("#playback");
  function updateControl() {
    const label = video.paused ? "Play inspection video" : "Pause inspection video";
    playButton.setAttribute("aria-label", label);
    playButton.title = label;
    playButton.firstElementChild.textContent = video.paused ? "▶" : "Ⅱ";
  }
  video.addEventListener("play", updateControl);
  video.addEventListener("pause", updateControl);
  playButton.addEventListener("click", () => {
    if (video.paused) video.play().catch(updateControl);
    else video.pause();
  });
  video.muted = true;
  video.play().catch(updateControl);
  updateControl();
}

const shippedInput = document.querySelector("#shipped");
if (shippedInput) {
  const holdInput = document.querySelector("#hold");
  const get = (id) => document.getElementById(id);
  function renderExposure() {
    const shipped = Number(shippedInput.value);
    const stock = 175 - shipped;
    const held = holdInput.checked;
    get("qty").value = String(shipped);
    get("n-stock").textContent = stock;
    get("n-shipped").textContent = shipped;
    get("b-stock").style.width = (stock / 2) + "%";
    get("b-shipped").style.width = (shipped / 2) + "%";
    get("lotbar").setAttribute("aria-label", stock + " in stock, 25 in WIP, " + shipped + " shipped");
    let priority, action;
    if (shipped > 0) {
      priority = "Trace the customer shipments.";
      const noun = shipped === 1 ? "bracket" : "brackets";
      action = "Trace the " + shipped + " shipped " + noun + " to the receiving customer and review notification requirements with the designated customer interface. ";
      action += held ? "Maintain the verified on-site hold." : "In parallel, secure the remaining stock and affected WIP.";
    } else if (held) {
      priority = "Plan the inspection.";
      action = "Keep the verified stock and WIP holds in place. Have Quality and Engineering define how to check the remaining brackets against the drawing.";
    } else {
      priority = "Secure the on-site lot.";
      action = "Place a hold on stock and identify the assemblies containing the 25 installed brackets.";
    }
    get("priority").textContent = priority;
    get("next-step").textContent = action;
    const containment = held ? "Hold verified for all " + (stock + 25) + " on-site units." : "On-site hold has yet to be verified.";
    const exposure = shipped ? shipped + " shipped from the suspect lot. Shipped product condition is unknown." : "Shipment count is zero.";
    get("brief-text").textContent = [
      "Issue: Four brackets from supplier lot B-200 failed dimensional inspection. All four are included in the stock count.",
      "Exposure: " + stock + " in stock and 25 installed in WIP. " + exposure,
      "Containment: " + containment,
      "Cause: Unknown. Recovery date is open.",
      "Next action: " + action
    ].join("\n");
  }
  shippedInput.addEventListener("input", renderExposure);
  holdInput.addEventListener("change", renderExposure);
  renderExposure();
}
