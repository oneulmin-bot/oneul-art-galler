/* ===== 소식 페이지 ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData;
  var $ = C.$, el = C.el;

  function isSafeUrl(u) { return /^https?:\/\//i.test(String(u || "")); }

  function render(items) {
    var root = $("#news-root");
    root.innerHTML = "";
    items = (items || []).filter(function (n) { return n.title && isSafeUrl(n.url); })
      .sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
    if (!items.length) {
      root.appendChild(el("div", { class: "empty" }, [
        el("div", { class: "em", text: "📰" }),
        el("h3", { text: "아직 등록된 소식이 없어요" }),
        el("p", { text: "관리자 페이지의 '소식 관리' 또는 구글시트 '소식' 탭에서 기사를 추가하면 여기에 나타납니다." })
      ]));
      return;
    }
    var list = el("div", { class: "news-list" });
    items.forEach(function (n) {
      list.appendChild(el("a", { class: "news-item", href: n.url, target: "_blank", rel: "noopener" }, [
        el("span", { class: "date", text: n.date || "" }),
        el("div", { class: "body" }, [
          el("h3", { text: n.title }),
          n.exhibition ? el("span", { class: "ex", text: n.exhibition }) : null
        ]),
        el("span", { class: "source", text: n.source || "" })
      ]));
    });
    root.appendChild(list);
  }

  D.loadNews().then(function (res) { render(res.items); });
})();
