/* Resolves the colour theme before first paint: stored choice first, then the
   operating-system preference. Loaded synchronously from index.html so there
   is no flash of the wrong theme. */
(function () {
  var root = document.documentElement;
  var theme = "light";
  try {
    var stored = localStorage.getItem("gcj-theme");
    if (stored === "light" || stored === "dark") {
      theme = stored;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    theme = "light";
  }
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#050505" : "#FAFAFA");
})();
