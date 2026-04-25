(async function () {
  const { enabled, whitelist, blocked = 0 } =
    await chrome.storage.local.get(["enabled", "whitelist", "blocked"]);

  if (!enabled) return;

  const host = location.hostname;
  if ((whitelist || []).includes(host)) return;

  let removed = 0;

  function isOverlay(el) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const isFixed = style.position === "fixed";
    const isSticky = style.position === "sticky";
    const z = parseInt(style.zIndex) || 0;

    const bigEnough =
      rect.width > window.innerWidth * 0.5 &&
      rect.height > window.innerHeight * 0.5;

    return (isFixed || isSticky) && bigEnough && z > 10;
  }

  function isProbablySafe(el) {
    const text = (el.innerText || "").toLowerCase();

    // NEVER touch these
    const safeKeywords = [
      "login",
      "sign in",
      "password",
      "checkout",
      "payment",
      "verify"
    ];

    if (safeKeywords.some(k => text.includes(k))) return true;
    if (el.querySelector('input[type="password"]')) return true;

    return false;
  }

  function scan() {
    const elements = document.querySelectorAll("body *");

    elements.forEach(el => {
      if (!el || !el.parentNode) return;
      if (isProbablySafe(el)) return;

      if (isOverlay(el)) {
        el.remove();
        removed++;
      }
    });
  }

  // Run repeatedly but lightweight
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });

  scan();

  // Persist stats occasionally
  setInterval(() => {
    if (removed > 0) {
      chrome.storage.local.set({
        blocked: blocked + removed
      });
      removed = 0;
    }
  }, 2000);

})();