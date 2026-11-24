/* ===== 전시 페이지 (현재/지난 탭) ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, $all = C.$all, el = C.el;
  var CFG = window.ONEUL || {};

  function initCurrent() {
    var root = $("#now-root"), head = $("#now-head");
    G.skeletons(root, 4);
    Promise.all([D.loadArtworks(), D.loadExhibitionInfo()]).then(function (res) {
      var artRes = res[0], exInfo = res[1];
      var cur = D.onView(artRes.items);
      G.sampleNotice($("#now-notice"), artRes);
      if (!cur.length) {
        G.empty(root, "지금은 진행 중인 전시가 없어요", "전시가 시작되면 시트의 '전시중' 열에 전시명이 적힌 작품만 이 페이지에 모아 보여드립니다.", "collection.html", "소장 작품 둘러보기");
        $("#now-count").textContent = "";
        return;
      }
      var groups = {}, order = [];
      cur.forEach(function (a) { var k = a.exhibit; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(a); });
      root.innerHTML = "";
      order.forEach(function (name) {
        var sec = el("div", { class: "ex-group" });
        sec.appendChild(el("h2", {}, [name, el("span", { class: "chip", text: groups[name].length + "점" })]));
        var g = el("div", {}); G.fillGrid(g, groups[name], false); sec.appendChild(g);
        root.appendChild(sec);
      });
      if (exInfo.item) {
        var info = exInfo.item;
        var rows = [el("div", { class: "t", text: info.name || order[0] || "" })];
        if (info.period) rows.push(el("div", { class: "r" }, [el("b", { text: "일시" }), info.period]));
        if (info.place) rows.push(el("div", { class: "r" }, [el("b", { text: "장소" }), info.place]));
        if (info.link) rows.push(el("div", { class: "r" }, [el("a", { href: info.link, target: "_blank", rel: "noopener", style: "color:var(--point);font-weight:700", text: "전시 안내 페이지 ↗" })]));
        head.innerHTML = ""; head.appendChild(el("div", { class: "ex-card" }, rows));
      }
      $("#now-count").textContent = cur.length + "점의 작품이 전시되고 있어요";
    });
  }

  function initPast() {
    var root = $("#past-root");
    root.innerHTML = "";
    G.skeletons(root, 3);
    D.loadExhibitionArchive().then(function (res) {
      G.sampleNotice($("#past-notice"), res);
      var items = res.items || [];
      root.className = "";
      if (!items.length) {
        G.empty(root, "아직 지난 전시 기록이 없어요", "전시가 끝나면 이곳에 기록이 쌓입니다.");
        return;
      }
      root.className = "archive-grid";
      root.innerHTML = "";
      items.forEach(function (ex) {
        var rows = [];
        if (ex.period) rows.push(el("div", { class: "r" }, [el("b", { text: "일시" }), ex.period]));
        if (ex.place) rows.push(el("div", { class: "r" }, [el("b", { text: "장소" }), ex.place]));
        var card = el("div", { class: "archive-card" }, [
          el("h3", { text: ex.name || "" }),
          ...rows,
          ex.link ? el("a", { class: "link-more", href: ex.link, target: "_blank", rel: "noopener", text: "안내 페이지 보기 →" }) : null
        ]);
        root.appendChild(card);
      });
    });
  }

  function initTabs() {
    var tabs = $all('.tabs [role="tab"]');
    var panels = { current: $("#panel-current"), past: $("#panel-past") };
    var loaded = { past: false };
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", "false"); });
        t.setAttribute("aria-selected", "true");
        var view = t.getAttribute("data-view");
        Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== view; });
        if (view === "past" && !loaded.past) { loaded.past = true; initPast(); }
      });
    });
  }

  initTabs();
  initCurrent();
})();
