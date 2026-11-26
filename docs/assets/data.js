/* ===== 데이터 로더: artworks / guestbook / exhibitionInfo / exhibitionArchive ===== */
(function () {
  "use strict";
  var CFG = window.ONEUL || {};

  function api(action, extra) {
    if (!CFG.API_URL) return null;
    var sep = CFG.API_URL.indexOf("?") > -1 ? "&" : "?";
    return CFG.API_URL + sep + "action=" + action + (extra || "");
  }

  var cache = {};
  function cached(key, fn) {
    if (cache[key]) return cache[key];
    cache[key] = fn();
    return cache[key];
  }

  function loadArtworks() {
    return cached("artworks", function () {
      var useSample = function (why) { return { items: window.ONEUL_SAMPLE || [], sample: true, why: why }; };
      var url = api("artworks");
      if (!url) return Promise.resolve(useSample("API 미연결"));
      return fetch(url)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { items: j.items || [], sample: false }; })
        .catch(function () { return useSample("불러오기 실패"); });
    });
  }

  function loadGuests(limit) {
    var url = api("guestbook");
    if (!url) return Promise.resolve({ items: (window.ONEUL_SAMPLE_GUESTS || []).slice(0, limit || 100), sample: true });
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { return { items: (j.items || []).slice(0, limit || 100) }; })
      .catch(function () { return { items: [], error: true }; });
  }

  function loadExhibitionInfo() {
    return cached("exhibitionInfo", function () {
      var useSample = function () { return { item: (window.ONEUL_SAMPLE_EXHIBITION_INFO || null), sample: true }; };
      var url = api("exhibitionInfo");
      if (!url) return Promise.resolve(useSample());
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { item: j.item || null, sample: false }; })
        .catch(useSample);
    });
  }

  function loadExhibitionArchive() {
    return cached("exhibitionArchive", function () {
      var useSample = function () { return { items: (window.ONEUL_SAMPLE_ARCHIVE || []), sample: true }; };
      var url = api("exhibitionArchive");
      if (!url) return Promise.resolve(useSample());
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { items: j.items || [], sample: false }; })
        .catch(useSample);
    });
  }

  function loadExhibitionGroups() {
    var useSample = function () { return { items: (window.ONEUL_SAMPLE_GROUPS || []), sample: true }; };
    var url = api("exhibitionGroups");
    if (!url) return Promise.resolve(useSample());
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { items: j.items || [], sample: false }; })
      .catch(useSample);
  }

  function loadExhibitionList() {
    return cached("exhibitionList", function () {
      var useSample = function () { return { items: (window.ONEUL_SAMPLE_GROUPS || []), sample: true }; };
      var url = api("exhibitionList");
      if (!url) return Promise.resolve(useSample());
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { items: j.items || [], sample: false }; })
        .catch(useSample);
    });
  }

  function loadExhibitionDetail(name) {
    var useSample = function () {
      var all = (window.ONEUL_SAMPLE_GROUPS || []).concat(window.ONEUL_SAMPLE_EXHIBITION_INFO ? [window.ONEUL_SAMPLE_EXHIBITION_INFO] : []);
      var found = all.filter(function (g) { return g.name === name; })[0] || null;
      if (found && !found.items) found = Object.assign({}, found, { items: window.ONEUL_SAMPLE || [] });
      return { item: found, sample: true };
    };
    var url = api("exhibitionDetail", "&name=" + encodeURIComponent(name));
    if (!url) return Promise.resolve(useSample());
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { item: j.item || null, sample: false }; })
      .catch(useSample);
  }

  function loadNews() {
    return cached("news", function () {
      var useSample = function () { return { items: (window.ONEUL_SAMPLE_NEWS || []), sample: true }; };
      var url = api("news");
      if (!url) return Promise.resolve(useSample());
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error("bad"); return { items: j.items || [], sample: false }; })
        .catch(useSample);
    });
  }

  // exInfoItem(exhibitionInfo.item)의 items(현재 전시 작품들)를 기준으로, items 배열의 각 작품 객체에
  // _isCurrent / _exhibitName 을 표시해 카드/모달에서 "전시중" 뱃지를 보여줄 수 있게 한다.
  function markCurrent(items, exInfoItem) {
    if (!exInfoItem || !exInfoItem.items) return items;
    var ids = {};
    exInfoItem.items.forEach(function (a) { ids[a.id] = true; });
    items.forEach(function (a) {
      if (ids[a.id]) { a._isCurrent = true; a._exhibitName = exInfoItem.name; }
    });
    return items;
  }

  window.OneulData = {
    api: api,
    loadArtworks: loadArtworks,
    loadGuests: loadGuests,
    loadExhibitionInfo: loadExhibitionInfo,
    loadExhibitionArchive: loadExhibitionArchive,
    loadExhibitionGroups: loadExhibitionGroups,
    loadExhibitionList: loadExhibitionList,
    loadExhibitionDetail: loadExhibitionDetail,
    loadNews: loadNews,
    markCurrent: markCurrent
  };
})();
