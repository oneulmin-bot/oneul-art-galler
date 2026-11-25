/**
 * (사)오늘은 아트 갤러리 — Google Apps Script 백엔드
 *
 * 공개 GET 액션 (비밀번호 불필요)
 *  - action=artworks          : '작품리스트' 시트의 작품 목록(공개 가능한 열만) JSON 반환
 *  - action=guestbook         : '방명록' 시트의 공개 글 JSON 반환 (최신순, 숨김 제외)
 *  - action=exhibitionInfo    : 현재 전시로 지정된 전시의 이름/기간/장소/포스터/서문/참여 작품 목록 JSON 반환
 *  - action=exhibitionArchive : '전시리스트DB' 기준 지난 전시 목록(현재 전시 제외) JSON 반환
 *  - action=exhibitionGroups  : '전시리스트DB' 기준 전체 전시 목록(현재 포함, 이름/기간/장소/작품수만) — 관리자 페이지 드롭다운용
 *
 * 공개 POST 액션 (비밀번호 불필요)
 *  - {action:"guestbook", name, message} : '방명록' 시트에 한 줄 추가
 *
 * 관리자 GET/POST 액션 (모두 pass 필드를 ADMIN_PASS 스크립트 속성과 비교, 불일치 시 거부)
 *  - GET  action=adminPing                             : 비밀번호 확인용
 *  - GET  action=adminGuestbook                        : 숨김 포함 방명록 전체 목록(관리자 전용)
 *  - POST adminHideGuest        {row, hide}             : 방명록 숨김/숨김해제
 *  - POST adminDeleteGuest      {row}                   : 방명록 행 삭제
 *  - POST adminSetCurrentExhibition {name}              : '현재전시' 포인터 저장
 *  - POST adminSaveExhibitionMeta   {name, intro, posterBase64?, posterMime?} : 전시 포스터/서문 저장(업서트)
 *
 * 개인정보 보호: 작가 연락처, 대화청년 이름/연락처 열은 절대 반환하지 않습니다.
 *
 * 설치 방법 (기존 '미술작품갤러리' 프로젝트와 함수 이름이 겹치므로 반드시 '새 프로젝트'에서)
 *  1) script.google.com > 새 프로젝트 만들기 → 이 코드 전체를 붙여넣기 (기본 myFunction 은 삭제)
 *  2) 프로젝트 설정(톱니바퀴) > 스크립트 속성 > ADMIN_PASS 키로 관리자 비밀번호 설정
 *     (설정하지 않으면 관리자 기능은 전부 거부됩니다)
 *  3) 배포 > 새 배포 > 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → 권한 승인 후 /exec 주소 복사
 *     (전시 포스터 업로드 기능 때문에 구글 드라이브 접근 권한도 함께 승인하라는 팝업이 뜰 수 있습니다 — 승인해주세요)
 *  4) docs/assets/config.js 의 API_URL 에 붙여넣기
 *  코드를 수정한 뒤에는 '배포 관리 > 새 버전'으로 다시 배포해야 반영됩니다.
 *  '전시설정', '현재전시' 시트는 처음 쓸 때 자동으로 만들어집니다.
 */

var SHEET_ID = '1KOsZF002BuDbeHEU1c-M8fqVI5uPnZJSnm7gmVDXsik'; // 작품 리스트 스프레드시트 ID
var ARTWORK_SHEET = '작품리스트';
var GUEST_SHEET = '방명록';
var GUEST_HEADERS = ['작성일시', '이름', '내용', '숨김(Y)'];
var EXLIST_SHEET = '전시리스트DB';   // 기존 운영 시트, 읽기 전용(전시명↔작품번호 연결 기록)
var EXMETA_SHEET = '전시설정';       // 신규: 전시 1개당 1행, 포스터/서문
var EXMETA_HEADERS = ['전시명', '포스터URL', '서문'];
var CURRENT_SHEET = '현재전시';      // 신규: 전시명 1개 값만 보관
var CURRENT_HEADERS = ['전시명'];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'artworks';
  try {
    if (action === 'artworks') return json_({ ok: true, items: getArtworks_() });
    if (action === 'guestbook') return json_({ ok: true, items: getGuests_() });
    if (action === 'exhibitionInfo') return json_({ ok: true, item: getExhibitionInfo_() });
    if (action === 'exhibitionArchive') return json_({ ok: true, items: getExhibitionArchive_() });
    if (action === 'exhibitionGroups') return json_({ ok: true, items: getExhibitionGroups_().map(function (g) { return { name: g.name, period: g.period, place: g.place, count: g.artworkIds.length }; }) });
    if (action === 'adminPing') {
      if (!checkPass_(e.parameter.pass)) return json_({ ok: false, error: 'bad pass' });
      return json_({ ok: true });
    }
    if (action === 'adminGuestbook') {
      if (!checkPass_(e.parameter.pass)) return json_({ ok: false, error: 'bad pass' });
      return json_({ ok: true, items: getGuestsAdmin_() });
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e.postData && e.postData.contents) || '{}');
    var action = body.action;

    if (action === 'guestbook') {
      var name = clean_(body.name, 20) || '익명';
      var message = clean_(body.message, 300);
      if (message.length < 2) return json_({ ok: false, error: 'message too short' });
      lock.waitLock(10000);
      var sh = guestSheet_();
      var last = sh.getLastRow();
      if (last > 1 && String(sh.getRange(last, 3).getValue()) === message) return json_({ ok: true, duplicate: true });
      sh.appendRow([new Date(), name, message, '']);
      return json_({ ok: true });
    }

    // ---- 아래부터는 관리자 전용 액션: 비밀번호 검증 필수 ----
    if (!checkPass_(body.pass)) return json_({ ok: false, error: '비밀번호가 올바르지 않습니다.' });

    lock.waitLock(10000);

    if (action === 'adminHideGuest') {
      var gsh = guestSheet_();
      gsh.getRange(Number(body.row), 4).setValue(body.hide ? 'Y' : '');
      return json_({ ok: true });
    }
    if (action === 'adminDeleteGuest') {
      guestSheet_().deleteRow(Number(body.row));
      return json_({ ok: true });
    }
    if (action === 'adminSetCurrentExhibition') {
      setCurrentExhibitionName_(clean_(body.name, 120));
      return json_({ ok: true });
    }
    if (action === 'adminSaveExhibitionMeta') {
      var name2 = clean_(body.name, 120);
      if (!name2) return json_({ ok: false, error: '전시명이 필요합니다.' });
      var posterUrl = null;
      if (body.posterBase64) {
        posterUrl = uploadPosterImage_(body.posterBase64, body.posterMime || 'image/jpeg');
      }
      saveExhibitionMeta_(name2, clean_(body.intro, 4000), posterUrl);
      return json_({ ok: true, posterUrl: posterUrl || undefined });
    }

    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- 관리자 인증 ---------- */
