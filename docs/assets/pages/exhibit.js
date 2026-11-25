/* ===== 전시 상세 페이지 ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, el = C.el;

  var root = $("#ex-detail-root");
  var params = new URLSearchParams(location.search);
  var name = params.get("name") || "";

  if (!name) {
    G.empty(root, "전시를 찾을 수 없어요", "전시 목록에서 다시 선택해 주세요.", "now.html", "전시 목록으로");
  } else {
    G.skeletons(root, 4);
    D.loadExhibitionDetail(name).then(function (res) {
      var info = res.item;
      if (!info) {
        G.empty(root, "전시를 찾을 수 없어요", "삭제되었거나 주소가 바뀐 전시일 수 있어요.", "now.html", "전시 목록으로");
        return;
      }
      root.className = "";
      root.innerHTML = "";
      var facts = [];
      if (info.period) facts.push(el("span", {}, [el("b", { text: "일시 " }), info.period]));
      if (info.place) facts.push(el("span", {}, [el("b", { text: "장소 " }), info.place]));

      var infoCol = el("div", {}, [
        el("h1", { text: info.name, style: "font-size:28px" }),
        el("div", { class: "facts", style: "margin:12px 0 0" }, facts),
        info.intro ? el("p", { class: "intro", text: info.intro }) : null,
        info.blogUrl ? el("div", { style: "margin-top:20px" }, [
          el("a", { class: "btn btn-primary", href: info.blogUrl, target: "_blank", rel: "noopener", text: "전시 후기 보러가기 →" })
        ]) : null
      ]);

      root.appendChild(el("div", { class: "ex-head" }, [G.posterBox(info.poster, info.name), infoCol]));

      var grid = el("div", { class: "grid", style: "margin-top:48px" });
      if (info.items && info.items.length) {
        G.fillGrid(grid, info.items, false);
      } else {
        grid.appendChild(el("div", { class: "empty" }, [el("div", { class: "em", text: "🖼️" }), el("h3", { text: "등록된 작품 사진이 아직 없어요" })]));
      }
      root.appendChild(el("div", {}, [
        el("div", { class: "sechead", style: "margin-top:0" }, [el("div", {}, [el("span", { class: "label", text: "Works" }), el("h2", { text: "전시 작품" })])]),
        grid
      ]));

      C.reveal();
    });
  }
})();
