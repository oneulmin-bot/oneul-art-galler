/* ===== 공통 DOM/유틸 헬퍼 (전역 window.OneulCore) ===== */
(function () {
  "use strict";

  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function driveId(url) {
    if (!url) return "";
    var m = String(url).match(/\/d\/([\w-]+)/) || String(url).match(/[?&]id=([\w-]+)/);
    return m ? m[1] : "";
  }
  function thumb(url, w) {
    if (!url) return "";
    var id = driveId(url);
    return id ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w" + (w || 800) : url;
  }

  function toast(msg) {
    var t = $("#toast");
    if (!t) { t = el("div", { id: "toast", class: "toast", role: "status" }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function safeSessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function safeSessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function safeSessionRemove(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  function reveal() {
    var els = $all(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }

  window.OneulCore = { $: $, $all: $all, el: el, driveId: driveId, thumb: thumb, toast: toast,
    safeGet: safeGet, safeSet: safeSet, safeSessionGet: safeSessionGet, safeSessionSet: safeSessionSet, safeSessionRemove: safeSessionRemove,
    reveal: reveal };
})();