function checkPass_(pass) {
  var want = PropertiesService.getScriptProperties().getProperty('ADMIN_PASS');
  if (!want) return false; // 비밀번호가 설정되지 않았으면 관리자 기능 전체 비활성화
  return String(pass || '') === String(want);
}

/* ---------- 작품 ---------- */
function artworkHeaderCols_(heads) {
  function col(key) {
    for (var c = 0; c < heads.length; c++) if (norm_(heads[c]).indexOf(key) === 0) return c;
    return -1;
  }
  return {
    id: col('작품번호'), year: col('제작년도'), project: col('선정프로젝트'), artist: col('작가명'),
    title: col('작품명'), size: col('작품크기'), medium: col('재료'), intro: col('작품소개'),
    bio: col('작가소개'), topic: col('대화청년(주제)'), image: col('작품이미지'), audio: col('음성해설')
  };
}
function getArtworks_() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ARTWORK_SHEET);
  if (!sh) throw new Error("'" + ARTWORK_SHEET + "' 시트를 찾을 수 없습니다.");
  var values = sh.getDataRange().getValues();

  var headerRow = -1;
  for (var i = 0; i < Math.min(values.length, 10); i++) {
    if (norm_(values[i][0]).indexOf('작품번호') === 0) { headerRow = i; break; }
  }
  if (headerRow < 0) throw new Error("'작품번호' 헤더를 찾을 수 없습니다.");
  var C = artworkHeaderCols_(values[headerRow]);
  // ※ 작가 연락처 / 대화청년(이름/연락처) 열은 의도적으로 읽지 않습니다.

  function get(row, k) { return C[k] < 0 ? '' : String(row[C[k]] == null ? '' : row[C[k]]).trim(); }

  var items = [];
  for (var r = headerRow + 1; r < values.length; r++) {
    var row = values[r];
    var id = get(row, 'id');
    var title = get(row, 'title');
    if (!id || !title) continue;
    items.push({
      id: id, year: get(row, 'year'), project: get(row, 'project'), artist: get(row, 'artist'),
      title: title, size: get(row, 'size'), medium: get(row, 'medium'), intro: get(row, 'intro'),
      bio: get(row, 'bio'), topic: get(row, 'topic'), image: get(row, 'image'), audio: get(row, 'audio')
    });
  }
  return items;
}

/* ---------- 전시 (전시리스트DB 기반) ---------- */
function exHeaderCols_(heads) {
  function col(key) {
    for (var c = 0; c < heads.length; c++) if (norm_(heads[c]).indexOf(key) === 0) return c;
    return -1;
  }
  return { name: col('전시명'), period: col('전시기간'), place: col('전시장소'), artId: col('작품번호') };
}
// 전시리스트DB 는 운영진이 이미 쓰고 있는 시트(수식이 걸린 자동열 포함) — 읽기 전용으로만 사용
function getExhibitionGroups_() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(EXLIST_SHEET);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var C = exHeaderCols_(values[0]);
  if (C.name < 0) return [];
  function get(row, c) { return c < 0 ? '' : String(row[c] == null ? '' : row[c]).trim(); }

  var order = [], map = {};
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var name = get(row, C.name);
    if (!name) continue;
    if (!map[name]) { map[name] = { name: name, period: get(row, C.period), place: get(row, C.place), artworkIds: [] }; order.push(name); }
    var aid = get(row, C.artId);
    if (aid) map[name].artworkIds.push(aid);
  }
  var out = order.map(function (n) { return map[n]; });
  out.reverse(); // 시트에 나중에 추가된(아래쪽) 전시가 최신이라고 가정 — 최신이 앞에 오도록
  return out;
}

function exMetaSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(EXMETA_SHEET);
  if (!sh) {
    sh = ss.insertSheet(EXMETA_SHEET);
    sh.appendRow(EXMETA_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, EXMETA_HEADERS.length).setFontWeight('bold');
  }
  return sh;
}
function getExhibitionMetaMap_() {
  var sh = exMetaSheet_();
  var values = sh.getDataRange().getValues();
  var map = {};
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var name = String(row[0] || '').trim();
    if (!name) continue;
    map[name] = { row: r + 1, poster: String(row[1] || ''), intro: String(row[2] || '') };
  }
  return map;
}
function saveExhibitionMeta_(name, intro, posterUrlOrNull) {
  var sh = exMetaSheet_();
  var map = getExhibitionMetaMap_();
  var existing = map[name];
  if (existing) {
    sh.getRange(existing.row, 3).setValue(intro);
    if (posterUrlOrNull) sh.getRange(existing.row, 2).setValue(posterUrlOrNull);
  } else {
    sh.appendRow([name, posterUrlOrNull || '', intro]);
  }
}

function currentSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(CURRENT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CURRENT_SHEET);
    sh.appendRow(CURRENT_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, CURRENT_HEADERS.length).setFontWeight('bold');
  }
  return sh;
}
function getCurrentExhibitionName_() {
  var sh = currentSheet_();
  if (sh.getLastRow() < 2) return '';
  return String(sh.getRange(2, 1).getValue() || '').trim();
}
function setCurrentExhibitionName_(name) {
  var sh = currentSheet_();
  if (sh.getLastRow() < 2) sh.appendRow([name]);
  else sh.getRange(2, 1).setValue(name);
}

function getExhibitionInfo_() {
  var name = getCurrentExhibitionName_();
  if (!name) return null;
  var groups = getExhibitionGroups_();
  var group = null;
  for (var i = 0; i < groups.length; i++) if (groups[i].name === name) { group = groups[i]; break; }
  if (!group) return null;
  var meta = getExhibitionMetaMap_()[name] || {};
  var allArt = getArtworks_();
  var byId = {};
  allArt.forEach(function (a) { byId[a.id] = a; });
  var items = group.artworkIds.map(function (id) { return byId[id]; }).filter(Boolean);
  return { name: name, period: group.period, place: group.place, poster: meta.poster || '', intro: meta.intro || '', items: items };
}

function getExhibitionArchive_() {
  var current = getCurrentExhibitionName_();
  var groups = getExhibitionGroups_().filter(function (g) { return g.name !== current; });
  var metaMap = getExhibitionMetaMap_();
  return groups.map(function (g) {
    var meta = metaMap[g.name] || {};
    return { name: g.name, period: g.period, place: g.place, count: g.artworkIds.length, poster: meta.poster || '', intro: meta.intro || '' };
  });
}

/* ---------- 전시 포스터 업로드 (구글 드라이브) ---------- */
function uploadPosterImage_(base64, mime) {
  var ext = (String(mime).split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, 'poster.' + ext);
  var file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/* ---------- 방명록 ---------- */
function guestSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(GUEST_SHEET);
  if (!sh) {
    sh = ss.insertSheet(GUEST_SHEET);
    sh.appendRow(GUEST_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, GUEST_HEADERS.length).setFontWeight('bold');
    sh.setColumnWidth(3, 480);
  }
  return sh;
}

function getGuests_() {
  var sh = guestSheet_();
  var values = sh.getDataRange().getValues();
  var out = [];
  for (var r = values.length - 1; r >= 1; r--) {          // 최신순
    var row = values[r];
    if (String(row[3]).toUpperCase() === 'Y') continue;   // '숨김(Y)' 표시된 글은 제외
    if (!row[2]) continue;
    out.push({
      name: String(row[1] || '익명'),
      message: String(row[2]),
      date: row[0] instanceof Date ? Utilities.formatDate(row[0], 'Asia/Seoul', 'yyyy-MM-dd') : String(row[0])
    });
    if (out.length >= 100) break;
  }
  return out;
}

function getGuestsAdmin_() {
  var sh = guestSheet_();
  var values = sh.getDataRange().getValues();
  var out = [];
  for (var r = values.length - 1; r >= 1; r--) { // 최신순, 숨김 포함 전체
    var row = values[r];
    if (!row[2]) continue;
    out.push({
      row: r + 1,
      name: String(row[1] || '익명'),
      message: String(row[2]),
      date: row[0] instanceof Date ? Utilities.formatDate(row[0], 'Asia/Seoul', 'yyyy-MM-dd') : String(row[0]),
      hidden: String(row[3]).toUpperCase() === 'Y'
    });
  }
  return out;
}

/* ---------- 유틸 ---------- */
function norm_(v) { return String(v == null ? '' : v).replace(/\s+/g, ''); }

function clean_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  // 스프레드시트 수식 주입 방지
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
