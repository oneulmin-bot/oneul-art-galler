/* ===== (사)오늘은 아트 갤러리 설정 =====
   1) API_URL : Apps Script '웹 앱' 배포 주소(…/exec)를 붙여넣으세요.
      비워두면 assets/sample-data.js 의 미리보기용 작품 5점이 표시됩니다.
   2) EXHIBITIONS : 시트 '전시중' 열에 적는 전시명을 키로, 기간/장소/안내 링크를 적어두면
      '현재 전시' 페이지에 함께 표시됩니다. (선택 사항)
*/
window.ONEUL = {
  API_URL: "https://script.google.com/macros/s/AKfycbzqbU5hCCARfmywrJq27xxCh23o4hRndZkrzKld2GPKe_tLAyKpS53BB1x_BpOTVgA6/exec",
  ORG_NAME: "(사)오늘은",
  EXHIBITIONS: {
    "혼자였던 적 없는 꿈 展": {
      period: "2026.9.2.(수) ~ 9.10.(목) 10:00~20:00",
      place: "알지비큐브 홍대 (서울시 마포구 와우산로29라길 26)",
      link: "https://oneultoday.notion.site/3cad68a7cf91806a8beece923c394ccb"
    }
  }
};
