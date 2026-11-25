/* ===== 전시 페이지 (진행중 표시가 붙은 단일 목록) ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, el = C.el;

  var root = $("#now-root");
  G.skeletons(root, 6);
  D.loadExhibitionList().then(function (res) {
    G.sampleNotice($("#now-notice"), res);
    var items = res.items || [];
    if (!items.length) {
      G.empty(root, "아직 등록된 전시가 없어요", "전시가 등록되면 이곳에 모여 보여집니다.", "collection.html", "소장 작품 둘러보기");
      return;
    }
    root.className = "archive-grid";
    root.innerHTML = "";
    items.forEach(function (ex) { root.appendChild(G.archiveCard(ex)); });
  });
})();
