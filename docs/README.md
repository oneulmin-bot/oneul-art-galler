# (사)오늘은 아트 갤러리 — 배포·운영 안내

## 구성
| 파일 | 설명 |
|---|---|
| `index.html` | 홈 (소개·현재 전시 미리보기·소장 작품·방명록) |
| `now.html` | 현재 전시 중인 작품만 모아보는 페이지 |
| `collection.html` | 전체 작품 (검색·프로젝트 필터·상세 팝업) |
| `guestbook.html` | 방명록 (작성 → 구글시트 '방명록' 시트에 저장) |
| `assets/config.js` | **Apps Script 주소(API_URL)** 와 전시 기간·장소 설정 |
| `../apps-script/Code.gs` | 시트 → JSON, 방명록 저장용 Apps Script 코드 |

## 1. Apps Script 연결
1. script.google.com 에서 **새 프로젝트**를 만들어 `apps-script/Code.gs` 전체를 붙여넣기 (기존 프로젝트와 함수 이름이 겹침)
2. `전체DB` 시트 맨 오른쪽(S열)에 **`전시중`** 열 추가 — 현재 전시 중인 작품 행에 전시명(예: `혼자였던 적 없는 꿈 展`) 입력, 아니면 비워두기
3. 배포 > 새 배포 > 웹 앱 (실행: 나 / 액세스: 모든 사용자) → `/exec` 주소 복사
4. `docs/assets/config.js` 의 `API_URL` 에 붙여넣고 커밋
   - 작가 연락처, 대화청년 이름/연락처 열은 코드에서 읽지 않으므로 외부에 노출되지 않습니다.
   - 코드 수정 후에는 '배포 관리 > 새 버전'으로 재배포해야 반영됩니다.

## 2. 작품 이미지
시트의 드라이브 이미지 파일은 **'링크가 있는 모든 사용자 – 뷰어'** 로 공유되어 있어야 페이지에 보입니다.

## 3. GitHub Pages 배포
1. 이 브랜치를 `main` 에 병합
2. 저장소 Settings > Pages > Source: `Deploy from a branch` / Branch: `main` / Folder: `/docs`
3. 주소: `https://<계정>.github.io/oneul-art-galler/`

## 4. 전시 바꾸기
- 새 전시가 시작되면 시트 `전시중` 열만 수정하면 `now.html` 이 자동으로 바뀝니다.
- 전시 기간·장소를 보여주려면 `config.js` 의 `EXHIBITIONS` 에 전시명을 키로 추가하세요.
- 방명록 글을 숨기려면 '방명록' 시트 D열에 `Y` 를 입력하세요.
