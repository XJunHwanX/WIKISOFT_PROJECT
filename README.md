# WIKISOFT — 퇴직급여채무 명부관리체계 AI 자동검증

엑셀(퇴직급여 명부)을 업로드하면 **규칙 기반 검증 + AI 분석 리포트**로 오류를 찾고,  
**오류 표시가 반영된 결과 파일(.xlsx)**을 다운로드할 수 있는 웹 애플리케이션입니다.

> ✅ 권장: **.xlsx 업로드**  
> `.xls` 업로드 시 결과 파일이 `.xlsx`로 변환되며, 일부 서식이 원본과 다를 수 있습니다. 가능하면 `.xlsx`로 업로드해 주세요.

---

## 데모 흐름 (4단계)
1. **정보 입력**: 정년 나이, 사원 수(명부 인원) 입력  
2. **엑셀 첨부**: 엑셀 파일 업로드(시트/헤더 자동 탐지)  
3. **AI 검증**:  
   - 규칙 기반 검증으로 데이터 오류 검출  
   - AI가 오류 요약/개선 제안을 포함한 리포트 생성  
4. **결과 다운로드**:  
   - `.xlsx` : 원본 서식 유지 + 오류 셀 **빨간색 하이라이트** + 리포트 시트 추가  
   - `.xls` : 결과가 `.xlsx`로 생성(원본 `.xls` 서식 100% 유지 불가)

---

## 주요 기능
- **시트 자동 탐지**: `(2-2) 재직자 명부` 우선 탐지(없으면 키워드 기반 탐지)
- **헤더 자동 탐지**: 상단 여러 행 중 “사원번호/생년월일/입사일(입사일자)”이 있는 행을 헤더로 인식
- **규칙 기반 검증(`backend/rules.py`)**
  - 필수값 누락(사원번호/생년월일/입사일/기준급여 등)
  - 사원번호 중복
  - 날짜 논리 오류(입사일 < 생년월일, 미래 입사일, 중간정산일 vs 입사일 등)
  - 급여/금액 음수, 급여 하한선 등
- **비식별화(`backend/anonymizer.py`)**: AI 분석에 넘기기 전 개인정보 마스킹
- **AI 리포트(`backend/ai_analyzer.py`)**: 오류 유형 요약 + 개선 조언 제공
- **결과 파일 생성(`backend/exporter.py`)**
  - 오류 셀 하이라이트
  - `AI_REPORT`(또는 오류 리포트) 시트 생성

---

## 프로젝트 구조(예시)
```txt
WIKISOFT/
├─ main_api.py                # FastAPI 서버 엔트리포인트
├─ requirements.txt
├─ temp_uploads/              # 업로드/결과 파일 저장 폴더 (자동 생성)
├─ backend/
│  ├─ rules.py                # 규칙 기반 검증 로직
│  ├─ anonymizer.py           # 비식별화
│  ├─ ai_analyzer.py          # GPT 분석 리포트 생성
│  └─ exporter.py             # 결과 엑셀 생성(하이라이트/리포트)
└─ frontend/                  # React(Vite) 프론트엔드
   ├─ package.json
   └─ ...


## 실행 환경

Python 3.10+ 권장

Node.js 18+ 권장

1) 백엔드 실행 (FastAPI)
(1) 가상환경 생성/활성화

Windows PowerShell

python -m venv .venv
.\.venv\Scripts\Activate.ps1


macOS / Linux

python3 -m venv .venv
source .venv/bin/activate

(2) 의존성 설치
pip install -r requirements.txt


⚠️ .xls 지원을 위해 xlrd가 필요합니다.

(3) 서버 실행
python main_api.py


API 서버: http://127.0.0.1:8000

Swagger 문서: http://127.0.0.1:8000/docs


2) 프론트엔드 실행 (React + Vite)
cd frontend
npm install
npm run dev


프론트: http://localhost:5173
