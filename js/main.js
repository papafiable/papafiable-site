/* Papa Fiable : navigation interne + lecture de la vidéo sur place */
(function () {
  /* --- Ancres : défilement fluide vers la section, sans jamais quitter la page --- */
  function scrollToHash(hash, push) {
    var id = decodeURIComponent(hash.replace(/^#/, ""));
    var el = id ? document.getElementById(id) : null;
    if (!id) { window.scrollTo({ top: 0, behavior: "smooth" }); return true; }
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href],a[data-go]");
    if (!a || a.target === "_blank") return;
    var h = a.getAttribute("data-go") || a.getAttribute("href");
    var m = h.match(/^(?:\/|index\.html)?(#.*)$/);
    if (!m) return;
    var samePage = h.charAt(0) === "#" || location.pathname === "/" || /index\.html$/.test(location.pathname) || location.protocol === "file:" || location.pathname === "srcdoc" || location.href === "about:srcdoc";
    if (!samePage) return;
    if (scrollToHash(m[1], true)) {
      e.preventDefault();
      if (a.hasAttribute("data-play-video")) setTimeout(function () { playVideo(); }, 450);
    }
  });

  /* --- Vidéo : chargée dans la page (youtube-nocookie), miniature perso au-dessus --- */
  var box = document.getElementById("vsl");
  var frame = document.getElementById("vsl-frame");
  var btn = box && box.querySelector("button.play");
  var playing = false, ready = false;
  var YT_ORIGIN = "https://www.youtube-nocookie.com";
  if (frame && /^https?:$/.test(location.protocol) && frame.src.indexOf("origin=") < 0) {
    frame.src = frame.src + "&origin=" + encodeURIComponent(location.origin);
  }
  function send(func) {
    try { frame.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: [] }), YT_ORIGIN); } catch (e) {}
  }
  window.addEventListener("message", function (ev) {
    if (!frame || ev.source !== frame.contentWindow) return;
    var d = ev.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return; } }
    if (!d) return;
    if (d.event === "onReady") ready = true;
    if (d.event === "onStateChange" && d.info === 1) playing = true;
    if (d.event === "infoDelivery" && d.info && d.info.playerState === 1) playing = true;
  });
  if (frame) frame.addEventListener("load", function () {
    try { frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), YT_ORIGIN); } catch (e) {}
  });
  function playVideo() {
    if (!box || !frame) return;
    box.classList.add("is-playing");
    playing = false;
    send("playVideo");
    [350, 900, 1800].forEach(function (t) { setTimeout(function () { if (!playing) send("playVideo"); }, t); });
    setTimeout(function () {
      if (playing) return;
      var u = frame.src; if (u.indexOf("autoplay=1") < 0) frame.src = u + (u.indexOf("?") < 0 ? "?" : "&") + "autoplay=1";
    }, 2600);
  }
  if (btn) btn.addEventListener("click", playVideo);

  /* --- Agenda Calendly : chargé quand on approche de la section, hauteur automatique ---
     Fonction réutilisable (window.PFCal) : la page du test l'appelle aussi quand le résultat s'affiche. */
  var calScript = null, calQueue = [];
  function withCalendly(cb, onFail) {
    if (window.Calendly) { cb(); return; }
    calQueue.push({ ok: cb, ko: onFail });
    if (calScript) return;
    calScript = document.createElement("script");
    calScript.src = "https://assets.calendly.com/assets/external/widget.js";
    calScript.async = true;
    calScript.onload = function () { calQueue.splice(0).forEach(function (q) { q.ok(); }); };
    calScript.onerror = function () { calQueue.splice(0).forEach(function (q) { q.ko(); }); };
    document.head.appendChild(calScript);
  }
  function initCalendar(host) {
    if (!host || host.__cal) return;
    host.__cal = true;
    var calURL = host.getAttribute("data-url");
    var fallback = function () {
      if (host.querySelector("iframe")) return;
      host.innerHTML = "";
      var f = document.createElement("iframe");
      f.src = calURL + "?embed_domain=" + encodeURIComponent(location.hostname || "papafiable.fr") + "&embed_type=Inline&hide_gdpr_banner=1&primary_color=c9a45c&text_color=10261f";
      f.title = "Réserver mon bilan offert de 30 minutes";
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      host.appendChild(f);
    };
    withCalendly(function () {
      try {
        window.Calendly.initInlineWidget({
          url: calURL, parentElement: host, resize: true,
          pageSettings: { hideGdprBanner: true, primaryColor: "c9a45c", textColor: "10261f" }
        });
      } catch (e) { fallback(); return; }
      setTimeout(fallback, 2500);
    }, fallback);
  }
  window.PFCal = initCalendar;

  var host = document.getElementById("cal-host");
  if (host) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en, ob) {
        if (en[0].isIntersecting) { initCalendar(host); ob.disconnect(); }
      }, { rootMargin: "900px 0px" }).observe(host);
    } else { initCalendar(host); }
  }
})();
