import os
import uuid
import shutil
import openpyxl
from openpyxl.styles import PatternFill
import pandas as pd


def save_validation_results(original_file: str, python_errors, ai_report: str, output_dir: str = "temp_uploads"):
    """
    - 결과 파일을 무조건 output_dir(기본: temp_uploads)에 저장
    - 파일명은 영문/숫자(uuid)로 생성해서 다운로드 URL 안정화
    - 원본이 xlsx면 서식 보존 복사 후 하이라이트
    - 원본이 xls면 데이터만 xlsx로 새로 생성
    """
    os.makedirs(output_dir, exist_ok=True)

    # ✅ 안전한 결과 파일명 (한글/공백 제거)
    result_name = f"validation_{uuid.uuid4().hex[:10]}.xlsx"
    output_path = os.path.join(output_dir, result_name)

    try:
        # 1) 원본 복사/생성
        if original_file.lower().endswith(".xlsx"):
            shutil.copy2(original_file, output_path)
            wb = openpyxl.load_workbook(output_path)
        else:
            # .xls: 서식 보존 불가 -> 데이터만 새로 xlsx 생성
            df = pd.read_excel(original_file, sheet_name=0)
            df.to_excel(output_path, index=False)
            wb = openpyxl.load_workbook(output_path)

        # 2) 시트 선택 (우선순위: (2-2) 재직자 명부 -> (2-1) 명부 -> active)
        if "(2-2) 재직자 명부" in wb.sheetnames:
            ws = wb["(2-2) 재직자 명부"]
        elif "(2-1) 명부" in wb.sheetnames:
            ws = wb["(2-1) 명부"]
        else:
            ws = wb.active

        # 3) 헤더 행 찾기 (위쪽에서 '사원번호'가 있는 행을 헤더로 간주)
        header_row = 1
        for r in range(1, min(50, ws.max_row) + 1):
            row_values = [str(ws.cell(row=r, column=c).value or "") for c in range(1, ws.max_column + 1)]
            if any("사원번호" in v for v in row_values):
                header_row = r
                break

        # 4) 컬럼명 -> 컬럼 인덱스 매핑
        col_map = {}
        for c in range(1, ws.max_column + 1):
            key = ws.cell(row=header_row, column=c).value
            if key is not None:
                col_map[str(key).strip()] = c

        # 5) 하이라이트
        error_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")

        for err in (python_errors or []):
            # err 예: {"row": 12, "column": "입사일자", "message": "..."}
            row_idx = err.get("row")
            col_name = err.get("column")

            if not row_idx or not col_name:
                continue

            # ✅ row_idx가 데이터 기준(DF row)으로 왔다면, 엑셀 행은 header_row 기준으로 보정 필요
            # - 너 rules.py가 어떤 기준인지 모르니 일단 "이미 엑셀 행 번호로 들어온다" 가정
            excel_row = int(row_idx)

            col_idx = col_map.get(str(col_name).strip())
            if col_idx:
                ws.cell(row=excel_row, column=col_idx).fill = error_fill

        # 6) AI 리포트 시트 추가 (간단 버전)
        if "AI_REPORT" in wb.sheetnames:
            del wb["AI_REPORT"]
        report_ws = wb.create_sheet("AI_REPORT")
        report_ws["A1"] = "AI 오류 분석 리포트"
        report_ws["A2"] = ai_report or "(리포트 없음)"

        wb.save(output_path)
        return output_path

    except Exception as e:
        print("❌ exporter error:", e)
        return None
