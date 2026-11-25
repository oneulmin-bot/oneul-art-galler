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

  /* ---------- exhibit management ---------- */
  var exState = { groups: [], metaByName: {}, currentName: "", pendingFile: null };

  function exSelected() { return $("#ex-pick").value; }

  function renderExSelection() {
    var name = exSelected();
    var g = exState.groups.filter(function (x) { return x.name === name; })[0];
    var meta = exState.metaByName[name] || {};
    $("#ex-selected-name").textContent = name || "전시 정보";
    $("#ex-selected-meta").textContent = g ? [g.period, g.place, g.count + "점 참여"].filter(Boolean).join(" · ") : "";
    $("#ex-intro").value = meta.intro || "";
    $("#ex-poster-file").value = "";
    exState.pendingFile = null;
    var prev = $("#ex-poster-preview"); prev.innerHTML = "";
    var src = thumb(meta.poster, 300);
    if (src) {
      var im = el("img", { src: src, alt: "", style: "width:100%;height:100%;object-fit:cover" });
      im.addEventListener("error", function () { im.remove(); prev.textContent = "포스터 없음"; });
      prev.appendChild(im);
    } else { prev.textContent = "포스터 없음"; }
    $("#ex-current-tag").style.display = (name && name === exState.currentName) ? "inline-block" : "none";
  }

  function loadExhibit() {
    Promise.all([apiGet("exhibitionGroups"), apiGet("exhibitionArchive"), apiGet("exhibitionInfo")]).then(function (all) {
      var groups = all[0].items || [], archive = all[1].items || [], info = all[2].item;
      var metaByName = {};
      archive.forEach(function (a) { metaByName[a.name] = { poster: a.poster, intro: a.intro }; });
      if (info) metaByName[info.name] = { poster: info.poster, intro: info.intro };
      exState.groups = groups; exState.metaByName = metaByName; exState.currentName = info ? info.name : "";

      var select = $("#ex-pick"); select.innerHTML = "";
      if (!groups.length) {
        select.appendChild(el("option", { text: "전시리스트DB에 등록된 전시가 없습니다" }));
        $("#ex-selected-name").textContent = "전시 정보";
        $("#ex-selected-meta").textContent = "";
        return;
      }
      groups.forEach(function (g) {
        select.appendChild(el("option", { value: g.name, text: g.name + " (" + g.count + "점)" }));
      });
      select.value = exState.currentName && groups.some(function (g) { return g.name === exState.currentName; }) ? exState.currentName : groups[0].name;
      renderExSelection();
    }).catch(function (e) { setStatus("#ex-status", false, e.message); });
  }
  $("#ex-pick").addEventListener("change", renderExSelection);
  $("#ex-poster-file").addEventListener("change", function () {
    var f = this.files[0];
    if (!f) return;
    exState.pendingFile = f;
    var reader = new FileReader();
    reader.onload = function () {
      var prev = $("#ex-poster-preview"); prev.innerHTML = "";
      prev.appendChild(el("img", { src: reader.result, alt: "", style: "width:100%;height:100%;object-fit:cover" }));
    };
    reader.readAsDataURL(f);
  });

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result).split(",")[1] || ""); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  $("#ex-meta-save").addEventListener("click", function () {
    var name = exSelected();
    if (!name) return;
    var intro = $("#ex-intro").value.trim();
    var btn = this; btn.disabled = true;
    var go = exState.pendingFile
      ? fileToBase64(exState.pendingFile).then(function (b64) {
          return apiPost("adminSaveExhibitionMeta", { name: name, intro: intro, posterBase64: b64, posterMime: exState.pendingFile.type || "image/jpeg" });
        })
      : apiPost("adminSaveExhibitionMeta", { name: name, intro: intro });
    go.then(function (j) {
      exState.metaByName[name] = { poster: j.posterUrl || (exState.metaByName[name] || {}).poster || "", intro: intro };
      setStatus("#ex-status", true, "저장되었습니다.");
    }).catch(function (e) { setStatus("#ex-status", false, e.message); })
      .then(function () { btn.disabled = false; });
  });

  $("#ex-set-current").addEventListener("click", function () {
    var name = exSelected();
    if (!name) return;
    apiPost("adminSetCurrentExhibition", { name: name }).then(function () {
      exState.currentName = name;
      renderExSelection();
      setStatus("#ex-status", true, "'" + name + "'을(를) 현재 전시로 지정했습니다.");
    }).catch(function (e) { setStatus("#ex-status", false, e.message); });
  });

  function loadAll() { loadGuestAdmin(); loadExhibit(); }
})();
