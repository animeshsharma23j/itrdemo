(function () {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  function apply(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Switch to light mode");
    } else {
      document.documentElement.removeAttribute("data-theme");
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Switch to dark mode");
    }
  }
  apply(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  btn.addEventListener("click", function () {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    var next = isDark ? "light" : "dark";
    localStorage.setItem("itr-demo-theme", next);
    apply(next);
  });
})();
