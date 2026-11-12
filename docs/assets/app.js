(function () {
  "use strict";
  var CFG = window.ONEUL || {};
  var page = document.body.getAttribute("data-page") || "home";

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function driveId(url) {
    if (!url) return "";
    var m = String(url).match(/\/d\/([\w-]+)/) || String(url).match(/[?&]id=([\w-]+)/);
    return m ? m[1] : "";
  }
  function thumb(url, w) {
    if (!url) return "";
    var id = driveId(url);
    return id ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w" + (w || 800) : url;
  }
  function toast(msg) {
    var t = $("#toast");
    if (!t) { t = el("div", { id: "toast", class: "toast", role: "status" }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- layout (header / footer) ---------- */
  function mountLayout() {
    var links = [
      ["home", "index.html", "홈"],
      ["now", "now.html", "현재 전시", "live"],
      ["collection", "collection.html", "전체 작품"],
      ["guestbook", "guestbook.html", "방명록"]
    ];
    var nav = el("nav", { class: "nav", id: "nav", "aria-label": "주 메뉴" }, links.map(function (l) {
      return el("a", { href: l[1], class: l[3] || "", "aria-current": page === l[0] ? "page" : false, text: l[2] });
    }));
    var btn = el("button", { class: "menu-btn", "aria-label": "메뉴 열기", "aria-expanded": "false", onclick: function () {
      var o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o);
    } }, [el("span")]);
    var header = el("header", { class: "site-header" }, [el("div", { class: "wrap" }, [
      el("a", { href: "index.html", class: "brand", "aria-label": "(사)오늘은 홈" }, [el("span", { class: "brand-dot" }), "오늘은", el("small", { text: "아트 갤러리" })]),
      nav, btn
    ])]);
    document.body.insertBefore(header, document.body.firstChild);

    var footer = el("footer", { class: "site-footer" }, [el("div", { class: "wrap" }, [
      el("div", {}, [
        el("div", { class: "brand" }, [el("span", { class: "brand-dot" }), "(사)오늘은"]),
        el("small", { text: "© " + new Date().getFullYear() + " (사)오늘은. All rights reserved." }),
        el("small", { text: "작품의 저작권은 각 작가에게 있습니다. 무단 전재 및 재배포를 금합니다." })
      ]),
      el("div", { class: "foot-links" }, links.map(function (l) { return el("a", { href: l[1], text: l[2] }); }))
    ])]);
    document.body.appendChild(footer);
  }

  /* ---------- data ---------- */
  var cache = null;
  function loadArtworks() {
    if (cache) return cache;
    var useSample = function (why) {
      return { items: window.ONEUL_SAMPLE || [], sample: true, why: why };
    };
    if (!CFG.API_URL) { cache = Promise.resolve(useSample("API 미연결")); return cache; }
    cache = fetch(CFG.API_URL + (CFG.API_URL.indexOf("?") > -1 ? "&" : "?") + "action=artworks")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { items: j.items || [], sample: false }; })
      .catch(function () { return useSample("불러오기 실패"); });
    return cache;
  }
  function onView(items) { return items.filter(function (a) { return a.exhibit && String(a.exhibit).trim(); }); }

  /* ---------- artwork card & modal ---------- */
  var modal;
  function ensureModal() {
    if (modal) return modal;
    modal = el("dialog", { class: "modal", "aria-label": "작품 상세" });
    modal.addEventListener("click", function (e) { if (e.target.classList.contains("modal-shell")) modal.close(); });
    document.body.appendChild(modal);
    return modal;
  }
  function openModal(a) {
    var m = ensureModal(); m.innerHTML = "";
    var img = thumb(a.image, 1400);
    var facts = [a.year, a.size, a.medium].filter(Boolean).map(function (f) { return el("span", { class: "chip", text: f }); });
    var body = el("div", { class: "modal-body" }, [
      el("div", {}, [el("span", { class: "chip", text: a.project || "소장 작품" })]),
      el("h2", { text: a.title || "제목 없음" }),
      el("div", { class: "artist", text: a.artist || "" }),
      el("div", { class: "facts" }, facts),
      a.exhibit ? el("div", { class: "notice", text: "📍 현재 전시 중 · " + a.exhibit }) : null,
      a.held === false ? el("div", { class: "notice gone", text: "이 작품은 현재 (사)오늘은이 소장하고 있지 않아요." }) : null,
      el("h4", { text: "작품 소개" }), el("p", { text: a.intro || "작품 소개 준비 중입니다." }),
      a.bio ? el("h4", { text: "작가 소개" }) : null, a.bio ? el("p", { class: "bio", text: a.bio }) : null,
      a.topic ? el("h4", { text: "대화청년 주제" }) : null, a.topic ? el("p", { text: a.topic }) : null,
      a.audio ? el("div", { style: "margin-top:24px" }, [el("a", { class: "btn btn-primary btn-sm", href: a.audio, target: "_blank", rel: "noopener", text: "🎧 음성해설 듣기" })]) : null
    ]);
    var media = el("div", { class: "modal-img" }, [img ? el("img", { src: img, alt: (a.title || "작품") + " 이미지", referrerpolicy: "no-referrer" }) : el("div", { class: "ph", style: "position:static;padding:60px", text: a.id || "" })]);
    var card = el("div", { class: "modal-card" }, [
      el("button", { class: "close", "aria-label": "닫기", text: "×", onclick: function () { m.close(); } }), media, body
    ]);
    m.appendChild(el("div", { class: "modal-shell" }, [card]));
    if (m.showModal) m.showModal(); else m.setAttribute("open", "");
    document.body.style.overflow = "hidden";
    m.addEventListener("close", function () { document.body.style.overflow = ""; }, { once: true });
  }
  function artCard(a, showBadge) {
    var src = thumb(a.image, 700);
    var th = el("div", { class: "thumb" }, [el("div", { class: "ph", text: (a.title || "").slice(0, 1) })]);
    if (src) {
      var im = el("img", { src: src, alt: (a.title || "작품") + " — " + (a.artist || ""), loading: "lazy", referrerpolicy: "no-referrer" });
      im.addEventListener("error", function () { im.remove(); });
      th.appendChild(im);
    }
    if (showBadge && a.exhibit) th.appendChild(el("span", { class: "badge", text: "전시중" }));
    var gone = a.held === false;
    if (gone) th.appendChild(el("span", { class: "badge gone", text: "현재 미소장" }));
    return el("button", { class: "art" + (gone ? " gone" : ""), type: "button", "aria-label": (a.title || "") + " 상세 보기", onclick: function () { openModal(a); } }, [
      th,
      el("div", { class: "info" }, [
        el("span", { class: "no", text: a.id || "" }),
        el("h3", { text: a.title || "제목 없음" }),
        el("span", { class: "who", text: a.artist || "" }),
        el("span", { class: "meta", text: [a.size, a.medium].filter(Boolean).join(" · ") })
      ])
    ]);
  }
  function fillGrid(node, items, showBadge) {
    node.innerHTML = "";
    items.forEach(function (a) { node.appendChild(artCard(a, showBadge)); });
  }
  function skeletons(node, n) {
    node.innerHTML = "";
    for (var i = 0; i < n; i++) node.appendChild(el("div", { class: "skeleton" }));
  }
  function sampleNotice(node, res) {
    if (res.sample && node) node.appendChild(el("div", { class: "notice", text: "미리보기용 샘플 작품이 표시되고 있습니다. (" + (res.why || "") + ") — docs/assets/config.js 에 Apps Script 주소를 연결하면 시트 내용이 표시됩니다." }));
  }
  function empty(node, title, desc, href, label) {
    node.innerHTML = "";
    node.appendChild(el("div", { class: "empty" }, [
      el("div", { class: "em", text: "🖼️" }), el("h3", { text: title }), el("p", { text: desc }),
      href ? el("a", { class: "btn btn-primary", href: href, text: label }) : null
    ]));
  }

  /* ---------- pages ---------- */
  function initHome() {
    var collage = $("#collage"), nowGrid = $("#home-now"), s1 = $("#st-works"), s2 = $("#st-artists"), s3 = $("#st-projects");
    skeletons(nowGrid, 3);
    loadArtworks().then(function (res) {
      var items = res.items;
      var withImg = items.filter(function (a) { return a.image; });
      var pool = (withImg.length >= 3 ? withImg : items).slice(0, 3);
      collage.innerHTML = "";
      pool.forEach(function (a) {
        var t = el("div", { class: "tile" }, [el("div", { class: "ph", style: "position:absolute;inset:0;display:grid;place-items:center;font-weight:900;font-size:48px;color:rgba(31,101,184,.3)", text: (a.title || "").slice(0, 1) })]);
        if (a.image) { var im = el("img", { src: thumb(a.image, 600), alt: "", referrerpolicy: "no-referrer", style: "position:relative" }); im.addEventListener("error", function () { im.remove(); }); t.appendChild(im); }
        collage.appendChild(t);
      });
      var artists = {}, projects = {};
      items.forEach(function (a) { if (a.artist) artists[a.artist] = 1; if (a.project) projects[a.project] = 1; });
      s1.textContent = items.filter(function (x) { return x.held !== false; }).length; s2.textContent = Object.keys(artists).length; s3.textContent = Object.keys(projects).length;

      var cur = onView(items);
      var sec = $("#home-now-sec");
      if (cur.length) {
        fillGrid(nowGrid, cur.slice(0, 6), true);
        var names = {}; cur.forEach(function (a) { names[a.exhibit] = 1; });
        $("#home-now-title").textContent = Object.keys(names).join(" · ");
      } else {
        empty(nowGrid, "지금은 진행 중인 전시가 없어요", "전시가 열리면 이곳에 바로 소개됩니다. 그동안 소장 작품을 먼저 만나보세요.", "collection.html", "전체 작품 보기");
        $("#home-now-title").textContent = "곧 새로운 전시로 찾아뵙겠습니다";
      }
      var pick = $("#home-pick");
      var heldItems = items.filter(function (a) { return a.held !== false; });
      fillGrid(pick, heldItems.filter(function (a) { return a.image; }).slice(0, 4).concat(heldItems.filter(function (a) { return !a.image; })).slice(0, 4), false);
      sampleNotice($("#home-notice"), res);
      loadGuests(3).then(function (g) { renderMsgs($("#home-msgs"), g.items); });
    });
  }

  function initNow() {
    var root = $("#now-root"), head = $("#now-head");
    skeletons(root, 4); root.className = "grid";
    loadArtworks().then(function (res) {
      var cur = onView(res.items);
      sampleNotice($("#now-notice"), res);
      if (!cur.length) {
        root.className = ""; empty(root, "지금은 진행 중인 전시가 없어요", "전시가 시작되면 시트의 ‘전시중’ 열에 전시명이 적힌 작품만 이 페이지에 모아 보여드립니다.", "collection.html", "소장 작품 둘러보기");
        return;
      }
      var groups = {}, order = [];
      cur.forEach(function (a) { var k = a.exhibit; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(a); });
      root.className = ""; root.innerHTML = "";
      var exMap = CFG.EXHIBITIONS || {};
      order.forEach(function (name) {
        var info = exMap[name];
        var sec = el("div", { class: "ex-group" });
        sec.appendChild(el("h2", {}, [name, el("span", { class: "chip", text: groups[name].length + "점" })]));
        var g = el("div", { class: "grid" }); fillGrid(g, groups[name], false); sec.appendChild(g);
        root.appendChild(sec);
        if (info) {
          var rows = [el("div", { class: "t", text: name })];
          if (info.period) rows.push(el("div", { class: "r" }, [el("b", { text: "일시" }), info.period]));
          if (info.place) rows.push(el("div", { class: "r" }, [el("b", { text: "장소" }), info.place]));
          if (info.link) rows.push(el("div", { class: "r" }, [el("b", { text: "안내" }), el("a", { href: info.link, target: "_blank", rel: "noopener", style: "color:var(--point);font-weight:700", text: "전시 안내 페이지 ↗" })]));
          head.appendChild(el("div", { class: "ex-card" }, rows));
        }
      });
      $("#now-count").textContent = cur.length + "점의 작품이 전시되고 있어요";
    });
  }

  function initCollection() {
    var grid = $("#col-grid"), q = $("#q"), pills = $("#pills"), cnt = $("#cnt");
    skeletons(grid, 8);
    loadArtworks().then(function (res) {
      sampleNotice($("#col-notice"), res);
      var items = res.items, state = { q: "", project: "전체", heldOnly: false };
      var heldBtn = $("#heldOnly");
      if (items.some(function (a) { return a.held === false; })) {
        heldBtn.hidden = false;
        heldBtn.addEventListener("click", function () {
          state.heldOnly = !state.heldOnly; heldBtn.setAttribute("aria-pressed", state.heldOnly); apply();
        });
      }
      var projects = ["전체"]; items.forEach(function (a) { if (a.project && projects.indexOf(a.project) < 0) projects.push(a.project); });
      pills.innerHTML = "";
      projects.forEach(function (p) {
        var b = el("button", { class: "pill", type: "button", "aria-pressed": p === "전체", text: p, onclick: function () {
          state.project = p; [].forEach.call(pills.children, function (c) { c.setAttribute("aria-pressed", c === b); }); apply();
        } });
        pills.appendChild(b);
      });
      function apply() {
        var term = state.q.trim().toLowerCase();
        var out = items.filter(function (a) {
          if (state.project !== "전체" && a.project !== state.project) return false;
          if (state.heldOnly && a.held === false) return false;
          if (!term) return true;
          return [a.title, a.artist, a.medium, a.intro, a.id, a.project].join(" ").toLowerCase().indexOf(term) > -1;
        });
        cnt.textContent = out.length + "점";
        if (!out.length) empty(grid, "조건에 맞는 작품이 없어요", "검색어를 바꾸거나 필터를 ‘전체’로 되돌려 보세요.");
        else fillGrid(grid, out, true);
      }
      q.addEventListener("input", function () { state.q = q.value; apply(); });
      apply();
    });
  }

  /* ---------- guestbook ---------- */
  function loadGuests(limit) {
    if (!CFG.API_URL) return Promise.resolve({ items: (window.ONEUL_SAMPLE_GUESTS || []).slice(0, limit || 100), sample: true });
    return fetch(CFG.API_URL + (CFG.API_URL.indexOf("?") > -1 ? "&" : "?") + "action=guestbook")
      .then(function (r) { return r.json(); })
      .then(function (j) { return { items: (j.items || []).slice(0, limit || 100) }; })
      .catch(function () { return { items: [], error: true }; });
  }
  function renderMsgs(node, items) {
    if (!node) return;
    node.innerHTML = "";
    if (!items.length) { node.appendChild(el("div", { class: "empty" }, [el("div", { class: "em", text: "✍️" }), el("h3", { text: "첫 방명록을 남겨주세요" })])); return; }
    items.forEach(function (m) {
      node.appendChild(el("article", { class: "msg" }, [
        el("p", { text: m.message }),
        el("footer", {}, [el("b", { text: m.name || "익명" }), el("span", { text: m.date || "" })])
      ]));
    });
  }
  function initGuestbook() {
    var list = $("#gb-list"), form = $("#gb-form"), msg = $("#gb-msg"), cntEl = $("#gb-count"), sub = $("#gb-submit");
    function refresh() { loadGuests(100).then(function (g) { renderMsgs(list, g.items); if (g.sample) { var n = $("#gb-notice"); n.textContent = "미리보기 상태입니다. Apps Script 주소를 연결하면 실제 방명록이 저장됩니다."; n.style.display = "block"; } }); }
    msg.addEventListener("input", function () { cntEl.textContent = msg.value.length + " / 300"; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.website.value) return; // honeypot
      var name = form.gname.value.trim().slice(0, 20), text = msg.value.trim();
      if (text.length < 2) { toast("방명록 내용을 2자 이상 입력해주세요."); return; }
      if (!CFG.API_URL) { toast("아직 Apps Script가 연결되지 않아 저장할 수 없어요."); return; }
      var last = Number(safeGet("oneul_gb_last") || 0);
      if (Date.now() - last < 30000) { toast("잠시 후 다시 남겨주세요."); return; }
      sub.disabled = true; sub.textContent = "남기는 중…";
      fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "guestbook", name: name, message: text.slice(0, 300) }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || "fail");
          safeSet("oneul_gb_last", String(Date.now()));
          form.reset(); cntEl.textContent = "0 / 300"; toast("방명록이 등록되었어요. 감사합니다 💙"); refresh();
        })
        .catch(function () { toast("등록에 실패했어요. 잠시 후 다시 시도해주세요."); })
        .then(function () { sub.disabled = false; sub.textContent = "방명록 남기기"; });
    });
    refresh();
  }

  /* ---------- boot ---------- */
  function reveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { [].forEach.call(els, function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
    [].forEach.call(els, function (e) { io.observe(e); });
  }
  mountLayout();
  ({ home: initHome, now: initNow, collection: initCollection, guestbook: initGuestbook })[page]();
  reveal();
})();
