(function () {
  "use strict";

  var activeMenu = null;
  var activeButton = null;
  var menuSequence = 0;

  var alerts = [
    {
      title: "Impersonation started: Ahmet Yilmaz",
      body: "Actor support@lumensmind.com",
      href: "12.2.impersonation-audit.html"
    },
    {
      title: "Webhook failed: invoice.payment_failed",
      body: "MobileFirst Games — handler returned 500 after signature verification",
      href: "7.5.billing-events.html#be-002"
    },
    {
      title: "Webhook failed: customer.subscription.updated",
      body: "Platform processing timed out after 30 seconds",
      href: "7.5.billing-events.html"
    },
    {
      title: "Sync failed: Pixel Studios",
      body: "Connection timeout: AppsFlyer API returned 503",
      href: "6.2.sync-run-detail.html"
    },
    {
      title: "Sync failed: MobileFirst Games",
      body: "Authentication failed: API key expired",
      href: "6.1.failed-sync-runs.html"
    }
  ];

  function pageUrl(file) {
    return new URL(file, window.location.href).href;
  }

  function addStyles() {
    if (document.getElementById("admin-static-menu-styles")) return;

    var style = document.createElement("style");
    style.id = "admin-static-menu-styles";
    style.textContent = [
      ".admin-static-menu{position:fixed;z-index:10000;box-sizing:border-box;padding:.375rem;border:1px solid #334155;border-radius:.5rem;background:#0f172a;color:#e2e8f0;box-shadow:0 18px 40px rgba(0,0,0,.45);font-size:.875rem;line-height:1.25rem}",
      ".admin-static-menu[data-kind=alerts]{width:min(20rem,calc(100vw - 1rem))}",
      ".admin-static-menu[data-kind=user]{width:min(12rem,calc(100vw - 1rem))}",
      ".admin-static-menu-heading{padding:.45rem .6rem;font-weight:600;color:#f8fafc}",
      ".admin-static-menu-subheading{padding:0 .6rem .45rem;color:#94a3b8;font-size:.75rem}",
      ".admin-static-menu-separator{height:1px;margin:.3rem -.375rem;background:#334155}",
      ".admin-static-menu-item{display:flex;width:100%;box-sizing:border-box;align-items:flex-start;gap:.5rem;padding:.55rem .6rem;border:0;border-radius:.35rem;background:transparent;color:inherit;text-align:left;text-decoration:none;cursor:pointer;font:inherit}",
      ".admin-static-menu-item:hover,.admin-static-menu-item:focus{outline:none;background:#1e293b;color:#fff}",
      ".admin-static-alert{display:block}",
      ".admin-static-alert strong{display:block;color:#f8fafc;font-weight:500}",
      ".admin-static-alert strong::before{content:'•';margin-right:.45rem;color:#f59e0b}",
      ".admin-static-alert span{display:block;margin-top:.1rem;color:#94a3b8;font-size:.75rem;font-weight:400}",
      ".admin-static-menu-footer{justify-content:center;color:#fbbf24}"
    ].join("");
    document.head.appendChild(style);
  }

  function closeMenu(options) {
    options = options || {};
    if (activeMenu) activeMenu.remove();
    if (activeButton) {
      activeButton.setAttribute("aria-expanded", "false");
      activeButton.setAttribute("data-state", "closed");
      activeButton.removeAttribute("aria-controls");
      if (options.restoreFocus) activeButton.focus();
    }
    activeMenu = null;
    activeButton = null;
  }

  function positionMenu(button, menu) {
    var buttonRect = button.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var left = buttonRect.right - menuRect.width;
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));

    var top = buttonRect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - 8 && buttonRect.top > menuRect.height + 8) {
      top = buttonRect.top - menuRect.height - 6;
    }

    menu.style.left = left + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function createMenu(button, kind) {
    closeMenu();

    var menu = document.createElement("div");
    menu.className = "admin-static-menu";
    menu.dataset.kind = kind;
    menu.id = "admin-static-menu-" + (++menuSequence);
    menu.setAttribute("role", "menu");
    document.body.appendChild(menu);

    activeMenu = menu;
    activeButton = button;
    button.setAttribute("aria-controls", menu.id);
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("data-state", "open");
    return menu;
  }

  function addHeading(menu, title, subtitle) {
    var heading = document.createElement("div");
    heading.className = "admin-static-menu-heading";
    heading.textContent = title;
    menu.appendChild(heading);

    if (subtitle) {
      var subheading = document.createElement("div");
      subheading.className = "admin-static-menu-subheading";
      subheading.textContent = subtitle;
      menu.appendChild(subheading);
    }
  }

  function addSeparator(menu) {
    var separator = document.createElement("div");
    separator.className = "admin-static-menu-separator";
    separator.setAttribute("role", "separator");
    menu.appendChild(separator);
  }

  function addLink(menu, label, href, options) {
    options = options || {};
    var link = document.createElement("a");
    link.className = "admin-static-menu-item";
    if (options.alert) link.classList.add("admin-static-alert");
    if (options.footer) link.classList.add("admin-static-menu-footer");
    link.href = pageUrl(href);
    link.setAttribute("role", "menuitem");
    link.tabIndex = -1;

    if (options.alert) {
      var title = document.createElement("strong");
      title.textContent = label;
      var body = document.createElement("span");
      body.textContent = options.body || "";
      link.appendChild(title);
      link.appendChild(body);
    } else {
      link.textContent = label;
    }

    link.addEventListener("click", function () { closeMenu(); });
    menu.appendChild(link);
    return link;
  }

  function focusFirstItem(menu) {
    var first = menu.querySelector('[role="menuitem"]');
    if (first) first.focus();
  }

  function openAlerts(button) {
    var menu = createMenu(button, "alerts");
    addHeading(menu, "Operational alerts");
    addSeparator(menu);
    alerts.forEach(function (alert) {
      addLink(menu, alert.title, alert.href, { alert: true, body: alert.body });
    });
    addSeparator(menu);
    addLink(menu, "View all alerts", "3.2.operational-alerts.html", { footer: true });
    positionMenu(button, menu);
    focusFirstItem(menu);
  }

  function openUserMenu(button) {
    var menu = createMenu(button, "user");
    addHeading(menu, "Platform Admin", "Super Admin");
    addSeparator(menu);
    addLink(menu, "Profile", "14.1.admin-profile.html");
    addLink(menu, "Security", "14.2.security.html");
    addSeparator(menu);
    addLink(menu, "Sign out", "../export/auth/sign-out.html");
    positionMenu(button, menu);
    focusFirstItem(menu);
  }

  function openFor(button) {
    var label = button.getAttribute("aria-label") || "";
    if (label.indexOf("Notifications") === 0) openAlerts(button);
    else if (label === "Admin user menu") openUserMenu(button);
  }

  function handleMenuKeys(event) {
    if (!activeMenu) return;
    var items = Array.prototype.slice.call(activeMenu.querySelectorAll('[role="menuitem"]'));
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
    document.querySelectorAll('button[aria-haspopup="menu"]').forEach(function (button) {
      var label = button.getAttribute("aria-label") || "";
      if (label.indexOf("Notifications") !== 0 && label !== "Admin user menu") return;

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (activeButton === button) closeMenu();
        else openFor(button);
      });
    });

    document.addEventListener("click", function (event) {
      if (activeMenu && !activeMenu.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", handleMenuKeys);
    window.addEventListener("resize", function () { closeMenu(); });
    window.addEventListener("scroll", function () { closeMenu(); }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
