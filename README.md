\# WIKISOFT 퇴직급여채무 명부 AI 자동검증



퇴직급여채무 명부(Excel)를 업로드하면,  

파이썬 규칙 기반 검증 + GPT 기반 분석으로 오류/리스크를 검출하고  

검증 결과 엑셀 파일을 다운로드할 수 있는 웹 서비스입니다.



---



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



