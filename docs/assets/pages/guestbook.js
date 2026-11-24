/* ===== 방명록 페이지 ===== */
(function () {
  "use strict";
  var C = window.OneulCore, D = window.OneulData;
  var $ = C.$, el = C.el, toast = C.toast;
  var CFG = window.ONEUL || {};

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

  var list = $("#gb-list"), form = $("#gb-form"), msg = $("#gb-msg"), cntEl = $("#gb-count"), sub = $("#gb-submit");

  function refresh() {
    D.loadGuests(100).then(function (g) {
      renderMsgs(list, g.items);
      if (g.sample) { var n = $("#gb-notice"); n.textContent = "미리보기 상태입니다. Apps Script 주소를 연결하면 실제 방명록이 저장됩니다."; n.style.display = "block"; }
    });
  }

  msg.addEventListener("input", function () { cntEl.textContent = msg.value.length + " / 300"; });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.website.value) return; // honeypot
    var name = form.gname.value.trim().slice(0, 20), text = msg.value.trim();
    if (text.length < 2) { toast("방명록 내용을 2자 이상 입력해주세요."); return; }
    if (!CFG.API_URL) { toast("아직 Apps Script가 연결되지 않아 저장할 수 없어요."); return; }
    var last = Number(C.safeGet("oneul_gb_last") || 0);
    if (Date.now() - last < 30000) { toast("잠시 후 다시 남겨주세요."); return; }
    sub.disabled = true; sub.textContent = "남기는 중…";
    fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "guestbook", name: name, message: text.slice(0, 300) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || "fail");
        C.safeSet("oneul_gb_last", String(Date.now()));
        form.reset(); cntEl.textContent = "0 / 300"; toast("방명록이 등록되었어요. 감사합니다 💙"); refresh();
      })
      .catch(function () { toast("등록에 실패했어요. 잠시 후 다시 시도해주세요."); })
      .then(function () { sub.disabled = false; sub.textContent = "방명록 남기기"; });
  });

  refresh();
})();
