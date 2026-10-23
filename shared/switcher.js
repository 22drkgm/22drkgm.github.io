/* Version switcher — fixed pill at the bottom of every site version.
   Include with:
     <script src="<root>/shared/switcher.js" data-root="<root>" data-current="v1" defer></script>
   data-root: relative path from the page to the site root ("." or "..")
   data-current: "v0" (original), "v1", "v2" or "v3" */
(function () {
  var me = document.currentScript;
  var root = (me && me.getAttribute("data-root")) || ".";
  var current = (me && me.getAttribute("data-current")) || "v0";
  var versions = [
    { id: "v0", label: "Original", href: root + "/index.html" },
    { id: "v1", label: "Editorial", href: root + "/v1/index.html" },
    { id: "v2", label: "Grid",      href: root + "/v2/index.html" },
    { id: "v3", label: "Mono",      href: root + "/v3/index.html" }
  ];

  var css =
    ".vswitch{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;" +
    "display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;" +
    "background:rgba(20,20,20,.88);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);" +
    "box-shadow:0 4px 18px rgba(0,0,0,.18);font:500 12px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    "max-width:calc(100vw - 24px);}" +
    ".vswitch span.vs-l{color:#9a9a9a;padding:0 8px 0 10px;letter-spacing:.06em;text-transform:uppercase;font-size:10px}" +
    ".vswitch a{color:#d8d8d8;text-decoration:none;padding:7px 11px;border-radius:999px;white-space:nowrap}" +
    ".vswitch a:hover{color:#fff;background:rgba(255,255,255,.08)}" +
    ".vswitch a[aria-current=true]{background:#fff;color:#111}" +
    ".vswitch a:focus-visible{outline:2px solid #fff;outline-offset:1px}" +
    "@media (max-width:480px){.vswitch span.vs-l{display:none}.vswitch a{padding:7px 9px}}" +
    "@media print{.vswitch{display:none}}" +
    "body{padding-bottom:64px}";

  function mount() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var nav = document.createElement("nav");
    nav.className = "vswitch";
    nav.setAttribute("aria-label", "Site version");
    nav.innerHTML = '<span class="vs-l">Version</span>';
    versions.forEach(function (v) {
      var a = document.createElement("a");
      a.href = v.href;
      a.textContent = v.label;
      if (v.id === current) a.setAttribute("aria-current", "true");
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
