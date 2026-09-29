(function () {
  "use strict";

  var configElement = document.getElementById("lm-static-nav-config");
  if (!configElement) return;

  var config;
  try {
    config = JSON.parse(configElement.textContent);
  } catch (_) {
    return;
  }

  var activeMenu = null;
  var activeButton = null;
  var mobilePanel = null;

  function addStyles() {
    if (document.getElementById("lm-static-nav-styles")) return;

    var style = document.createElement("style");
    style.id = "lm-static-nav-styles";
    style.textContent = [
      ".lm-static-menu{position:fixed;z-index:10000;min-width:14rem;max-width:calc(100vw - 1rem);padding:.375rem;border:1px solid hsl(var(--border,214.3 31.8% 91.4%));border-radius:.5rem;background:hsl(var(--popover,0 0% 100%));color:hsl(var(--popover-foreground,222.2 84% 4.9%));box-shadow:0 12px 30px rgba(15,23,42,.18)}",
      ".lm-static-menu a{display:block;padding:.55rem .65rem;border-radius:.35rem;color:inherit;text-decoration:none;font-size:.875rem}",
      ".lm-static-menu a:hover,.lm-static-menu a:focus{outline:none;background:hsl(var(--accent,210 40% 96.1%));color:hsl(var(--accent-foreground,222.2 47.4% 11.2%))}",
      ".lm-mobile-panel{position:fixed;z-index:9999;top:3.5rem;right:.5rem;left:.5rem;max-height:calc(100vh - 4rem);overflow:auto;padding:1rem;border:1px solid hsl(var(--border,214.3 31.8% 91.4%));border-radius:.75rem;background:hsl(var(--background,0 0% 100%));color:hsl(var(--foreground,222.2 84% 4.9%));box-shadow:0 16px 36px rgba(15,23,42,.2)}",
      ".lm-mobile-section+.lm-mobile-section{margin-top:1rem;padding-top:1rem;border-top:1px solid hsl(var(--border,214.3 31.8% 91.4%))}",
      ".lm-mobile-title{margin:0 0 .35rem;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:hsl(var(--muted-foreground,215.4 16.3% 46.9%))}",
      ".lm-mobile-panel a{display:block;padding:.55rem .65rem;border-radius:.35rem;color:inherit;text-decoration:none;font-size:.9rem}",
      ".lm-mobile-panel a:hover,.lm-mobile-panel a:focus{outline:none;background:hsl(var(--accent,210 40% 96.1%))}",
      ".lm-mobile-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;margin-top:1rem;padding-top:1rem;border-top:1px solid hsl(var(--border,214.3 31.8% 91.4%))}",
      ".lm-mobile-actions a{text-align:center;border:1px solid hsl(var(--border,214.3 31.8% 91.4%))}",
      ".lm-mobile-actions a[data-variant=primary]{background:hsl(var(--primary,222.2 47.4% 11.2%));color:hsl(var(--primary-foreground,210 40% 98%));border-color:transparent}"
    ].join("");
    document.head.appendChild(style);
  }

  function closeDesktopMenu(restoreFocus) {
    if (activeMenu) activeMenu.remove();
    if (activeButton) {
      activeButton.setAttribute("aria-expanded", "false");
      activeButton.setAttribute("data-state", "closed");
      if (restoreFocus) activeButton.focus();
    }
    activeMenu = null;
    activeButton = null;
  }

  function positionMenu(button, menu) {
    var buttonRect = button.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var left = Math.max(8, Math.min(buttonRect.left, window.innerWidth - menuRect.width - 8));
    var top = buttonRect.bottom + 6;

    if (top + menuRect.height > window.innerHeight - 8 && buttonRect.top > menuRect.height + 8) {
      top = buttonRect.top - menuRect.height - 6;
    }

    menu.style.left = left + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function openDesktopMenu(button, items) {
    closeDesktopMenu(false);

    var menu = document.createElement("div");
    menu.className = "lm-static-menu";
    menu.id = "lm-static-menu";
    menu.setAttribute("role", "menu");

    (items || []).forEach(function (item) {
      var link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      link.setAttribute("role", "menuitem");
      link.tabIndex = -1;
      menu.appendChild(link);
    });

    document.body.appendChild(menu);
    activeMenu = menu;
    activeButton = button;
    button.setAttribute("aria-controls", menu.id);
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("data-state", "open");
    positionMenu(button, menu);

    var firstItem = menu.querySelector("a");
    if (firstItem) firstItem.focus();
  }

  function buildMobilePanel() {
    if (mobilePanel) return mobilePanel;

    mobilePanel = document.createElement("nav");
    mobilePanel.id = "mobile-nav";
    mobilePanel.className = "lm-mobile-panel";
    mobilePanel.setAttribute("aria-label", "Mobile navigation");
    mobilePanel.hidden = true;

    ((config.mobile && config.mobile.sections) || []).forEach(function (section) {
      var group = document.createElement("div");
      group.className = "lm-mobile-section";

      var heading = document.createElement("p");
      heading.className = "lm-mobile-title";
      heading.textContent = section.title;
      group.appendChild(heading);

      (section.items || []).forEach(function (item) {
        var link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label;
        group.appendChild(link);
      });

      mobilePanel.appendChild(group);
    });

    var actions = (config.mobile && config.mobile.actions) || [];
    if (actions.length) {
      var actionGroup = document.createElement("div");
      actionGroup.className = "lm-mobile-actions";
      actions.forEach(function (item) {
        var link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label;
        link.dataset.variant = item.variant || "outline";
        actionGroup.appendChild(link);
      });
      mobilePanel.appendChild(actionGroup);
    }

    document.body.appendChild(mobilePanel);
    return mobilePanel;
  }

  function closeMobilePanel(restoreFocus) {
    if (!mobilePanel || mobilePanel.hidden) return;
    mobilePanel.hidden = true;
    var button = document.querySelector('button[aria-controls="mobile-nav"]');
    if (button) {
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus) button.focus();
    }
  }

  function initializeDesktopMenus() {
    document.querySelectorAll('button[aria-haspopup="menu"]').forEach(function (button) {
      var label = button.getAttribute("aria-label");
      var items = label === "Product menu" ? config.product : label === "Resources menu" ? config.resources : null;
      if (!items) return;

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (activeButton === button) {
          closeDesktopMenu(true);
        } else {
          openDesktopMenu(button, items);
        }
      });
    });
  }

  function initializeMobileMenu() {
    var button = document.querySelector('button[aria-controls="mobile-nav"]');
    if (!button) return;

    var panel = buildMobilePanel();
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var opening = panel.hidden;
      closeDesktopMenu(false);
      panel.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
      if (opening) {
        var firstLink = panel.querySelector("a");
        if (firstLink) firstLink.focus();
      }
    });
  }

  function initializeDismissButtons() {
    document.querySelectorAll('button[aria-label="Dismiss banner"]').forEach(function (button) {
      button.addEventListener("click", function () {
        var banner = button.closest('[role="region"]');
        if (banner) banner.remove();
      });
    });
  }

  function handleMenuKeys(event) {
    if (event.key === "Escape") {
      if (activeMenu) closeDesktopMenu(true);
      else closeMobilePanel(true);
      return;
    }

    if (!activeMenu || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    var items = Array.prototype.slice.call(activeMenu.querySelectorAll('a[role="menuitem"]'));
    if (!items.length) return;
    var current = items.indexOf(document.activeElement);
    var offset = event.key === "ArrowDown" ? 1 : -1;
    event.preventDefault();
    items[(current + offset + items.length) % items.length].focus();
  }

  function initialize() {
    addStyles();
    initializeDesktopMenus();
    initializeMobileMenu();
    initializeDismissButtons();

    document.addEventListener("click", function (event) {
      if (activeMenu && !activeMenu.contains(event.target)) closeDesktopMenu(false);
      if (mobilePanel && !mobilePanel.hidden && !mobilePanel.contains(event.target)) closeMobilePanel(false);
    });
    document.addEventListener("keydown", handleMenuKeys);
    window.addEventListener("resize", function () {
      closeDesktopMenu(false);
      closeMobilePanel(false);
    });
    window.addEventListener("scroll", function () { closeDesktopMenu(false); }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
