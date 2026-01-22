import pandas as pd
from datetime import datetime

def parse_excel_date(v):
    """
    엑셀/판다스에서 들어오는 날짜 형태를 폭넓게 파싱:
    - datetime / Timestamp
    - 'YYYY/MM/DD', 'YYYY-MM-DD', 'YYYY.MM.DD'
    - 'YYYYMMDD'
    - '2003-08-01 00:00:00' 같은 문자열
    """
    if pd.isna(v):
        return pd.NaT

    # 이미 Timestamp면 그대로
    if isinstance(v, pd.Timestamp):
        return v

    s = str(v).strip()
    if not s:
        return pd.NaT

    # 시간 붙은 경우 앞부분만
    s = s.split(" ")[0].strip()

    # YYYYMMDD (숫자 8자리)
    if s.isdigit() and len(s) == 8:
        return pd.to_datetime(s, format="%Y%m%d", errors="coerce")

    # 나머지는 자동 파싱
    return pd.to_datetime(s, errors="coerce")


def check_rules(df, config):
    """
    config: {
        'retire_age': 정년,
        'emp_count': 입력 사원 수,
        'base_date': 검증 기준일 (기본값은 오늘)
    }
    반환값: [{"row": 행번호, "column": 컬럼명, "id": 실제사번, "msg": 에러메시지}]
    """
    errors = []

    # 기준일(미래 판정/정년 계산용) - 날짜만 비교하도록 normalize
    base_date = pd.to_datetime(config.get("base_date", datetime.now()), errors="coerce")
    if pd.isna(base_date):
        base_date = pd.Timestamp.now()
    base_date = pd.Timestamp(base_date).normalize()

    # 1) 데이터 클리닝
    df = df.dropna(how="all").reset_index(drop=True)
    actual_count = len(df)

    # [인원 대조]
    if actual_count != int(config.get("emp_count", actual_count)):
        errors.append({
            "row": 1,
            "column": "전체인원",
            "id": "SYSTEM",
            "msg": f"[인원불일치] 입력 {config.get('emp_count')}명 / 실제 {actual_count}명"
        })

    # [컬럼 매핑 함수] 정확히 일치 -> 포함 순으로 찾기
    def get_col(keywords):
        for key in keywords:
            # 1순위: 공백 제거 후 정확히 일치
            found = [c for c in df.columns if str(c).strip() == key]
            if not found:
                # 2순위: 포함
                found = [c for c in df.columns if key in str(c)]
            if found:
                return found[0]
        return None

    c_map = {
        "id": get_col(["사원번호", "사번", "ID"]),
        "birth": get_col(["생년월일", "출생년월일", "생일", "출생년도"]),  # 출생년도도 혹시 대비
        "hire": get_col(["입사일자", "입사일", "채용일"]),
        "pay": get_col(["기준급여", "기본급"]),
        "est_this": get_col(["당년도 퇴직금추계액", "당년추계액", "당년도퇴직금추계액"]),
        "est_next": get_col(["차년도 퇴직금추계액", "차년추계액", "차년도퇴직금추계액"]),
        "mid_date": get_col(["중간정산기준일", "중간정산일"]),
        "mid_pay": get_col(["중간정산액", "중간정산금"]),
    }

    # 필수 컬럼 확인
    if not c_map["id"] or not c_map["hire"] or not c_map["birth"]:
        errors.append({
            "row": 1,
            "column": "매핑",
            "id": "ERROR",
            "msg": "필수 컬럼(사원번호, 생년월일, 입사일자)을 찾을 수 없습니다."
        })
        return errors

    # 2) 전역 검증: 사원번호 중복 체크
    dup_ids = df[df.duplicated(subset=[c_map["id"]], keep=False)]
    for idx, row in dup_ids.iterrows():
        raw = row[c_map["id"]]
        v_id = str(raw).split(".")[0].strip() if pd.notna(raw) else "누락"
        errors.append({
            "row": idx + 2,  # 엑셀 헤더가 1행이라 가정(너 로딩 방식 기준)
            "column": c_map["id"],
            "id": v_id,
            "msg": f"[중복오류] 사원번호({v_id})가 명부 내에 중복되어 존재합니다."
        })

    # 3) 행별 상세 검증
    for index, row in df.iterrows():
        row_num = index + 2  # 헤더 1행 기준

        # 사원번호 정제
        raw_id = row[c_map["id"]]
        if pd.isna(raw_id):
            v_id = f"ROW_{row_num}"
        else:
            v_id = str(raw_id).split(".")[0].strip()

        # 날짜 파싱
        birth_dt = parse_excel_date(row[c_map["birth"]])
        hire_dt = parse_excel_date(row[c_map["hire"]])

        # 날짜 형식 오류
        if pd.notna(row[c_map["birth"]]) and pd.isna(birth_dt):
            errors.append({
                "row": row_num, "column": c_map["birth"], "id": v_id,
                "msg": f"[형식오류] 생년월일을 날짜로 해석할 수 없습니다: {row[c_map['birth']]}"
            })
        if pd.notna(row[c_map["hire"]]) and pd.isna(hire_dt):
            errors.append({
                "row": row_num, "column": c_map["hire"], "id": v_id,
                "msg": f"[형식오류] 입사일자를 날짜로 해석할 수 없습니다: {row[c_map['hire']]}"
            })

        # 금액 음수 체크
        for key, label in [("est_this", "당년 추계액"), ("est_next", "차년 추계액"), ("mid_pay", "중간정산액")]:
            col_name = c_map.get(key)
            if col_name and col_name in df.columns and pd.notna(row.get(col_name)):
                try:
                    val = float(str(row[col_name]).replace(",", ""))
                    if val < 0:
                        errors.append({
                            "row": row_num, "column": col_name, "id": v_id,
                            "msg": f"[{label}오류] 음수값은 입력할 수 없습니다."
                        })
                except:
                    pass

        # 기준급여 하한선
        if c_map["pay"] and c_map["pay"] in df.columns and pd.notna(row.get(c_map["pay"])):
            try:
                pay = float(str(row[c_map["pay"]]).replace(",", ""))
                if pay < 1900000:
                    errors.append({
                        "row": row_num, "column": c_map["pay"], "id": v_id,
                        "msg": "[급여의심] 기준급여가 최저 기준(1.9백만) 미만입니다."
                    })
            except:
                pass

        # 필수값 누락
        for key, label in [("id", "사원번호"), ("birth", "생년월일"), ("hire", "입사일자"), ("pay", "기준급여")]:
            col = c_map.get(key)
            if col and col in df.columns and pd.isna(row.get(col)):
                errors.append({
                    "row": row_num, "column": col, "id": v_id,
                    "msg": f"[필수누락] {label} 항목이 비어있습니다."
                })

        # 날짜 논리/연령 규칙
        if pd.notna(birth_dt) and pd.notna(hire_dt):
            birth_dt = pd.Timestamp(birth_dt).normalize()
            hire_dt = pd.Timestamp(hire_dt).normalize()

            # 입사일 <= 생년월일
            if hire_dt <= birth_dt:
                errors.append({
                    "row": row_num, "column": c_map["hire"], "id": v_id,
                    "msg": "[날짜모순] 입사일이 생년월일보다 빠르거나 같을 수 없습니다."
                })

            # 입사 당시 만 나이
            age_at_hire = hire_dt.year - birth_dt.year - ((hire_dt.month, hire_dt.day) < (birth_dt.month, birth_dt.day))
            if age_at_hire < 17 or age_at_hire > 70:
                errors.append({
                    "row": row_num, "column": c_map["hire"], "id": v_id,
                    "msg": f"[연령의심] 입사 당시 만 연령({age_at_hire}세)이 비정상적입니다."
                })

            # 기준일 기준 정년 초과
            retire_age = int(config.get("retire_age", 60))
            current_age = base_date.year - birth_dt.year - ((base_date.month, base_date.day) < (birth_dt.month, birth_dt.day))
            if current_age > retire_age:
                errors.append({
                    "row": row_num, "column": c_map["birth"], "id": v_id,
                    "msg": f"[정년초과] 기준일({base_date.date()}) 기준 만 {current_age}세로 설정 정년({retire_age}세) 초과"
                })

            # 미래 날짜(입사일)
            if hire_dt > base_date:
                errors.append({
                    "row": row_num, "column": c_map["hire"], "id": v_id,
                    "msg": f"[날짜오류] 미래 입사일자({hire_dt.strftime('%Y-%m-%d')})가 입력되었습니다. 기준일={base_date.strftime('%Y-%m-%d')}"
                })

        # 중간정산일 논리
        if c_map["mid_date"] and c_map["mid_date"] in df.columns and pd.notna(row.get(c_map["mid_date"])) and pd.notna(hire_dt):
            mid_dt = parse_excel_date(row[c_map["mid_date"]])
            if pd.notna(mid_dt) and pd.notna(hire_dt):
                mid_dt = pd.Timestamp(mid_dt).normalize()
                hire_dt2 = pd.Timestamp(hire_dt).normalize()
                if mid_dt <= hire_dt2:
                    errors.append({
                        "row": row_num, "column": c_map["mid_date"], "id": v_id,
                        "msg": "[날짜모순] 중간정산일이 입사일보다 빠르거나 같습니다."
                    })
                # 중간정산일도 미래면 의심
                if mid_dt > base_date:
                    errors.append({
                        "row": row_num, "column": c_map["mid_date"], "id": v_id,
                        "msg": f"[날짜오류] 미래 중간정산일({mid_dt.strftime('%Y-%m-%d')})이 입력되었습니다. 기준일={base_date.strftime('%Y-%m-%d')}"
                    })

    return errors
