/* ===== 소식 페이지 (구글시트 '소식' 탭 기반) ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData, G = window.OneulGallery;
  var $ = C.$, el = C.el;

  var root = $("#news-root");
  G.skeletons(root, 4);
  D.loadNews().then(function (res) {
    G.sampleNotice($("#news-notice"), res);
    root.className = "";
    root.innerHTML = "";
    var items = res.items || [];
    if (!items.length) {
      root.appendChild(el("div", { class: "empty" }, [
        el("div", { class: "em", text: "📰" }),
        el("h3", { text: "아직 등록된 소식이 없어요" }),
        el("p", { text: "구글시트 '소식' 탭에 날짜/제목/출처/링크를 한 줄씩 추가하면 여기에 나타납니다." })
      ]));
      return;
    }
    var list = el("div", { class: "news-list" });
    items.forEach(function (n) {
      list.appendChild(el("a", { class: "news-item", href: n.url, target: "_blank", rel: "noopener" }, [
        el("span", { class: "date", text: n.date || "" }),
        el("h3", { text: n.title || "" }),
        el("span", { class: "source", text: n.source || "" })
      ]));
    });
    root.appendChild(list);
  });
})();
