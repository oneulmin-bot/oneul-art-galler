/* ===== 관리자 페이지 로직 (공개 번들과 분리 로드) ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData;
  var $ = C.$, $all = C.$all, el = C.el, thumb = C.thumb;
  var CFG = window.ONEUL || {};
  var PASS_KEY = "oneul_admin_pass";

  function apiPost(action, payload) {
    if (!CFG.API_URL) return Promise.reject(new Error("API_URL 미설정"));
    var body = Object.assign({ action: action, pass: C.safeSessionGet(PASS_KEY) || "" }, payload || {});
    return fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || "요청 실패"); return j; });
  }
  function apiGet(action, extra) {
    var url = D.api(action, extra);
    if (!url) return Promise.reject(new Error("API_URL 미설정"));
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || "요청 실패"); return j; });
  }

  function setStatus(id, ok, text) {
    var n = $(id);
    n.textContent = text; n.className = "admin-status show " + (ok ? "ok" : "err");
    setTimeout(function () { n.classList.remove("show"); }, 4000);
  }

  /* ---------- gate ---------- */
  function showShell() { $("#gate").style.display = "none"; $("#shell").classList.add("on"); loadAll(); }
  function tryPass(pass) {
    C.safeSessionSet(PASS_KEY, pass);
    apiGet("adminPing", "&pass=" + encodeURIComponent(pass)).then(function () {
      showShell();
    }).catch(function () {
      C.safeSessionRemove(PASS_KEY);
      $("#gate-err").classList.add("show");
    });
  }
  $("#gate-submit").addEventListener("click", function () {
    $("#gate-err").classList.remove("show");
    var p = $("#gate-pass").value.trim();
    if (!p) return;
    tryPass(p);
  });
  $("#gate-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#gate-submit").click(); });
  $("#logout-btn").addEventListener("click", function () {
    C.safeSessionRemove(PASS_KEY);
    location.reload();
  });
  var existing = C.safeSessionGet(PASS_KEY);
  if (existing) tryPass(existing);

  /* ---------- tabs ---------- */
  $all('.admin-tabs [role="tab"]').forEach(function (t) {
    t.addEventListener("click", function () {
      $all('.admin-tabs [role="tab"]').forEach(function (x) { x.setAttribute("aria-selected", "false"); });
      t.setAttribute("aria-selected", "true");
      $all(".admin-panel").forEach(function (p) { p.classList.remove("on"); });
      $("#panel-" + t.getAttribute("data-panel")).classList.add("on");
    });
  });

  /* ---------- guestbook moderation ---------- */
  function loadGuestAdmin() {
    apiGet("adminGuestbook", "&pass=" + encodeURIComponent(C.safeSessionGet(PASS_KEY) || "")).then(function (j) {
      var items = j.items || [];
      var tbody = $("#guest-tbody"); tbody.innerHTML = "";
      $("#guest-empty").hidden = !!items.length;
      items.forEach(function (g) {
        var tr = el("tr", { class: g.hidden ? "hidden-row" : "" }, [
          el("td", { text: g.date || "" }),
          el("td", { text: g.name || "익명" }),
          el("td", { class: "msgcell", text: g.message || "" }),
          el("td", {}, [el("div", { class: "admin-actions" }, [
            el("button", { text: g.hidden ? "숨김 해제" : "숨기기", onclick: function () { hideGuest(g.row, !g.hidden); } }),
            el("button", { class: "danger", text: "삭제", onclick: function () { deleteGuest(g.row); } })
          ])])
        ]);
        tbody.appendChild(tr);
      });
    }).catch(function (e) { setStatus("#guest-status", false, e.message); });
  }
  function hideGuest(row, hide) {
    apiPost("adminHideGuest", { row: row, hide: hide }).then(function () {
      setStatus("#guest-status", true, "저장되었습니다."); loadGuestAdmin();
    }).catch(function (e) { setStatus("#guest-status", false, e.message); });
  }
  function deleteGuest(row) {
    if (!confirm("이 방명록을 완전히 삭제할까요? 되돌릴 수 없습니다.")) return;
    apiPost("adminDeleteGuest", { row: row }).then(function () {
      setStatus("#guest-status", true, "삭제되었습니다."); loadGuestAdmin();
    }).catch(function (e) { setStatus("#guest-status", false, e.message); });
  }

  /* ---------- exhibit settings ---------- */
  function loadExhibit() {
    D.loadExhibitionInfo().then(function (res) {
      var info = res.item || {};
      $("#ex-name").value = info.name || "";
      $("#ex-period").value = info.period || "";
      $("#ex-place").value = info.place || "";
      $("#ex-link").value = info.link || "";
    });
    D.loadArtworks().then(function (res) {
      var list = $("#art-checklist"); list.innerHTML = "";
      res.items.forEach(function (a) {
        var row = el("label", { class: "admin-check-row" });
        var cb = el("input", { type: "checkbox" }); cb.checked = !!(a.exhibit && a.exhibit.trim());
        cb.dataset.id = a.id;
        var th = el("div", { class: "th" }); var src = thumb(a.image, 120);
        if (src) { var im = el("img", { src: src, alt: "" }); im.addEventListener("error", function () { im.remove(); th.textContent = (a.title || "").slice(0, 1); }); th.appendChild(im); }
        else th.textContent = (a.title || "").slice(0, 1);
        row.appendChild(cb); row.appendChild(th);
        row.appendChild(el("div", { class: "nm" }, [a.title || "제목 없음", el("span", { text: a.artist || "" })]));
        row.appendChild(el("span", { class: "meta", text: a.id || "" }));
        list.appendChild(row);
      });
    });
  }
  $("#ex-save").addEventListener("click", function () {
    apiPost("adminSetExhibitionInfo", {
      name: $("#ex-name").value.trim(), period: $("#ex-period").value.trim(),
      place: $("#ex-place").value.trim(), link: $("#ex-link").value.trim()
    }).then(function () { setStatus("#ex-status", true, "전시 정보가 저장되었습니다."); })
      .catch(function (e) { setStatus("#ex-status", false, e.message); });
  });
  $("#art-save").addEventListener("click", function () {
    var ids = $all("#art-checklist input[type=checkbox]:checked").map(function (c) { return c.dataset.id; });
    var exhibitName = $("#ex-name").value.trim();
    if (!exhibitName && ids.length) { setStatus("#art-status", false, "먼저 전시명을 입력하고 저장해 주세요."); return; }
    apiPost("adminSetArtworkExhibit", { exhibitName: exhibitName, ids: ids }).then(function () {
      setStatus("#art-status", true, "전시중 작품이 저장되었습니다.");
    }).catch(function (e) { setStatus("#art-status", false, e.message); });
  });

  /* ---------- archive ---------- */
  function loadArchive() {
    apiGet("exhibitionArchive").then(function (j) {
      var items = j.items || [];
      var tbody = $("#arc-tbody"); tbody.innerHTML = "";
      $("#arc-empty").hidden = !!items.length;
      items.forEach(function (ex) {
        tbody.appendChild(el("tr", {}, [
          el("td", { text: ex.name || "" }), el("td", { text: ex.period || "" }), el("td", { text: ex.place || "" }),
          el("td", {}, [el("div", { class: "admin-actions" }, [
            el("button", { class: "danger", text: "삭제", onclick: function () { deleteArchive(ex.row); } })
          ])])
        ]));
      });
    });
  }
  $("#arc-add").addEventListener("click", function () {
    var name = $("#arc-name").value.trim();
    if (!name) { setStatus("#arc-status", false, "전시명을 입력해 주세요."); return; }
    apiPost("adminAddExhibitionArchive", {
      name: name, period: $("#arc-period").value.trim(), place: $("#arc-place").value.trim(), link: $("#arc-link").value.trim()
    }).then(function () {
      setStatus("#arc-status", true, "추가되었습니다.");
      ["arc-name", "arc-period", "arc-place", "arc-link"].forEach(function (id) { $("#" + id).value = ""; });
      loadArchive();
    }).catch(function (e) { setStatus("#arc-status", false, e.message); });
  });
  function deleteArchive(row) {
    if (!confirm("이 지난 전시 기록을 삭제할까요?")) return;
    apiPost("adminDeleteExhibitionArchive", { row: row }).then(loadArchive)
      .catch(function (e) { setStatus("#arc-status", false, e.message); });
  }

  function loadAll() { loadGuestAdmin(); loadExhibit(); loadArchive(); }
})();
