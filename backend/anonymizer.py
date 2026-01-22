import pandas as pd
import re
from typing import Tuple, Dict, Any, Optional

def _norm(s: str) -> str:
    """컬럼명 비교를 위해 공백/개행/특수문자 일부를 정리"""
    s = str(s)
    s = s.replace("\n", " ").strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _find_column(df: pd.DataFrame, patterns) -> Optional[str]:
    """
    patterns: 문자열 리스트 또는 정규식 패턴 리스트
    - 컬럼명을 normalize한 뒤 부분일치/정규식으로 찾음
    """
    cols = list(df.columns)
    norm_map = {c: _norm(c) for c in cols}

    for p in patterns:
        # 정규식 패턴
        if hasattr(p, "search"):
            for c in cols:
                if p.search(norm_map[c]):
                    return c
        else:
            key = str(p)
            for c in cols:
                if key in norm_map[c]:
                    return c
    return None

def anonymize(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    - 사번/사원번호/직원번호 등 ID 컬럼을 찾아 EMP_#로 치환
    - 성명/이름 컬럼이 있으면 Anonymous로 치환
    - 생년월일 컬럼이 있으면 출생년도(year)만 남김 + 컬럼명 '출생년도'로 변경
    - 어떤 컬럼이 없더라도 절대 예외를 내지 않음(서버 500 방지)
    """
    anonymized_df = df.copy()
    mapping_table: Dict[str, Any] = {}

    # 1) ID 컬럼 후보 (부분일치 기반)
    # '사원번호'가 없을 수도 있으니 사번/직원번호/인사번호/사원 ID 등 폭넓게
    id_col = _find_column(
        df,
        patterns=[
            "사원번호", "사번", "직원번호", "인사번호", "사원ID", "사원 ID", "employee id", "emp id", "emp_no", "empno"
        ],
    )

    # 2) 이름 컬럼 후보
    name_col = _find_column(
        df,
        patterns=[
            "성명", "이름", "사원명", "직원명", "성 명", "name"
        ],
    )

    # 3) 출생/생년월일 컬럼 후보
    birth_col = _find_column(
        df,
        patterns=[
            "생년월일", "생년", "출생", "birth", "dob"
        ],
    )

    # ---- 방어: ID 컬럼이 없으면 비식별화를 스킵하고 그대로 반환 ----
    # (이게 지금 너 500을 해결하는 핵심)
    if id_col is None:
        # 그래도 birth_col 정도는 처리할지 선택할 수 있는데,
        # 지금은 안전하게 "아무것도 안 하고" 반환해도 됨.
        # 다만 로그/디버깅용으로 mapping_table에 정보 남겨두자.
        mapping_table["_warning"] = "ID 컬럼(사원번호/사번 등)을 찾지 못해 비식별화를 건너뜁니다."
        mapping_table["_columns"] = [_norm(c) for c in df.columns]
        # birth_col은 존재하면 최소한의 보안 처리만 수행
        if birth_col is not None:
            anonymized_df[birth_col] = pd.to_datetime(anonymized_df[birth_col], errors="coerce").dt.year
            anonymized_df.rename(columns={birth_col: "출생년도"}, inplace=True)
        return anonymized_df, mapping_table

    # ---- 타입 변경(문자 치환 대비) ----
    anonymized_df[id_col] = anonymized_df[id_col].astype(object)
    if name_col is not None:
        anonymized_df[name_col] = anonymized_df[name_col].astype(object)

    # ---- 행별 치환 ----
    # index가 중간에 비어 있어도 안정적으로 연속 번호 부여
    for i, (idx, row) in enumerate(df.iterrows(), start=1):
        v_id = f"EMP_{i}"

        # real_name은 name_col이 없으면 N/A
        mapping_table[v_id] = {
            "real_id": row.get(id_col, None),
            "real_name": row.get(name_col, "N/A") if name_col is not None else "N/A",
        }

        anonymized_df.at[idx, id_col] = v_id
        if name_col is not None:
            anonymized_df.at[idx, name_col] = "Anonymous"

    # ---- 출생년도 처리 ----
    if birth_col is not None:
        anonymized_df[birth_col] = pd.to_datetime(anonymized_df[birth_col], errors="coerce").dt.year
        anonymized_df.rename(columns={birth_col: "출생년도"}, inplace=True)

    return anonymized_df, mapping_table
