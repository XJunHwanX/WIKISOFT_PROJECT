\# WIKISOFT – 퇴직급여채무 명부관리체계 AI 자동검증

엑셀(퇴직급여 명부)을 업로드하면  
1) 규칙 기반 검증(rules)으로 기본 오류를 잡고  
2) AI 분석 리포트(ai_report)를 생성하며  
3) 오류 표시가 반영된 결과 엑셀 파일을 다운로드할 수 있는 프로젝트입니다.


---
## 프로젝트 구성(예시)

- `main_api.py` : FastAPI 서버 엔트리포인트(프로젝트 루트)
- `backend/`
  - `rules.py` : 규칙 기반 검증 로직
  - `anonymizer.py` : 비식별화 로직
  - `ai_analyzer.py` : GPT 분석 리포트 생성
  - `exporter.py` : 결과 엑셀 생성(오류 하이라이트 등)
- `frontend/` : React(Vite) 프론트엔드 (옵션)



\## 주요 기능

\- 단계형 UI(정보 입력 → 엑셀 업로드 → AI 검증 → 결과 다운로드)

\- 엑셀 시트/헤더 자동 탐지 후 데이터 로딩

\- 비식별화(사원번호/성명 처리)

\- 규칙 기반 오류 검증 (날짜 논리, 중복, 필수값 누락, 급여 범위 등)

\- GPT 기반 오류 리포트 생성

\- 오류 셀 하이라이트 된 결과 엑셀 다운로드



---



\## 기술 스택

\*\*Frontend\*\*

\- React + TypeScript + Vite

\- shadcn/ui, TailwindCSS (UI)



\*\*Backend\*\*

\- FastAPI (Python)

\- pandas, openpyxl (엑셀 처리)

\- OpenAI API (GPT 분석)



---



\## 실행 방법



\### 1) 백엔드 실행

```bash

\# (권장) 가상환경 생성/활성화

python -m venv .venv

\# Windows PowerShell

.\\.venv\\Scripts\\Activate.ps1


pip install -r requirements.txt



\# 서버 실행

python -m uvicorn main\_api:app --reload --host 127.0.0.1 --port 8000



