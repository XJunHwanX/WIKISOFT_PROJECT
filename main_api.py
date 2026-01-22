# main_api.py (프로젝트 루트에 위치)
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os
import uuid
import traceback
import io
import shutil
import pandas as pd
import re
from typing import Union

# backend 폴더(패키지) 안의 모듈들
from backend.anonymizer import anonymize
from backend.rules import check_rules
from backend.ai_analyzer import analyze_with_gpt
from backend.exporter import save_validation_results

app = FastAPI(title="WIKISOFT AI API Server")

# =========================
# 0) 환경 설정
# =========================
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

DEBUG = True  # 필요 없으면 False로 바꿔도 됨

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# =========================
# 1) 엑셀 로딩 유틸
# =========================
def _clean_text(x) -> str:
    s = "" if pd.isna(x) else str(x)
    s = s.replace("\n", " ").strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _detect_engine(filename: str) -> str:
    lower = (filename or "").lower()
    # .xlsx -> openpyxl, .xls -> xlrd (xlrd 필요)
    return "openpyxl" if lower.endswith(".xlsx") else "xlrd"

def _pick_sheet(xls: pd.ExcelFile) -> Union[str, int]:
    # 1) 정확히 일치 우선
    for name in xls.sheet_names:
        if _clean_text(name) == "(2-2) 재직자 명부":
            return name

    # 2) 키워드 포함 시트 우선
    keywords = ["재직", "명부"]
    for name in xls.sheet_names:
        norm = _clean_text(name)
        if all(k in norm for k in keywords):
            return name

    # 3) 없으면 첫 시트
    return 0

def _find_header_row(raw: pd.DataFrame) -> int:
    """
    위쪽 60줄 안에서 컬럼명이 들어있는 행을 찾아 헤더로 지정
    필수 키워드: 사원번호 + (생년월일/입사일자 중 하나)
    """
    must_have = ["사원번호"]
    should_have = ["생년월일", "입사일", "입사일자"]

    max_scan = min(60, len(raw))
    for r in range(max_scan):
        row = raw.iloc[r].tolist()
        row_strs = [_clean_text(v) for v in row]

        if not any(m in cell for m in must_have for cell in row_strs):
            continue
        if not any(any(s in cell for cell in row_strs) for s in should_have):
            continue

        return r

    return 0

def load_excel(contents: bytes, filename: str) -> pd.DataFrame:
    engine = _detect_engine(filename)

    # 1) 시트 목록 확인
    try:
        xls = pd.ExcelFile(io.BytesIO(contents), engine=engine)
    except Exception as e:
        # xlrd 미설치/버전 문제 등
        raise Exception(f"엑셀 엔진 로드 실패({engine}). .xls라면 xlrd가 필요합니다. 상세: {e}")

    sheet = _pick_sheet(xls)

    # 2) header=None으로 원본 그대로 읽기
    raw = pd.read_excel(io.BytesIO(contents), sheet_name=sheet, header=None, engine=engine)

    # 3) 헤더 행 탐지
    header_row = _find_header_row(raw)

    header = raw.iloc[header_row].tolist()
    header = [_clean_text(h) for h in header]

    df = raw.iloc[header_row + 1 :].copy()
    df.columns = header

    # 완전 빈 행/열 제거
    df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")

    # 컬럼명 정리
    df.columns = [str(c).replace("\n", " ").strip() for c in df.columns]

    return df

def safe_basename(name: str) -> str:
    """경로 조작 방지용 파일명 정리"""
    name = os.path.basename(name)
    return name.replace("\\", "_").replace("/", "_")

# =========================
# 2) API: 분석
# =========================
@app.post("/analyze")
async def analyze_retirement_ledger(
    file: UploadFile = File(...),
    retire_age: int = Form(...),
    emp_count: int = Form(...),
):
    stage = "start"
    file_id = str(uuid.uuid4())[:8]
    original_name = safe_basename(file.filename or "uploaded.xlsx")
    temp_input_path = os.path.join(UPLOAD_DIR, f"{file_id}_{original_name}")

    try:
        stage = "read_file"
        contents = await file.read()

        if DEBUG:
            print("UPLOAD:", original_name, "size=", len(contents), "content_type=", file.content_type)

        if not contents:
            raise Exception("업로드된 파일이 비어 있습니다.")

        stage = "load_excel"
        df_raw = load_excel(contents, original_name)
        actual_rows = len(df_raw.dropna(how="all"))

        if DEBUG:
            print("ROWS:", actual_rows, "COLS:", df_raw.shape[1])
            print("COLUMNS:", df_raw.columns.tolist())
            print(df_raw.head(3).to_string())

        # ✅ 1) rules는 원본(df_raw)으로 돌린다 (중요)
        stage = "check_rules"
        config = {
            "retire_age": retire_age,
            "emp_count": emp_count,
            # rules에서 기준일로 사용(미래 날짜 판정 등)
            "base_date": pd.Timestamp.now().normalize().isoformat(),
        }
        p_errors = check_rules(df_raw, config)

        if DEBUG:
            print("PY_ERRORS:", len(p_errors))
            print("PY_ERRORS_SAMPLE:", p_errors[:5])

        # ✅ 2) AI에 넘길 때만 비식별화(df_anon)
        stage = "anonymize"
        df_anon, _ = anonymize(df_raw)

        stage = "ai_analyze"
        ai_report = analyze_with_gpt(df_anon, p_errors, config)

        # 업로드 원본 저장
        stage = "save_temp_input"
        with open(temp_input_path, "wb") as f:
            f.write(contents)

        # exporter는 원본 파일 경로를 받아 결과 파일을 만듦
        stage = "export_result"
        output_path = save_validation_results(temp_input_path, p_errors, ai_report)
        if not output_path:
            raise Exception("결과 엑셀 파일 생성 실패(exporter 오류)")

        # ✅ 다운로드가 temp_uploads에서만 되도록 결과 파일을 temp_uploads로 이동
        stage = "move_result"
        output_name = safe_basename(os.path.basename(output_path))
        final_output_path = os.path.join(UPLOAD_DIR, output_name)

        # exporter가 이미 temp_uploads 안에 만들었으면 그대로 사용
        if os.path.abspath(output_path) != os.path.abspath(final_output_path):
            try:
                shutil.move(output_path, final_output_path)
            except Exception:
                # move 실패 시 copy+remove
                shutil.copy(output_path, final_output_path)
                try:
                    os.remove(output_path)
                except:
                    pass

        stage = "return_success"
        return {
            "status": "success",
            "message": "분석이 완료되었습니다.",
            "data": {
                "ai_report": ai_report,
                "error_count": len(p_errors),
                "total_count": actual_rows,
                "download_url": f"http://127.0.0.1:8000/download/{output_name}",
                "download_file": output_name,
            },
        }

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "stage": stage, "message": str(e)},
        )

# =========================
# 3) API: 다운로드
# =========================
@app.get("/download/{file_name}")
async def download_result(file_name: str):
    safe_name = os.path.basename(file_name)
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"파일을 찾을 수 없습니다: {safe_name}")

    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=safe_name,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
