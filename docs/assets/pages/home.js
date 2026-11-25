/* ===== 홈 페이지 로직 ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, el = C.el, thumb = C.thumb;

  function renderHeroFrame(items) {
    var frame = $("#hero-frame");
    var withImg = items.filter(function (a) { return a.image; });
    var pick = withImg[0] || items[0];
    if (!pick) { frame.querySelector(".ph").textContent = "대표 작품 준비 중"; return; }
    var src = thumb(pick.image, 900);
    if (src) {
      var im = el("img", { src: src, alt: (pick.title || "") + " — " + (pick.artist || ""), referrerpolicy: "no-referrer" });
      im.addEventListener("error", function () { im.remove(); });
      frame.insertBefore(im, frame.querySelector(".ph"));
    }
    frame.querySelector(".ph").textContent = [pick.title, pick.artist].filter(Boolean).join(" · ");
  }

  function renderExBanner(items, info) {
    var cur = D.onView(items);
    var sec = $("#exbanner");
    if (!cur.length) { sec.hidden = true; return; }
    sec.hidden = false;
    var names = {}; cur.forEach(function (a) { names[a.exhibit] = 1; });
    var title = Object.keys(names).join(" · ");
    $("#ex-title").textContent = title;
    var facts = $("#ex-facts"); facts.innerHTML = "";
    if (info) {
      if (info.period) facts.appendChild(el("span", {}, [el("b", { text: "일시 " }), info.period]));
      if (info.place) facts.appendChild(el("span", {}, [el("b", { text: "장소 " }), info.place]));
    }
    var thumbs = $("#ex-thumbs"); thumbs.innerHTML = "";
    cur.slice(0, 3).forEach(function (a) {
      var box = el("div", { class: "th" });
      var src = thumb(a.image, 200);
      if (src) {
        var im = el("img", { src: src, alt: "", referrerpolicy: "no-referrer" });
        im.addEventListener("error", function () { im.remove(); box.textContent = (a.title || "").slice(0, 1); });
        box.appendChild(im);
      } else { box.textContent = (a.title || "").slice(0, 1); }
      thumbs.appendChild(box);
    });
  }

  function init() {
    var s1 = $("#st-works"), s2 = $("#st-artists"), s3 = $("#st-projects");
    Promise.all([D.loadArtworks(), D.loadExhibitionInfo()]).then(function (res) {
      var artRes = res[0], exInfo = res[1];
      var items = artRes.items;

      renderHeroFrame(items);
      renderExBanner(items, exInfo.item);

      var artists = {}, projects = {};
      items.forEach(function (a) { if (a.artist) artists[a.artist] = 1; if (a.project) projects[a.project] = 1; });
      s1.textContent = items.length; s2.textContent = Object.keys(artists).length; s3.textContent = Object.keys(projects).length;

      var pick = items.filter(function (a) { return a.image; }).slice(0, 4).concat(items.filter(function (a) { return !a.image; })).slice(0, 4);
      G.fillGrid($("#home-pick"), pick, false);

      G.sampleNotice($("#home-notice"), artRes);

      D.loadGuests(3).then(function (g) { renderMsgs($("#home-msgs"), g.items); });

      C.reveal();
    });
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

  init();
})();
