(function () {
  "use strict";

  var activeMenu = null;
  var activeButton = null;
  var menuSequence = 0;

  var studios = ["Game Studio Alpha", "Beta Publishing"];
  var games = ["All Games", "Puzzle Adventure", "Racing Legends", "Strategy Masters"];
  var dateRanges = ["Last 7 days", "Last 30 days", "Last 90 days"];
  var notifications = [
    {
      title: "New critical decision",
      body: "A budget increase decision is pending for Puzzle Adventure.",
      route: "decision",
      unread: true
    },
    {
      title: "Synchronization failed",
      body: "Credential error for the Google Ads — MCC 8891 source.",
      route: "integrations",
      unread: true
    },
    {
      title: "Decision completed",
      body: "The decision to pause the underperforming campaign was implemented.",
      route: "memory",
      unread: false
    },
    {
      title: "Invoice created",
      body: "Your September invoice is ready.",
      route: "billing",
      unread: true
    }
  ];

  var routeFiles = {
    pages: {
      profile: "11.1.profile.html",
      security: "11.2.security.html",
      sessions: "11.2.security.html#sessions",
      signout: "12.sign-out.html",
      notifications: "8.5.notifications.html",
      decision: "14.decisions.html",
      integrations: "17.integrations.html",
      memory: "16.decision-memory.html",
      billing: "8.9.billing.html"
    },
    export: {
      profile: "profile.html",
      security: "profile/security.html",
      sessions: "profile/sessions.html",
      signout: "auth/sign-out.html",
      notifications: "app/settings/notifications.html",
      decision: "app/decisions/dec-1.html",
      integrations: "app/integrations.html",
      memory: "app/memory.html",
      billing: "app/settings/billing.html"
    }
  };

  function addStyles() {
    if (document.getElementById("static-dropdown-styles")) return;
    var style = document.createElement("style");
    style.id = "static-dropdown-styles";
    style.textContent = [
      ".static-dropdown-menu{position:fixed;z-index:9999;min-width:12rem;max-width:min(22rem,calc(100vw - 1rem));padding:.375rem;border:1px solid hsl(var(--border,214.3 31.8% 91.4%));border-radius:.5rem;background:hsl(var(--popover,0 0% 100%));color:hsl(var(--popover-foreground,222.2 84% 4.9%));box-shadow:0 12px 30px rgba(15,23,42,.18);font-size:.875rem;line-height:1.25rem}",
      ".static-dropdown-menu[data-kind=notifications]{width:min(22rem,calc(100vw - 1rem))}",
      ".static-dropdown-heading{padding:.45rem .6rem;font-weight:600}",
      ".static-dropdown-subheading{padding:0 .6rem .45rem;color:hsl(var(--muted-foreground,215.4 16.3% 46.9%));font-size:.75rem}",
      ".static-dropdown-separator{height:1px;margin:.3rem -.375rem;background:hsl(var(--border,214.3 31.8% 91.4%))}",
      ".static-dropdown-item{display:flex;width:100%;box-sizing:border-box;align-items:flex-start;gap:.5rem;padding:.5rem .6rem;border:0;border-radius:.3rem;background:transparent;color:inherit;text-align:left;text-decoration:none;cursor:pointer;font:inherit}",
      ".static-dropdown-item:hover,.static-dropdown-item:focus{outline:none;background:hsl(var(--accent,210 40% 96.1%));color:hsl(var(--accent-foreground,222.2 47.4% 11.2%))}",
      ".static-dropdown-item[aria-checked=true]::before{content:'✓';width:1rem;flex:0 0 1rem}",
      ".static-dropdown-item[aria-checked=false]::before{content:'';width:1rem;flex:0 0 1rem}",
      ".static-dropdown-notification{display:block}",
      ".static-dropdown-notification strong{display:block;margin-bottom:.1rem}",
      ".static-dropdown-notification span{display:block;color:hsl(var(--muted-foreground,215.4 16.3% 46.9%));font-size:.75rem;font-weight:400}",
      ".static-dropdown-notification[data-unread=true] strong::before{content:'•';margin-right:.4rem;color:hsl(var(--primary,222.2 47.4% 11.2%))}",
      ".dark .static-dropdown-menu{box-shadow:0 12px 30px rgba(0,0,0,.45)}"
    ].join("");
    document.head.appendChild(style);
  }

  function storageGet(key, fallback) {
    try {
      return sessionStorage.getItem(key) || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (_) {}
  }

  function routeUrl(route) {
    var href = window.location.href;
    var exportMarker = "/export/";
    var exportIndex = href.indexOf(exportMarker);
    if (exportIndex !== -1) {
      var exportBase = href.slice(0, exportIndex + exportMarker.length);
      return new URL(routeFiles.export[route], exportBase).href;
    }
    return new URL(routeFiles.pages[route], href).href;
  }

  function closeMenu(options) {
    options = options || {};
    if (activeMenu) activeMenu.remove();
    if (activeButton) {
      activeButton.setAttribute("aria-expanded", "false");
      activeButton.setAttribute("data-state", "closed");
      if (options.restoreFocus) activeButton.focus();
    }
    activeMenu = null;
    activeButton = null;
  }

  function positionMenu(button, menu, alignEnd) {
    var rect = button.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var left = alignEnd ? rect.right - menuRect.width : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
    var top = rect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - 8 && rect.top > menuRect.height + 8) {
      top = rect.top - menuRect.height - 6;
    }
    menu.style.left = left + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function menuShell(button, kind, heading, subheading) {
    closeMenu();
    var menu = document.createElement("div");
    menu.className = "static-dropdown-menu";
    menu.dataset.kind = kind;
    menu.id = "static-dropdown-" + (++menuSequence);
    menu.setAttribute("role", "menu");
    button.setAttribute("aria-controls", menu.id);
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("data-state", "open");
    if (heading) {
      var title = document.createElement("div");
      title.className = "static-dropdown-heading";
      title.textContent = heading;
      menu.appendChild(title);
    }
    if (subheading) {
      var subtitle = document.createElement("div");
      subtitle.className = "static-dropdown-subheading";
      subtitle.textContent = subheading;
      menu.appendChild(subtitle);
    }
    document.body.appendChild(menu);
    activeMenu = menu;
    activeButton = button;
    return menu;
  }

  function separator(menu) {
    var line = document.createElement("div");
    line.className = "static-dropdown-separator";
    line.setAttribute("role", "separator");
    menu.appendChild(line);
  }

  function addItem(menu, label, options) {
    options = options || {};
    var item = document.createElement(options.href ? "a" : "button");
    item.className = "static-dropdown-item" + (options.notification ? " static-dropdown-notification" : "");
    item.setAttribute("role", options.radio ? "menuitemradio" : "menuitem");
    item.tabIndex = -1;
    if (options.radio) item.setAttribute("aria-checked", String(Boolean(options.checked)));
    if (options.href) item.href = options.href;
    if (options.notification) {
      item.dataset.unread = String(Boolean(options.unread));
      var strong = document.createElement("strong");
      strong.textContent = label;
      var detail = document.createElement("span");
      detail.textContent = options.detail || "";
      item.appendChild(strong);
      item.appendChild(detail);
    } else {
      item.textContent = label;
    }
    if (options.onSelect) {
      item.addEventListener("click", function (event) {
        options.onSelect(event);
        closeMenu();
      });
    } else if (options.href) {
      item.addEventListener("click", function () { closeMenu(); });
    }
    menu.appendChild(item);
    return item;
  }

  function updateButtonLabel(button, label) {
    var truncated = button.querySelector("span.truncate");
    if (truncated) {
      truncated.textContent = label;
      return;
    }
    var nodes = Array.prototype.slice.call(button.childNodes);
    var textNode = nodes.find(function (node) {
      return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
    });
    if (textNode) textNode.textContent = label;
  }

  function selectionMenu(button, kind, heading, values, storageKey) {
    var current = storageGet(storageKey, values[0]);
    var menu = menuShell(button, kind, heading);
    values.forEach(function (value) {
      addItem(menu, value, {
        radio: true,
        checked: value === current,
        onSelect: function () {
          storageSet(storageKey, value);
          updateButtonLabel(button, value);
        }
      });
    });
    positionMenu(button, menu, false);
    focusFirst(menu);
  }

  function notificationMenu(button) {
    var menu = menuShell(button, "notifications", "Notifications");
    notifications.forEach(function (notification) {
      addItem(menu, notification.title, {
        href: routeUrl(notification.route),
        notification: true,
        unread: notification.unread,
        detail: notification.body
      });
    });
    separator(menu);
    addItem(menu, "All notifications", { href: routeUrl("notifications") });
    positionMenu(button, menu, true);
    focusFirst(menu);
  }

  function userMenu(button) {
    var menu = menuShell(button, "user", "Ahmet Yılmaz", "Owner");
    addItem(menu, "Profile", { href: routeUrl("profile") });
    addItem(menu, "Security", { href: routeUrl("security") });
    addItem(menu, "Sessions", { href: routeUrl("sessions") });
    separator(menu);
    var dark = document.documentElement.classList.contains("dark");
    addItem(menu, dark ? "Light theme" : "Dark theme", {
      onSelect: function () {
        document.documentElement.classList.toggle("dark");
        storageSet("lumensmind.theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
      }
    });
    separator(menu);
    addItem(menu, "Sign out", { href: routeUrl("signout") });
    positionMenu(button, menu, true);
    focusFirst(menu);
  }

  function focusFirst(menu) {
    var first = menu.querySelector('[role^="menuitem"]');
    if (first) first.focus();
  }

  function openFor(button) {
    var label = button.getAttribute("aria-label") || "";
    var text = button.textContent.trim();
    if (label === "Studio select") {
      selectionMenu(button, "studio", "Organization", studios, "lumensmind.studio");
    } else if (label === "Game scope select") {
      selectionMenu(button, "game", "Scope", games, "lumensmind.game");
    } else if (label.indexOf("Notifications") === 0) {
      notificationMenu(button);
    } else if (label === "User menu") {
      userMenu(button);
    } else if (dateRanges.some(function (range) { return text.indexOf(range) !== -1; })) {
      selectionMenu(button, "date", "Analytics", dateRanges, "lumensmind.date-range");
    }
  }

  function restoreSelections() {
    var studio = storageGet("lumensmind.studio", studios[0]);
    var game = storageGet("lumensmind.game", games[0]);
    var date = storageGet("lumensmind.date-range", "Last 30 days");
    document.querySelectorAll('button[aria-haspopup="menu"]').forEach(function (button) {
      var label = button.getAttribute("aria-label") || "";
      if (label === "Studio select") updateButtonLabel(button, studio);
      if (label === "Game scope select") updateButtonLabel(button, game);
      if (dateRanges.some(function (range) { return button.textContent.indexOf(range) !== -1; })) {
        updateButtonLabel(button, date);
      }
    });
    if (storageGet("lumensmind.theme", "light") === "dark") {
      document.documentElement.classList.add("dark");
    }
  }

  function onMenuKeydown(event) {
    if (!activeMenu) return;
    var items = Array.prototype.slice.call(activeMenu.querySelectorAll('[role^="menuitem"]'));
    var index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1 + items.length) % items.length].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length].focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0].focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1].focus();
    } else if (event.key === "Tab") {
      closeMenu();
    }
  }

  function initialize() {
    addStyles();
    restoreSelections();
    document.querySelectorAll('button[aria-haspopup="menu"]').forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (activeButton === button) {
          closeMenu();
          return;
        }
        openFor(button);
      });
    });
    document.addEventListener("click", function (event) {
      if (activeMenu && !activeMenu.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", onMenuKeydown);
    window.addEventListener("resize", function () { closeMenu(); });
    window.addEventListener("scroll", function () { closeMenu(); }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
