import os
import re
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _norm(s: str) -> str:
    s = "" if s is None else str(s)
    s = s.replace("\n", " ").strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _find_col_by_keywords(df: pd.DataFrame, keywords) -> str | None:
    """컬럼명에 키워드가 포함된 컬럼을 찾아 반환"""
    for col in df.columns:
        n = _norm(col)
        for k in keywords:
            if k in n:
                return col
    return None

def _to_number_series(s: pd.Series) -> pd.Series:
    """콤마 포함 숫자/문자 섞여 있어도 숫자로 강제 변환"""
    # 날짜/객체 섞여 있어도 문자열로 바꿔서 숫자만 추출 시도
    txt = s.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(txt, errors="coerce")

def _safe_mean(series: pd.Series) -> float:
    nums = _to_number_series(series)
    m = nums.mean()
    return 0.0 if pd.isna(m) else float(m)

def analyze_with_gpt(df: pd.DataFrame, python_errors, config: dict | None = None) -> str:
    """
    GPT-4o에게 퇴직급여채무 검증 로직을 기반으로 문맥 오류를 분석하게 함.
    - 날짜/문자 컬럼 평균내다 터지는 문제 방지
    - '기준급여' 컬럼을 이름 기반으로 찾음
    """
    try:
        config = config or {}
        current_date = datetime.now().date().isoformat()
        actual_count = len(df.dropna(how="all"))

        # ✅ 기준급여 컬럼을 이름으로 찾기 (없으면 급여/임금 후보로)
        salary_col = (
            _find_col_by_keywords(df, ["기준급여"])
            or _find_col_by_keywords(df, ["급여"])
            or _find_col_by_keywords(df, ["임금"])
        )

        salary_mean = 0.0
        if salary_col is not None:
            salary_mean = _safe_mean(df[salary_col])
        else:
            # 그래도 숫자 컬럼이 있다면 그 중 첫 번째 평균으로 대체(요약용)
            num_df = df.select_dtypes(include="number")
            if not num_df.empty:
                salary_mean = float(num_df.iloc[:, 0].mean())

        data_summary = {
            "columns": df.columns.tolist(),
            "total_rows": actual_count,
            "salary_column": salary_col if salary_col else "N/A",
            "salary_mean": salary_mean,
        }

        prompt = f"""
당신은 한국의 K-IFRS 퇴직급여채무 검증 전문가입니다.
사용자가 수동으로 체크하던 항목들을 AI인 당신이 대신 정밀 검사하세요.

[지침]
1. 사원을 지칭할 때는 반드시 데이터의 '사원번호'를 사용하세요. (예: 사원번호 1번)
2. 발견한 오류의 '실제 값'을 명시하세요. 기준 날짜({current_date})와 헷갈리지 마세요.
3. 파이썬이 찾은 규칙 에러({python_errors})를 바탕으로 회계 리스크를 설명하세요.
4. 오늘 날짜({current_date})와 사원의 실제 날짜 데이터를 헷갈리지 마세요.

[검증 환경 및 기준]
- 현재 날짜: {current_date} (이보다 미래인 입사일/중간정산일은 '오류'임)
- 사용자 입력 사원수: {config.get('emp_count', 'N/A')}명 (실제 데이터 {actual_count}명과 대조)
- 사용자 설정 정년: {config.get('retire_age', 'N/A')}세

[필수 검증 체크리스트]
1. 날짜 논리: 입사일 > 생년월일, 중간정산일 > 입사일 여부 확인
2. 미래 날짜: 모든 날짜 데이터가 {current_date} 이전인지 확인
3. 급여 변동: 동일 직종 내 기준급여 비상식적 높고 낮음 (+-20% 변동폭)
4. 인원 대조: 입력 인원과 실제 행 수 불일치 지적
5. 연령 논리: 입사 당시 연령 17세 미만 또는 70세 초과 의심
6. 특정 조건: 종업원구분(직종)이 2 초과인데 퇴직금추계액이 0인 경우 등

[분석 데이터 요약]
{data_summary}

[데이터 샘플 (상위 10개)]
{df.head(10).to_string()}

[파이썬 규칙 검증 결과]
{python_errors if python_errors else "기본 규칙 위반 없음"}

[결과 작성 양식]
- 오류 유형:
- 해당 사원:
- 내용:
- 개선 조언:
"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "귀하는 데이터의 미세한 논리 오류를 잡아내는 꼼꼼한 회계사입니다."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )
        return response.choices[0].message.content

    except Exception as e:
        # ✅ 여기서 어떤 문제든 서버가 죽지 않게 문자열로 반환
        return f"⚠️ AI 분석 중 오류 발생: {str(e)}"
