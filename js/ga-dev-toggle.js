/* =========================
   DEV toggle izklop sledenja za testiranje Ctrl + Alt + 5 klikov na logo
========================= */
(function () {
  function setCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie =
      name + "=" + encodeURIComponent(value) +
      "; path=/; max-age=" + maxAge +
      "; SameSite=Lax";
  }

  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function isGADisabled() {
    return getCookie("ga_disable") === "1";
  }

  window.gmIsGADisabled = isGADisabled;

  function setGADisabled(disabled) {
    setCookie("ga_disable", disabled ? "1" : "0", 365);
  }

  function showGABadge() {
    if (document.getElementById("ga-dev-badge")) return;

    const badge = document.createElement("div");
    badge.id = "ga-dev-badge";
    badge.textContent = "GA OFF";
    badge.style.position = "fixed";
    badge.style.bottom = "14px";
    badge.style.right = "14px";
    badge.style.zIndex = "99999";
    badge.style.padding = "8px 12px";
    badge.style.borderRadius = "999px";
    badge.style.background = "#8b0000";
    badge.style.color = "#fff";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "700";
    badge.style.letterSpacing = "0.04em";
    badge.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    badge.style.pointerEvents = "none";
    document.body.appendChild(badge);
  }

  function setupDevToggle() {
    const logo = document.getElementById("site-logo");
    if (!logo) return;

    let clickCount = 0;
    let firstClickTime = 0;
    const requiredClicks = 5;
    const timeWindowMs = 2500;

    logo.addEventListener("mousedown", function (e) {
      if (!(e.altKey && e.ctrlKey)) {
        clickCount = 0;
        firstClickTime = 0;
        return;
      }

      const now = Date.now();

      if (!firstClickTime || now - firstClickTime > timeWindowMs) {
        firstClickTime = now;
        clickCount = 1;
      } else {
        clickCount += 1;
      }

      if (clickCount >= requiredClicks) {
        e.preventDefault();

        const disabled = !isGADisabled();
        setGADisabled(disabled);

        location.reload();
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("noga") === "1") setGADisabled(true);
  if (params.get("noga") === "0") setGADisabled(false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupDevToggle();
      if (isGADisabled()) showGABadge();
    });
  } else {
    setupDevToggle();
    if (isGADisabled()) showGABadge();
  }

  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-ga-click]");
    if (!el) return;

    if (isGADisabled()) return;

    if (window.gtag) {
      window.gtag("event", "button_click", {
        button_name: el.dataset.gaClick || "",
        button_location: el.dataset.gaLocation || "",
        button_text: (el.textContent || "").trim(),
        link_url: el.href || ""
      });
    }
  }, true);
})();
