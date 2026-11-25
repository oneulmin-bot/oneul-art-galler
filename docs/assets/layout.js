/* ===== 헤더/푸터 마운트 (공개 5개 페이지 공통, 관리자 페이지는 포함하지 않음) ===== */
(function () {
  "use strict";
  var C = window.OneulCore;
  var CFG = window.ONEUL || {};
  var page = document.body.getAttribute("data-page") || "home";

  function mountLayout() {
    var links = CFG.NAV || [];
    var nav = C.el("nav", { class: "nav", id: "nav", "aria-label": "주 메뉴" }, links.map(function (l) {
      return C.el("a", { href: l.href, "aria-current": page === l.key ? "page" : false, text: l.label });
    }));
    var btn = C.el("button", { class: "menu-btn", "aria-label": "메뉴 열기", "aria-expanded": "false", onclick: function () {
      var o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o);
    } }, [C.el("span")]);
    var header = C.el("header", { class: "site-header" }, [C.el("div", { class: "wrap" }, [
      C.el("a", { href: "index.html", class: "brand", "aria-label": (CFG.ORG_NAME || "") + " 홈" }, [
        C.el("img", { src: "assets/img/logo-horizontal.png", alt: CFG.ORG_NAME || "" }),
        C.el("small", { text: "아트 갤러리" })
      ]),
      nav, btn
    ])]);
    document.body.insertBefore(header, document.body.firstChild);

    var footer = C.el("footer", { class: "site-footer" }, [C.el("div", { class: "wrap" }, [
      C.el("div", {}, [
        C.el("div", { class: "brand" }, [C.el("img", { src: "assets/img/logo-horizontal.png", alt: CFG.ORG_NAME || "" })]),
        C.el("small", { text: "© " + new Date().getFullYear() + " " + (CFG.ORG_NAME || "") + ". All rights reserved." }),
        C.el("small", { text: "작품의 저작권은 각 작가에게 있습니다. 무단 전재 및 재배포를 금합니다." })
      ]),
      C.el("div", { class: "foot-links" }, links.concat(CFG.FOOT_EXTRA || []).map(function (l) { return C.el("a", { href: l.href, text: l.label }); }))
    ])]);
    document.body.appendChild(footer);
  }

  window.OneulLayout = { mountLayout: mountLayout };
  mountLayout();
})();
