/* ===== (사)오늘은 아트 갤러리 설정 =====
   1) API_URL : Apps Script '웹 앱' 배포 주소(…/exec)를 붙여넣으세요.
      비워두면 assets/sample-data.js 의 미리보기용 데이터가 표시됩니다.
   2) 현재 전시 정보(이름/기간/장소/링크)와 지난 전시 아카이브는 더 이상 이 파일이 아니라
      구글시트('현재전시정보', '전시이력' 시트)에서 관리합니다 — admin.html 또는 시트에서 직접 수정하세요.
*/
window.ONEUL = {
  API_URL: "https://script.google.com/macros/s/AKfycbwZJUvArSMfwfPnwymCmONV64tZ_PRXT1mF8icdUcXrWLFbCp-zrWavpc6urqDQvfJdPA/exec",
  ORG_NAME: "(사)오늘은",
  NAV: [
    { key: "home", href: "index.html", label: "홈" },
    { key: "now", href: "now.html", label: "전시" },
    { key: "collection", href: "collection.html", label: "작품" },
    { key: "program", href: "program.html", label: "프로젝트 소개" },
    { key: "news", href: "news.html", label: "소식" },
    { key: "guestbook", href: "guestbook.html", label: "방명록" }
  ],
  // 상단 메뉴에는 넣지 않고 푸터에만 작게 노출하는 링크
  FOOT_EXTRA: [
    { href: "admin.html", label: "관리자" }
  ]
};
