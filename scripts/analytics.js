/* Google Analytics (GA4). Shared by every page — the measurement ID lives here
   only, so a new page just needs the one <script> tag in its <head>.

   Deferred, so `gtag` is defined after parse but before DOMContentLoaded. Every
   caller (site.js, income-tax-demo.js) fires from a user-interaction handler and
   guards with `typeof gtag !== "function"`, so nothing races this. */
(function () {
  var MEASUREMENT_ID = "G-3SREKDHMC2";

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);

  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
  document.head.appendChild(tag);
})();
