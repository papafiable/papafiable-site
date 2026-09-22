/* Papa Fiable : test « Papa Motivé ou Papa Fiable ? »
   8 questions, 3 réponses (0 / 1 / 2 points), total sur 16.
   La jauge n'apparaît qu'au résultat, pour ne pas influencer les réponses.
   L'ordre des réponses est mélangé à chaque question pour éviter le biais « la meilleure réponse est en bas ». */
(function () {
  "use strict";

  var QUESTIONS = [
    { pillar: "discipline", q: "Quand tu te dis « je commence lundi », que se passe-t-il en général ?",
      a: ["Lundi passe et on repousse au suivant.", "Je démarre, mais ça ne tient pas plus de quelques semaines.", "C’est rare : quand je décide, je m’y tiens."] },
    { pillar: "discipline", q: "Sur une journée chargée, ta séance ou ton repas prévu…",
      a: ["saute, je verrai demain.", "est raccourci ou remplacé, rarement au niveau prévu.", "est tenu, ou j’ai déjà un plan B."] },
    { pillar: "discipline", q: "À quelle fréquence négocies-tu avec toi-même (« juste cette fois », « je m’y remets demain ») ?",
      a: ["Tout le temps, tout se décide sur le moment.", "Parfois, surtout quand je suis fatigué.", "Rarement, l’essentiel est déjà décidé."] },
    { pillar: "alimentation", q: "Tes repas en semaine, ça ressemble à quoi ?",
      a: ["Improvisés selon l’heure et le frigo.", "Corrects, mais ça dérape le soir ou le week-end.", "Structurés : je sais à l’avance quoi manger."] },
    { pillar: "alimentation", q: "Le soir, après une journée chargée, tu…",
      a: ["grignotes ce qui passe, sans vraiment décider.", "manges correctement, sauf certains soirs.", "suis ton plan sans te poser la question."] },
    { pillar: "alimentation", q: "Après un repas hors cadre (resto, apéro, anniversaire)…",
      a: ["il défait souvent toute ma semaine.", "je compense, mais de façon floue.", "je sais m’ajuster sans tout casser."] },
    { pillar: "mouvement", q: "Ton activité physique actuelle ?",
      a: ["Quasi nulle, ou très irrégulière.", "Des périodes actives, puis des ruptures.", "Régulière depuis plusieurs mois."] },
    { pillar: "mouvement", q: "Courir, porter ou grimper avec tes enfants…",
      a: ["Je m’essouffle vite, ou j’évite.", "Ça va, mais je le sens le lendemain.", "Je suis à l’aise et je peux suivre."] }
  ];

  var PILLARS = {
    discipline:   { label: "Discipline décisionnelle", max: 6 },
    alimentation: { label: "Alimentation", max: 6 },
    mouvement:    { label: "Mouvement", max: 4 }
  };
  var PILLAR_ORDER = ["discipline", "alimentation", "mouvement"];

  var PROFILES = {
    motive: {
      name: "Papa Motivé",
      text: "Tu démarres fort, puis la vie reprend le dessus. Ce n’est pas un manque de volonté : ton système repose sur la motivation, qui fluctue par définition. La bonne nouvelle, c’est que ça se construit."
    },
    transition: {
      name: "Papa en transition",
      text: "Tu as des bases et des périodes où ça tient, mais un imprévu suffit à tout faire vaciller. Il te manque un cadre non négociable, pas plus de volonté."
    },
    fiable: {
      name: "Papa Fiable",
      text: "Ton cadre tient déjà l’essentiel. Il reste à affiner un point et à vérifier que ça tient sur la durée, y compris les semaines difficiles."
    }
  };

  /* Teaser affiché au résultat : on nomme le point faible et on donne envie du diagnostic détaillé (PDF envoyé par e-mail).
     Le plan d'action concret n'est PAS affiché ici : il est dans le diagnostic. */
  var TEASERS = {
    discipline: "C’est ici que ton système laisse la décision ouverte : chaque « on verra demain » fait perdre un peu de terrain, et c’est presque toujours à cet endroit que les résultats se perdent. La bonne nouvelle, c’est que c’est le pilier qui bouge le plus vite quand on sait par où commencer.",
    alimentation: "Ce n’est presque jamais un problème de connaissances : tu sais déjà à peu près quoi manger. Le problème, c’est le moment où la décision se prend, trop tard, quand la fatigue a déjà choisi à ta place. Ça se corrige, à condition de toucher au bon endroit.",
    mouvement: "Ton corps est le premier à payer quand le rythme lâche, et c’est aussi celui qui répond le plus vite quand on remet un cadre. Le piège n’est pas le manque d’effort : c’est de repartir trop fort, puis de tout arrêter."
  };
  var LOCKED = function (profileName, pillarLabel) {
    return [
      profileName === "Papa Fiable" ? "Pourquoi ce point mérite d’être affiné, même quand ton cadre tient" : "Pourquoi ça coince chez un « " + profileName + " » sur ce point précis",
      "Les 3 erreurs les plus fréquentes sur ce point, et comment les éviter",
      "Ton plan d’action en 7 jours, étape par étape"
    ];
  };

  function shuffle(n) {
    var a = [], i, j, t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function profileOf(total) { return total <= 6 ? "motive" : (total <= 11 ? "transition" : "fiable"); }

  function score(answers) {
    var total = 0, pil = { discipline: 0, alimentation: 0, mouvement: 0 };
    QUESTIONS.forEach(function (q, i) { var p = answers[i] || 0; total += p; pil[q.pillar] += p; });
    var weakest = PILLAR_ORDER[0], best = 2, k;
    for (var x = 0; x < PILLAR_ORDER.length; x++) {
      k = PILLAR_ORDER[x];
      var r = pil[k] / PILLARS[k].max;
      if (r < best) { best = r; weakest = k; }   // égalité : l'ordre discipline > alimentation > mouvement l'emporte
    }
    return { total: total, pillars: pil, weakest: weakest, profile: profileOf(total) };
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function init(root) {
    if (!root || root.__qz) return;
    root.__qz = true;

    var screens = {};
    root.querySelectorAll("[data-screen]").forEach(function (s) { screens[s.getAttribute("data-screen")] = s; });
    var bookSection = document.getElementById("qz-book");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var answers = [], orders = [], current = 0, result = null, shownAt = 0, advancing = null;

    function show(name, focusSel) {
      Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
      var f = focusSel ? screens[name].querySelector(focusSel) : null;
      if (f) { f.setAttribute("tabindex", "-1"); try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
      if (root.getBoundingClientRect().top < 60) root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }

    /* --- Question ------------------------------------------------------------------ */
    var qs = screens.q;
    var bar = qs.querySelector(".qz-bar i"), count = qs.querySelector(".qz-count"),
        title = qs.querySelector(".qz-q"), list = qs.querySelector(".qz-answers"), back = qs.querySelector(".qz-back");

    function renderQuestion() {
      var q = QUESTIONS[current];
      if (!orders[current]) orders[current] = shuffle(q.a.length);
      count.textContent = "Question " + (current + 1) + " sur " + QUESTIONS.length;
      bar.style.width = ((current + 1) / QUESTIONS.length * 100) + "%";
      qs.querySelector(".qz-bar").setAttribute("aria-valuenow", current + 1);
      title.textContent = q.q;
      list.innerHTML = "";
      orders[current].forEach(function (idx) {
        var b = el("button", "qz-ans", q.a[idx]);
        b.type = "button";
        b.setAttribute("aria-pressed", answers[current] === idx ? "true" : "false");
        if (answers[current] === idx) b.classList.add("is-on");
        b.addEventListener("click", function () { choose(idx, b); });
        list.appendChild(b);
      });
      back.hidden = current === 0;
    }

    function choose(idx, btn) {
      if (advancing) return;
      answers[current] = idx;                       // idx = nombre de points (a=0, b=1, c=2)
      list.querySelectorAll(".qz-ans").forEach(function (x) { x.classList.remove("is-on"); x.setAttribute("aria-pressed", "false"); });
      btn.classList.add("is-on"); btn.setAttribute("aria-pressed", "true");
      advancing = setTimeout(function () {
        advancing = null;
        if (current < QUESTIONS.length - 1) { current++; renderQuestion(); show("q", ".qz-q"); }
        else finish();
      }, reduce ? 0 : 300);
    }

    back.addEventListener("click", function () {
      if (advancing || current === 0) return;
      current--; renderQuestion(); show("q", ".qz-q");
    });

    function start() {
      answers = []; orders = []; current = 0; result = null;
      renderQuestion(); show("q", ".qz-q");
    }
    root.querySelectorAll("[data-qz-start]").forEach(function (b) { b.addEventListener("click", start); });
    root.querySelectorAll("[data-qz-restart]").forEach(function (b) {
      b.addEventListener("click", function () { if (bookSection) bookSection.hidden = true; start(); });
    });

    /* --- Résultat -------------------------------------------------------------------- */
    function finish() {
      show("calc", ".qz-calc-t");
      setTimeout(showResult, reduce ? 0 : 1100);
    }

    function showResult() {
      result = score(answers);
      var r = screens.result, p = PROFILES[result.profile];
      r.querySelector(".qz-profile").textContent = p.name;
      r.querySelector(".qz-profile-text").textContent = p.text;
      r.querySelector(".qz-score-num").textContent = result.total + " / 16";

      var marker = r.querySelector(".qz-gauge-bar i");
      marker.style.left = "0%";
      var pct = Math.max(4, Math.min(96, result.total / 16 * 100));
      r.querySelector(".qz-gauge-bar").setAttribute("aria-label", "Ton score : " + result.total + " sur 16");

      var pl = r.querySelector(".qz-pillars"); pl.innerHTML = "";
      PILLAR_ORDER.forEach(function (k) {
        var row = el("div", "qz-pillar" + (k === result.weakest ? " is-weak" : ""));
        var head = el("div", "qz-pillar-h");
        head.appendChild(el("span", null, PILLARS[k].label));
        head.appendChild(el("b", null, result.pillars[k] + " / " + PILLARS[k].max));
        var track = el("div", "qz-track"); var fill = el("i"); fill.style.width = "0%"; track.appendChild(fill);
        row.appendChild(head); row.appendChild(track); pl.appendChild(row);
        setTimeout(function () { fill.style.width = (result.pillars[k] / PILLARS[k].max * 100) + "%"; }, reduce ? 0 : 350);
      });

      r.querySelector(".qz-weak-t").textContent = (result.profile === "fiable" ? "Ton point à affiner : " : "Ton point à travailler : ") + PILLARS[result.weakest].label.toLowerCase();
      r.querySelector(".qz-tip").textContent = TEASERS[result.weakest];
      var lk = r.querySelector(".qz-locked"); lk.innerHTML = "";
      LOCKED(p.name, PILLARS[result.weakest].label).forEach(function (t) { lk.appendChild(el("li", null, t)); });
      r.querySelector(".qz-mail-for").textContent = p.name + " · point à " + (result.profile === "fiable" ? "affiner" : "travailler") + " : " + PILLARS[result.weakest].label.toLowerCase();

      show("result", ".qz-profile");
      requestAnimationFrame(function () { requestAnimationFrame(function () { marker.style.left = pct + "%"; }); });
      shownAt = Date.now();
      if (bookSection) {
        bookSection.hidden = false;
        if (window.PFCal) window.PFCal(bookSection.querySelector(".cal-host"));
      }
    }

    /* --- Formulaire e-mail (vers Systeme.io via la fonction Netlify) ------------------------ */
    var form = root.querySelector(".qz-form");
    if (form) {
      var msg = form.querySelector(".qz-msg"), submit = form.querySelector("button[type=submit]");
      var endpoint = root.getAttribute("data-endpoint") || "/.netlify/functions/quiz-lead";
      var mock = root.getAttribute("data-mock") === "1";

      var setMsg = function (t, ok) { msg.textContent = t; msg.className = "qz-msg" + (ok === true ? " ok" : (ok === false ? " err" : "")); };

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!result) return;
        var email = form.email.value.trim(), first = form.firstname.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setMsg("Cette adresse e-mail ne semble pas valide.", false); form.email.focus(); return; }
        if (!form.consent.checked) { setMsg("Coche la case pour que je puisse t’envoyer ton diagnostic.", false); form.consent.focus(); return; }
        submit.disabled = true; setMsg("Génération en cours…");

        var payload = {
          email: email, firstName: first, profile: result.profile, score: result.total, weakest: result.weakest,
          consent: true, website: form.website.value, elapsed: Date.now() - shownAt
        };
        var done = function () {
          form.querySelectorAll("input,button").forEach(function (x) { x.disabled = true; });
          form.classList.add("is-done");
          var dl = root.querySelector(".qz-download");
          var link = root.querySelector(".qz-download-link");
          if (dl && link) {
            link.href = "https://papafiable.fr/documents/diagnostics/diagnostic-" + result.profile + "-" + result.weakest + ".pdf";
            dl.hidden = false;
          }
          setMsg("C’est prêt, juste en dessous.", true);
        };
        if (mock) { setTimeout(done, 500); return; }

        var ctl = window.AbortController ? new AbortController() : null;
        var to = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; }); })
          .then(function (o) {
            clearTimeout(to);
            if (o.ok && o.j && o.j.ok) done();
            else { submit.disabled = false; setMsg("Un souci technique est survenu. Réessaie dans un instant, ou écris-moi à antoine@papafiable.fr.", false); }
          })
          .catch(function () { clearTimeout(to); submit.disabled = false; setMsg("Connexion impossible pour le moment. Réessaie, ou écris-moi à antoine@papafiable.fr.", false); });
      });
    }
  }

  window.PFQuiz = { init: init, score: score, profileOf: profileOf, QUESTIONS: QUESTIONS };
  document.addEventListener("DOMContentLoaded", function () { var r = document.getElementById("qz"); if (r) init(r); });
  if (document.readyState !== "loading") { var r0 = document.getElementById("qz"); if (r0) init(r0); }
})();
