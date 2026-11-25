/* ===== 소식 페이지 ===== */
(function () {
  "use strict";
  var C = window.OneulCore;
  var $ = C.$, el = C.el;

  function render() {
    var root = $("#news-root");
    var items = (window.ONEUL_NEWS || []).slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    if (!items.length) {
      root.appendChild(el("div", { class: "empty" }, [
        el("div", { class: "em", text: "📰" }),
        el("h3", { text: "아직 등록된 소식이 없어요" }),
        el("p", { text: "docs/assets/news-data.js 에 보도자료·블로그 글 링크를 추가하면 여기에 나타납니다." })
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
  }

  render();
})();
