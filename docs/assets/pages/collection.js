/* ===== 전체 작품 페이지: 검색/필터 + Grid·List·Project 보기 전환 ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, $all = C.$all, el = C.el;

  var grid = $("#col-grid"), q = $("#q"), pills = $("#pills"), cnt = $("#cnt");
  var state = { q: "", project: "전체", view: "piece", items: [] };

  G.skeletons(grid, 8);

  function apply() {
    var term = state.q.trim().toLowerCase();
    var out = state.items.filter(function (a) {
      if (state.project !== "전체" && a.project !== state.project) return false;
      if (!term) return true;
      return [a.title, a.artist, a.medium, a.intro, a.id, a.project].join(" ").toLowerCase().indexOf(term) > -1;
    });
    cnt.textContent = out.length + "점";
    render(out);
  }

  function render(out) {
    if (!out.length) { G.empty(grid, "조건에 맞는 작품이 없어요", "검색어를 바꾸거나 필터를 '전체'로 되돌려 보세요."); return; }
    if (state.view === "piece") {
      G.fillGrid(grid, out, true);
    } else if (state.view === "artist") {
      var groups = G.groupByArtist(out);
      var flat = [];
      groups.forEach(function (g) { g.items.forEach(function (a) { flat.push(a); }); });
      G.fillList(grid, flat);
    } else {
      var pg = G.groupByYearProject(out);
      G.fillGroupedGrid(grid, pg, true);
    }
  }

  function initTabs() {
    var tabs = $all('.tabs [role="tab"]');
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", "false"); });
        t.setAttribute("aria-selected", "true");
        state.view = t.getAttribute("data-view");
        apply();
      });
    });
  }

  Promise.all([D.loadArtworks(), D.loadExhibitionInfo()]).then(function (all) {
    var res = all[0], exInfo = all[1];
    G.sampleNotice($("#col-notice"), res);
    state.items = res.items;
    D.markCurrent(state.items, exInfo.item);
    var projects = ["전체"];
    state.items.forEach(function (a) { if (a.project && projects.indexOf(a.project) < 0) projects.push(a.project); });
    pills.innerHTML = "";
    projects.forEach(function (p) {
      var b = el("button", { class: "pill", type: "button", "aria-pressed": p === "전체", text: p, onclick: function () {
        state.project = p; $all(".pill", pills).forEach(function (c) { c.setAttribute("aria-pressed", c === b); }); apply();
      } });
      pills.appendChild(b);
    });
    q.addEventListener("input", function () { state.q = q.value; apply(); });
    initTabs();
    apply();
  });
})();
