/**
 * (사)오늘은 아트 갤러리 — Google Apps Script 백엔드
 *
 * 역할
 *  - GET  ?action=artworks  : '전체DB' 시트의 작품 목록(공개 가능한 열만) JSON 반환
 *  - GET  ?action=guestbook : '방명록' 시트의 공개 글 JSON 반환 (최신순)
 *  - POST {action:"guestbook", name, message} : '방명록' 시트에 한 줄 추가
 *
 * 개인정보 보호: 작가 연락처, 대화청년 이름/연락처 열은 절대 반환하지 않습니다.
 *
 * 설치 방법 (기존 '미술작품갤러리' 프로젝트와 함수 이름이 겹치므로 반드시 '새 프로젝트'에서)
 *  1) script.google.com > 새 프로젝트 만들기 → 이 코드 전체를 붙여넣기 (기본 myFunction 은 삭제)
 *  2) '전체DB' 시트 맨 오른쪽에 '전시중' 열 추가 (현재 전시 중인 작품 행에 전시명 입력, 아니면 비워두기)
 *  3) 배포 > 새 배포 > 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → 권한 승인 후 /exec 주소 복사
 *  4) docs/assets/config.js 의 API_URL 에 붙여넣기
 *  코드를 수정한 뒤에는 '배포 관리 > 새 버전'으로 다시 배포해야 반영됩니다.
 */

var SHEET_ID = '1KOsZF002BuDbeHEU1c-M8fqVI5uPnZJSnm7gmVDXsik'; // 작품 리스트 스프레드시트 ID
var ARTWORK_SHEET = '전체DB';
var GUEST_SHEET = '방명록';
var GUEST_HEADERS = ['작성일시', '이름', '내용', '숨김(Y)'];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'artworks';
  try {
    if (action === 'artworks') return json_({ ok: true, items: getArtworks_() });
    if (action === 'guestbook') return json_({ ok: true, items: getGuests_() });
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.action !== 'guestbook') return json_({ ok: false, error: 'unknown action' });

    var name = clean_(body.name, 20) || '익명';
    var message = clean_(body.message, 300);
    if (message.length < 2) return json_({ ok: false, error: 'message too short' });

    lock.waitLock(10000);
    var sh = guestSheet_();
    // 도배 방지: 직전 글과 동일한 내용이면 무시
    var last = sh.getLastRow();
    if (last > 1 && String(sh.getRange(last, 3).getValue()) === message) {
      return json_({ ok: true, duplicate: true });
    }
    sh.appendRow([new Date(), name, message, '']);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- 작품 ---------- */
function getArtworks_() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ARTWORK_SHEET);
  if (!sh) throw new Error("'" + ARTWORK_SHEET + "' 시트를 찾을 수 없습니다.");
  var values = sh.getDataRange().getValues();

  // 헤더 행 찾기 ('작품번호'가 있는 행). 줄바꿈/공백 제거 후 비교
  var headerRow = -1;
  for (var i = 0; i < Math.min(values.length, 10); i++) {
    if (norm_(values[i][0]).indexOf('작품번호') === 0) { headerRow = i; break; }
  }
  if (headerRow < 0) throw new Error("'작품번호' 헤더를 찾을 수 없습니다.");
  var heads = values[headerRow].map(norm_);

  function col(key) {
    for (var c = 0; c < heads.length; c++) if (heads[c].indexOf(key) === 0) return c;
    return -1;
  }
  var C = {
    id: col('작품번호'), year: col('제작년도'), project: col('선정프로젝트'), artist: col('작가명'),
    title: col('작품명'), size: col('작품크기'), medium: col('재료'), intro: col('작품소개'),
    bio: col('작가소개'), topic: col('대화청년(주제)'), image: col('작품이미지'),
    audio: col('음성해설'), exhibit: col('전시중')
  };
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
      bio: get(row, 'bio'), topic: get(row, 'topic'), image: get(row, 'image'),
      audio: get(row, 'audio'), exhibit: get(row, 'exhibit')
    });
  }
  return items;
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
