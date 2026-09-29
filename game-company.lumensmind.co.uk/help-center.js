(function () {
  "use strict";

  var filters = Array.prototype.slice.call(document.querySelectorAll("[data-help-filter]"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-help-section]"));
  var search = document.querySelector("[data-help-search]");
  if (!filters.length || !sections.length) return;

  var style = document.createElement("style");
  style.textContent = "[data-help-filter][aria-pressed=true]{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-color:transparent}[data-help-empty]{padding:2rem;text-align:center;color:hsl(var(--muted-foreground))}";
  document.head.appendChild(style);

  var empty = document.createElement("p");
  empty.setAttribute("data-help-empty", "");
  empty.hidden = true;
  empty.textContent = "No help content matches your search.";
  sections[sections.length - 1].insertAdjacentElement("afterend", empty);

  function selectedFilter() {
    var value = window.location.hash.replace(/^#/, "");
    return filters.some(function (filter) { return filter.dataset.helpFilter === value; }) ? value : "all";
  }

  function update() {
    var selected = selectedFilter();
    var query = search ? search.value.trim().toLowerCase() : "";
    var visibleCount = 0;

    filters.forEach(function (filter) {
      filter.setAttribute("aria-pressed", String(filter.dataset.helpFilter === selected));
    });

    sections.forEach(function (section) {
      var categoryMatches = selected === "all" || section.dataset.helpSection === selected;
      var searchMatches = !query || section.textContent.toLowerCase().indexOf(query) !== -1;
      section.hidden = !(categoryMatches && searchMatches);
      if (!section.hidden) visibleCount += 1;
    });

    empty.hidden = visibleCount !== 0;
  }

  filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      window.setTimeout(update, 0);
    });
  });

  if (search) search.addEventListener("input", update);
  window.addEventListener("hashchange", update);
  update();
})();
