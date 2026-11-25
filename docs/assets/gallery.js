/* ===== 작품 카드 / 모달 / 그리드 / 그룹핑 헬퍼 (전역 window.OneulGallery) ===== */
(function () {
  "use strict";
  var C = window.OneulCore;
  var $ = C.$, el = C.el, thumb = C.thumb;

  /* ---------- modal ---------- */
  var modal;
  function ensureModal() {
    if (modal) return modal;
    modal = el("dialog", { class: "modal", "aria-label": "작품 상세" });
    modal.addEventListener("click", function (e) { if (e.target.classList.contains("modal-shell")) modal.close(); });
    document.body.appendChild(modal);
    return modal;
  }
  function audioBlock(a) {
    if (!a.audio) return null;
    var ytUrl = C.youtubeEmbed(a.audio);
    var kids = [el("h4", { text: "음성해설" }), el("p", { class: "audio-desc", text: "시각장애인분들을 위한 음성해설 안내 영상입니다." })];
    if (ytUrl) {
      kids.push(el("div", { class: "audio-embed" }, [
        el("iframe", {
          src: ytUrl,
          title: (a.title || "작품") + " 음성해설 영상",
          loading: "lazy",
          allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          referrerpolicy: "no-referrer"
        })
      ]));
    } else {
      kids.push(el("a", { class: "btn btn-primary btn-sm", href: a.audio, target: "_blank", rel: "noopener", text: "🎧 음성해설 듣기" }));
    }
    return el("div", { style: "margin-top:24px" }, kids);
  }
  function openModal(a) {
    var m = ensureModal(); m.innerHTML = "";
    var img = thumb(a.image, 1400);
    var facts = [a.year, a.size, a.medium].filter(Boolean).map(function (f) { return el("span", { class: "chip", text: f }); });
    var body = el("div", { class: "modal-body" }, [
      el("div", {}, [el("span", { class: "chip", text: a.project || "소장 작품" })]),
      el("h2", { text: a.title || "제목 없음" }),
      el("div", { class: "artist", text: a.artist || "" }),
      el("div", { class: "facts" }, facts),
      a._isCurrent ? el("div", { class: "notice", text: "📍 현재 전시 중 · " + a._exhibitName }) : null,
      el("h4", { text: "작품 소개" }), el("p", { text: a.intro || "작품 소개 준비 중입니다." }),
      a.bio ? el("h4", { text: "작가 소개" }) : null, a.bio ? el("p", { class: "bio", text: a.bio }) : null,
      a.topic ? el("h4", { text: "대화청년 주제" }) : null, a.topic ? el("p", { text: a.topic }) : null,
      audioBlock(a)
    ]);
    var media = el("div", { class: "modal-img" }, [img ? el("img", { src: img, alt: (a.title || "작품") + " 이미지", referrerpolicy: "no-referrer" }) : el("div", { class: "ph", text: a.id || "" })]);
    var card = el("div", { class: "modal-card" }, [
      el("button", { class: "close", "aria-label": "닫기", text: "×", onclick: function () { m.close(); } }), media, body
    ]);
    m.appendChild(el("div", { class: "modal-shell" }, [card]));
    if (m.showModal) m.showModal(); else m.setAttribute("open", "");
    document.body.style.overflow = "hidden";
    m.addEventListener("close", function () { document.body.style.overflow = ""; }, { once: true });
  }

  /* ---------- card / row ---------- */
  function artCard(a, showBadge) {
    var src = thumb(a.image, 700);
    var th = el("div", { class: "thumb" }, [el("div", { class: "ph", text: (a.title || "").slice(0, 1) })]);
    if (src) {
      var im = el("img", { src: src, alt: (a.title || "작품") + " — " + (a.artist || ""), loading: "lazy", referrerpolicy: "no-referrer" });
      im.addEventListener("error", function () { im.remove(); });
      th.appendChild(im);
    }
    if (showBadge && a._isCurrent) th.appendChild(el("span", { class: "badge", text: "전시중" }));
    if (a.audio) th.appendChild(el("span", { class: "badge badge-audio", "aria-label": "음성해설 제공", text: "🎧" }));
    return el("button", { class: "art", type: "button", "aria-label": (a.title || "") + " 상세 보기" + (a.audio ? " · 음성해설 제공" : ""), onclick: function () { openModal(a); } }, [
      th,
      el("div", { class: "info" }, [
        el("span", { class: "no", text: a.id || "" }),
        el("h3", { text: a.title || "제목 없음" }),
        el("span", { class: "who", text: a.artist || "" }),
        el("span", { class: "meta", text: [a.size, a.medium].filter(Boolean).join(" · ") })
      ])
    ]);
  }

  function nRow(a, index) {
    var src = thumb(a.image, 200);
    var th = el("div", { class: "th" });
    if (src) {
      var im = el("img", { src: src, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });
      im.addEventListener("error", function () { im.remove(); th.textContent = (a.title || "").slice(0, 1); });
      th.appendChild(im);
    } else { th.textContent = (a.title || "").slice(0, 1); }
    return el("button", { class: "nrow", type: "button", onclick: function () { openModal(a); } }, [
      el("span", { class: "n", text: String(index + 1).padStart(2, "0") }),
      th,
      el("div", { class: "nm" }, [el("h4", { text: a.title || "제목 없음" }), el("span", { text: a.artist || "" })]),
      el("span", { class: "meta", text: [a.size, a.medium].filter(Boolean).join(" · ") })
    ]);
  }

  function fillGrid(node, items, showBadge) {
    node.className = "grid";
    node.innerHTML = "";
    items.forEach(function (a) { node.appendChild(artCard(a, showBadge)); });
  }
  function fillList(node, items) {
    node.className = "nlist";
    node.innerHTML = "";
    items.forEach(function (a, i) { node.appendChild(nRow(a, i)); });
  }
  function fillGroupedGrid(node, groups, showBadge) {
    node.className = "grid";
    node.innerHTML = "";
    groups.forEach(function (g) {
      node.appendChild(el("div", { class: "ghead" }, [el("h3", { text: g.label }), el("span", { text: g.items.length + "점" })]));
      g.items.forEach(function (a) { node.appendChild(artCard(a, showBadge)); });
    });
  }

  /* ---------- grouping ---------- */
  function groupByArtist(items) {
    var order = [], map = {};
    items.forEach(function (a) {
      var k = a.artist || "작가 미상";
      if (!map[k]) { map[k] = []; order.push(k); }
      map[k].push(a);
    });
    return order.map(function (k) { return { key: k, label: k, items: map[k] }; });
  }
  function groupByYearProject(items) {
    var order = [], map = {};
    items.forEach(function (a) {
      var k = [a.year, a.project].filter(Boolean).join(" · ") || "기타";
      if (!map[k]) { map[k] = []; order.push(k); }
      map[k].push(a);
    });
    return order.map(function (k) { return { key: k, label: k, items: map[k] }; });
  }

  /* ---------- states ---------- */
  function skeletons(node, n) {
    node.className = "grid";
    node.innerHTML = "";
    for (var i = 0; i < n; i++) node.appendChild(el("div", { class: "skeleton" }));
  }
  function sampleNotice(node, res) {
    if (node) node.innerHTML = "";
    if (res && res.sample && node) node.appendChild(el("div", { class: "notice", text: "미리보기용 샘플 데이터가 표시되고 있습니다" + (res.why ? " (" + res.why + ")" : "") + " — docs/assets/config.js 에 Apps Script 주소를 연결하면 실제 데이터가 표시됩니다." }));
  }
  function empty(node, title, desc, href, label) {
    node.className = "";
    node.innerHTML = "";
    node.appendChild(el("div", { class: "empty" }, [
      el("div", { class: "em", text: "🖼️" }), el("h3", { text: title }), el("p", { text: desc }),
      href ? el("a", { class: "btn btn-primary", href: href, text: label }) : null
    ]));
  }

  window.OneulGallery = {
    openModal: openModal, artCard: artCard, nRow: nRow,
    fillGrid: fillGrid, fillList: fillList, fillGroupedGrid: fillGroupedGrid,
    groupByArtist: groupByArtist, groupByYearProject: groupByYearProject,
    skeletons: skeletons, sampleNotice: sampleNotice, empty: empty
  };
})();
