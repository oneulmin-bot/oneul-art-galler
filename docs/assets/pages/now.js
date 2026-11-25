/* ===== 전시 페이지 (현재/지난 탭) ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, $all = C.$all, el = C.el, thumb = C.thumb;

  function posterBox(url, title) {
    var box = el("div", { class: "poster" });
    var src = thumb(url, 900);
    if (src) {
      var im = el("img", { src: src, alt: title + " 포스터", referrerpolicy: "no-referrer" });
      im.addEventListener("error", function () { im.remove(); box.appendChild(el("div", { class: "ph", text: title })); });
      box.appendChild(im);
    } else {
      box.appendChild(el("div", { class: "ph", text: title }));
    }
    return box;
  }

  function initCurrent() {
    var root = $("#now-root"), head = $("#now-head");
    G.skeletons(root, 4);
    D.loadExhibitionInfo().then(function (res) {
      G.sampleNotice($("#now-notice"), res);
      var info = res.item;
      if (!info || !info.items || !info.items.length) {
        head.innerHTML = "";
        G.empty(root, "지금은 진행 중인 전시가 없어요", "전시가 시작되면 관리자 페이지에서 지정한 전시의 작품이 이곳에 모여 보여집니다.", "collection.html", "소장 작품 둘러보기");
        $("#now-count").textContent = "";
        return;
      }
      var rows = [];
      if (info.period) rows.push(el("span", {}, [el("b", { text: "일시 " }), info.period]));
      if (info.place) rows.push(el("span", {}, [el("b", { text: "장소 " }), info.place]));
      head.innerHTML = "";
      head.appendChild(el("div", { class: "ex-head" }, [
        posterBox(info.poster, info.name),
        el("div", {}, [
          el("h2", { text: info.name, style: "font-size:24px" }),
          el("div", { class: "facts", style: "margin:10px 0 0" }, rows),
          info.intro ? el("p", { class: "intro", text: info.intro }) : null
        ])
      ]));
      root.innerHTML = "";
      G.fillGrid(root, info.items, false);
      $("#now-count").textContent = info.items.length + "점의 작품이 전시되고 있어요";
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
        var card = el("div", { class: "archive-card" }, [
          posterBox(ex.poster, ex.name),
          ex.place ? el("span", { class: "place", text: ex.place }) : null,
          el("h3", { text: ex.name }),
          ex.intro ? el("p", { class: "desc", text: ex.intro }) : null,
          el("div", { class: "r" }, [el("b", { text: "일시" }), ex.period || ""]),
          el("span", { class: "count", text: ex.count + "점 참여" })
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
