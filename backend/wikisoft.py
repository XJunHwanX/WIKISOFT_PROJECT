import pandas as pd

def validate_retirement_list(file_path):
    # 1. 엑셀 파일 로드
    df = pd.read_excel(file_path)
    errors = []

    for index, row in df.iterrows():
        row_num = index + 2  # 실제 엑셀 행 번호
        
        # --- 규칙 1: 종업원 구분 및 필수 입력 체크 ---
        emp_type = row['종업원 구분'] # 1:직원, 3:임원, 4:계약직
        
        # 임원(3) 또는 계약직(4)인 경우 추계액 필수 입력 체크
        if emp_type in [3, 4]:
            if pd.isna(row['당년도 퇴직금추계액']) or pd.isna(row['차년도 퇴직금추계액']):
                errors.append(f"{row_num}행: [임원/계약직] 당년도 및 차년도 퇴직금추계액을 반드시 입력해야 합니다.")
            
            # 임원(3)인 경우 적용배수 필수 체크
            if emp_type == 3 and pd.isna(row['적용배수']):
                errors.append(f"{row_num}행: [임원] 적용배수(예: 1.5, 2 등)를 입력해야 합니다.")

        # --- 규칙 2: 날짜 논리 체크 ---
        hire_date = pd.to_datetime(row['입사일자'], errors='coerce')
        mid_date = pd.to_datetime(row['중간정산기준일'], errors='coerce')

        if pd.isna(hire_date):
            errors.append(f"{row_num}행: 입사일자 형식이 잘못되었거나 누락되었습니다.")
        
        # 중간정산일이 입사일보다 빠를 수 없음
        if not pd.isna(mid_date) and not pd.isna(hire_date):
            if mid_date < hire_date:
                errors.append(f"{row_num}행: 중간정산일이 입사일자보다 빠를 수 없습니다.")

        # --- 규칙 3: 중간정산액 체크 ---
        # 중간정산기준일이 있는데 금액이 없거나 그 반대인 경우
        if not pd.isna(mid_date) and pd.isna(row['중간정산액']):
             errors.append(f"{row_num}행: 중간정산기준일이 있으나 중간정산액이 누락되었습니다.")

        # --- 규칙 4: 값 범위 체크 ---
        if row['성별'] not in [1, 2]:
            errors.append(f"{row_num}행: 성별은 1(남자) 또는 2(여자)로 입력해야 합니다.")
            
        if row['종업원 구분'] not in [1, 3, 4]:
            errors.append(f"{row_num}행: 종업원 구분 값이 올바르지 않습니다 (1, 3, 4 중 입력).")

    return errors

# 실행 예시
# result = validate_retirement_list("기업명부_샘플.xlsx")
# for err in result:
#     print(err)