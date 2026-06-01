"""
정산 자동화 도구
B2G 소스 파일 + 개별 첨부 파일로 정산 엑셀을 자동 완성합니다.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import os
import shutil
import math
from datetime import datetime
from pathlib import Path

import openpyxl
from openpyxl.utils import column_index_from_string
import pandas as pd

# ──────────────────────────────────────────────────────────────
# 소스 시트 → 대상 시트 매핑 설정
# ──────────────────────────────────────────────────────────────
SRC_SHEET_CONFIG = {
    "통장016": {
        "src_sheet":      "입금내역",
        "header_row":     3,   # 1-based
        "data_start_row": 4,
        "date_cols":      ["거래일시"],
        "dest_start_row": 4,
        "dest_start_col": "D",
        "dest_header_row": 3,
    },
    "학교장터": {
        "src_sheet":      "학교장터(카드)",
        "header_row":     2,
        "data_start_row": 3,
        "date_cols":      ["승인일시"],
        "dest_start_row": 3,
        "dest_start_col": "D",
        "dest_header_row": 2,
    },
    "풀리(총판)": {
        "src_sheet":      "풀리(총판)",
        "header_row":     1,
        "data_start_row": 2,
        "date_cols":      ["매출월", "(수식 자동입력)\n입금일", "입금일"],
        "require_nonempty": ["총판코드", "코드"],   # 하나라도 있으면 OK, 모두 없으면 제외
        "dest_start_row": 4,
        "dest_start_col": "D",
        "dest_header_row": 3,
    },
    "b2g매출내역": {
        "src_sheet":      "매쓰+풀리B2G",
        "header_row":     1,
        "data_start_row": 2,
        "date_cols":      ["날짜"],
        "dest_start_row": 3,
        "dest_start_col": "D",
        "dest_header_row": 2,
    },
    "풀리b2b매출내역": {
        "src_sheet":      "풀리B2B",
        "header_row":     1,
        "data_start_row": 2,
        "date_cols":      ["날짜"],
        "dest_start_row": 3,
        "dest_start_col": "A",
        "dest_header_row": 2,
    },
}

# ──────────────────────────────────────────────────────────────
# 유틸
# ──────────────────────────────────────────────────────────────

def clean(v):
    """None/NaN → None, numpy 타입 → Python 기본형, 날짜 문자열 → datetime, 나머지는 그대로"""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    # numpy 타입 변환 (bool은 반드시 먼저 — np.bool_ 은 int 의 서브클래스)
    type_name = type(v).__name__
    if type_name == 'bool_':          # numpy bool
        return bool(v)
    if type_name in ('int8', 'int16', 'int32', 'int64',
                     'uint8', 'uint16', 'uint32', 'uint64'):
        return int(v)
    if type_name in ('float16', 'float32', 'float64'):
        f = float(v)
        return None if math.isnan(f) else f
    # 날짜처럼 보이는 문자열 → datetime (Excel 날짜 수식과 호환되도록)
    if isinstance(v, str):
        import re as _re2
        m = _re2.match(r'^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$', v.strip())
        if m:
            yr, mo, dy = int(m.group(1)), int(m.group(2)), int(m.group(3))
            hr = int(m.group(4)) if m.group(4) else 0
            mn = int(m.group(5)) if m.group(5) else 0
            sc = int(m.group(6)) if m.group(6) else 0
            return datetime(yr, mo, dy, hr, mn, sc)
    return v


def parse_ym(val):
    """값에서 (year, month) 추출. 실패 시 None."""
    if val is None:
        return None
    # pandas Timestamp / datetime
    if hasattr(val, "year") and hasattr(val, "month"):
        return (val.year, val.month)
    s = str(val).strip()
    # "2026-05-01", "2026/05/01 14:30", "2026.05.01"
    import re
    m = re.match(r"^(\d{4})[-./](\d{1,2})", s)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    # "2026년 5월", "2026년5월"
    m = re.match(r"^(\d{4})년\s*(\d{1,2})월", s)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    # "26년 5월" 형태
    m = re.match(r"^(\d{2})년\s*(\d{1,2})월", s)
    if m:
        return (2000 + int(m.group(1)), int(m.group(2)))
    return None


def is_total_row(row):
    if not row:
        return False
    first = str(row[0]).strip() if row[0] is not None else ""
    return "총합" in first or first in ("합계", "합 계")


def is_formula(cell):
    # ArrayFormula 객체도 수식 셀로 처리 (openpyxl이 ArrayFormula 타입 반환)
    if cell.value is None:
        return False
    if hasattr(cell.value, 'text'):   # ArrayFormula
        return True
    return str(cell.value).startswith("=")


# ──────────────────────────────────────────────────────────────
# 소스 파일 읽기
# ──────────────────────────────────────────────────────────────

def read_src_sheet(filepath, sheet_name, header_row, data_start_row):
    """
    B2G 소스 파일의 특정 시트를 읽어 (headers, [[값...]]) 반환.
    header_row: 1-based 헤더 행 번호
    data_start_row: 1-based 데이터 시작 행
    """
    # header_row 이전 행들을 skiprows 로 건너뛰고, header=0 으로 읽음
    skip_before = list(range(header_row - 1))  # 0-indexed 행 번호
    df = pd.read_excel(
        filepath,
        sheet_name=sheet_name,
        header=0,
        skiprows=skip_before,
        engine="openpyxl",
    )
    # 헤더와 데이터 시작 사이에 빈/구분 행이 있으면 제거
    gap = data_start_row - header_row - 1
    if gap > 0:
        df = df.iloc[gap:]
    # 0.0/1.0/NaN 만 있는 float 컬럼 → Python bool 로 변환 (Excel TRUE/FALSE 유지)
    for col in df.columns:
        if df[col].dtype == float:
            unique_vals = set(df[col].dropna().unique())
            if unique_vals.issubset({0.0, 1.0}):
                df[col] = df[col].apply(
                    lambda x: None if (isinstance(x, float) and math.isnan(x)) else bool(x)
                )

    headers = [str(h) if h is not None else "" for h in df.columns]
    rows = []
    for r in df.itertuples(index=False):
        row = [clean(v) for v in r]
        rows.append(row)
    return headers, rows


def filter_rows_by_month(headers, rows, date_col_names, year, month):
    """날짜 컬럼 기준으로 대상 월 행만 반환. 총합 행 및 구분선 행 제외.
    date_col_names 중 여러 개가 발견되면 OR 조건 적용 (하나라도 해당 월이면 포함).
    """
    # 모든 매칭 날짜 컬럼 인덱스 수집 (OR 조건)
    date_indices = []
    for name in date_col_names:
        name_c = name.replace("\n", "").strip()
        for i, h in enumerate(headers):
            h_c = h.replace("\n", "").strip()
            if name_c == h_c or name_c in h_c or h_c in name_c:
                if i not in date_indices:
                    date_indices.append(i)
                break

    result = []
    for row in rows:
        # 빈 행 스킵
        if not any(v is not None for v in row):
            continue
        # 총합 행 스킵
        if is_total_row(row):
            continue
        # 구분선 행 스킵 — 실제 데이터가 거의 없는 행(날짜 문자열만 있는 행 등)
        real_vals = sum(
            1 for v in row
            if v is not None and v is not False and str(v).strip() not in ('', '0', '0.0')
        )
        if real_vals < 2:
            continue
        if date_indices:
            # 날짜 컬럼 중 하나라도 대상 월에 해당하면 포함 (OR)
            matched = False
            for date_idx in date_indices:
                if date_idx < len(row):
                    ym = parse_ym(row[date_idx])
                    if ym == (year, month):
                        matched = True
                        break
            if not matched:
                continue
        result.append(row)
    return result


# ──────────────────────────────────────────────────────────────
# 엑셀 파일 읽기 (수동 첨부용)
# ──────────────────────────────────────────────────────────────

def read_attach_rows(filepath, start_row=2, skip_last=False):
    """
    첨부 엑셀 파일을 pandas로 빠르게 읽기.
    start_row: 1-based 데이터 시작 행 (start_row-1 행이 헤더로 사용됨)
    반환: (headers, rows)  headers=[] 이면 헤더 없음
    """
    ext = str(filepath).lower()
    engine = "xlrd" if ext.endswith(".xls") else "openpyxl"

    # 헤더 행 읽기 (data start 바로 위 행)
    headers = []
    if start_row >= 2:
        df_hdr = pd.read_excel(filepath, header=None,
                               skiprows=start_row - 2, nrows=1, engine=engine)
        headers = [str(v).strip() if v is not None and str(v) != 'nan' else ""
                   for v in df_hdr.iloc[0].tolist()]

    df = pd.read_excel(filepath, header=None, skiprows=start_row - 1, engine=engine)
    df = df.dropna(how="all")
    # 총합 행 제외
    df = df[~df.iloc[:, 0].astype(str).str.strip().isin(["총합", "합계", "합 계"])]
    # 0.0/1.0/NaN 만 있는 float 컬럼 → Python bool 로 변환 (Excel TRUE/FALSE 유지)
    for col in df.columns:
        if df[col].dtype == float:
            unique_vals = set(df[col].dropna().unique())
            if unique_vals.issubset({0.0, 1.0}):
                df[col] = df[col].apply(
                    lambda x: None if (isinstance(x, float) and math.isnan(x)) else bool(x)
                )
    # 전화번호 앞자리 0 보존: 9~10자리 정수 중 '1'로 시작하는 컬럼 → 앞에 '0' 추가
    import pandas as _pd
    for col in df.columns:
        if df[col].dtype in ('int64', 'int32'):
            sample = df[col].dropna()
            if len(sample) > 0:
                str_vals = sample.astype(str)
                if str_vals.str.len().between(9, 10).all() and str_vals.str.startswith('1').all():
                    df[col] = df[col].apply(
                        lambda x: '0' + str(int(x)) if _pd.notna(x) else None
                    )
    rows = [[clean(v) for v in row] for row in df.values.tolist()]
    if skip_last and rows:
        rows = rows[:-1]
    return headers, rows


# ──────────────────────────────────────────────────────────────
# 엑셀 쓰기
# ──────────────────────────────────────────────────────────────

def get_dest_headers(ws, header_row, start_col_idx):
    """대상 시트의 헤더 행에서 start_col 이후 헤더 목록 반환 (중간 빈 셀 허용)"""
    headers = []
    consecutive_empty = 0
    for c in range(start_col_idx, ws.max_column + 1):
        val = ws.cell(row=header_row, column=c).value
        if val is None:
            consecutive_empty += 1
            if consecutive_empty >= 3:
                break
            headers.append("")
        else:
            consecutive_empty = 0
            headers.append(str(val))
    # 끝의 빈 헤더 제거
    while headers and headers[-1] == "":
        headers.pop()
    return headers


import re as _re

def _norm(s):
    """공백·줄바꿈 제거 후 소문자 정규화"""
    return _re.sub(r'\s+', '', str(s).strip())


def match_columns(src_headers, dest_headers):
    """
    dest_headers 순서로 src_headers 에서 매칭 인덱스 반환.
    1순위: 정규화 후 완전일치
    2순위: 가장 긴 공통 부분문자열을 가진 소스 컬럼 (짧은 컬럼이 긴 컬럼에 잘못 매칭되는 것 방지)
    """
    src_norm = [_norm(h) for h in src_headers]
    mapping = []
    for dh in dest_headers:
        dh_n = _norm(dh)
        found = None

        # 1순위: 완전일치
        for si, sn in enumerate(src_norm):
            if dh_n == sn:
                found = si
                break

        # 2순위: 부분 포함 — 더 긴 공통 길이를 가진 것 우선
        if found is None and dh_n:
            best_si, best_len = None, 0
            for si, sn in enumerate(src_norm):
                if not sn:
                    continue
                if sn in dh_n or dh_n in sn:
                    common_len = min(len(sn), len(dh_n))
                    if common_len > best_len:
                        best_len = common_len
                        best_si = si
            # 너무 짧은 단어는 오매칭 방지 (2글자 이상)
            if best_si is not None and best_len >= 2:
                found = best_si

        mapping.append(found)
    return mapping


def clear_data_range(ws, start_row, start_col_idx, num_cols):
    """데이터 범위 초기화 (수식 셀 제외, start_col_idx 왼쪽은 절대 건드리지 않음)"""
    empty_streak = 0
    for r in range(start_row, ws.max_row + 1):
        has_data = False
        for c in range(start_col_idx, start_col_idx + num_cols):
            cell = ws.cell(row=r, column=c)
            if cell.value is not None and not is_formula(cell):
                has_data = True
                break
        if not has_data:
            empty_streak += 1
            if empty_streak >= 5:
                break
        else:
            empty_streak = 0
        for c in range(start_col_idx, start_col_idx + num_cols):
            cell = ws.cell(row=r, column=c)
            if not is_formula(cell):
                cell.value = None


def write_rows(ws, rows, start_row, start_col_idx):
    """rows 를 지정 위치부터 기록 (수식 셀 건너뜀, start_col_idx 왼쪽은 절대 건드리지 않음)"""
    for ri, row_data in enumerate(rows):
        r = start_row + ri
        for ci, val in enumerate(row_data):
            c = start_col_idx + ci
            cell = ws.cell(row=r, column=c)
            if is_formula(cell):
                continue
            cell.value = val


def expand_tables(ws, last_data_row):
    """
    시트 내 모든 Excel 테이블의 끝 행을 last_data_row 로 확장.
    수납내역(효) 등 SUMIFS 가 표 참조(표7[...])를 쓸 때 범위가 늘어나야 함.
    """
    import re
    for tbl in ws.tables.values():
        m = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', tbl.ref)
        if m:
            sc, sr, ec, er = m.groups()
            if int(er) < last_data_row:
                tbl.ref = f"{sc}{sr}:{ec}{last_data_row}"


def _fix_dynamic_array_formulas(filepath, log=None):
    """
    openpyxl 저장 버그 수정: UNIQUE/FILTER 등 동적 배열 수식이
    t="array" ref="셀" 로 잘못 저장되어 Excel에서 스필되지 않는 문제 해결.
    저장 후 ZIP XML을 직접 수정해 동적 배열 수식에서 array 속성을 제거.
    """
    import zipfile, re, shutil, os

    DYNAMIC = ('_xlfn.UNIQUE(', '_xlfn._xlws.FILTER(', '_xlfn.UNIQUE(',
               '_xlfn.SORT(', '_xlfn.SORTBY(', '_xlfn.SEQUENCE(')

    pattern = re.compile(r'<f [^>]*t="array"[^>]*>(.*?)</f>', re.DOTALL)

    def replacer(m):
        formula = m.group(1)
        if any(fn in formula for fn in DYNAMIC):
            return f'<f>{formula}</f>'
        return m.group(0)

    tmp = filepath + '.tmp_fix'
    shutil.copy2(filepath, tmp)
    fixed = False
    try:
        with zipfile.ZipFile(tmp, 'r') as zin:
            with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    if item.filename.startswith('xl/worksheets/') and item.filename.endswith('.xml'):
                        text = data.decode('utf-8')
                        new_text = pattern.sub(replacer, text)
                        if new_text != text:
                            fixed = True
                        data = new_text.encode('utf-8')
                    zout.writestr(item, data)
    finally:
        os.remove(tmp)
    if log and fixed:
        log("  [수식 수정] 동적 배열 수식(UNIQUE/FILTER) 스필 속성 복원 완료")


# ──────────────────────────────────────────────────────────────
# 메인 처리
# ──────────────────────────────────────────────────────────────

def process_src_sheet(ws_dest, cfg, src_filepath, year, month, log):
    """B2G 소스 파일의 특정 시트 → 대상 시트에 기록"""
    sheet_name = ws_dest.title
    start_row = cfg["dest_start_row"]
    start_col_idx = column_index_from_string(cfg["dest_start_col"])
    dest_header_row = cfg["dest_header_row"]

    # 대상 헤더 읽기
    dest_headers = get_dest_headers(ws_dest, dest_header_row, start_col_idx)
    if not dest_headers:
        log(f"  [{sheet_name}] 대상 헤더 없음 — 건너뜀")
        return

    # 소스 읽기
    try:
        src_headers, src_rows = read_src_sheet(
            src_filepath,
            cfg["src_sheet"],
            cfg["header_row"],
            cfg["data_start_row"],
        )
    except Exception as e:
        log(f"  [{sheet_name}] 소스 읽기 오류: {e}")
        return

    log(f"  [{sheet_name}] 소스 전체: {len(src_rows)}행")

    # 월 필터
    filtered = filter_rows_by_month(src_headers, src_rows, cfg["date_cols"], year, month)
    log(f"  [{sheet_name}] {year}년 {month}월 해당: {len(filtered)}행")

    # 필수 컬럼 값 존재 필터 (예: 총판코드 없는 행 제외)
    require_cols = cfg.get("require_nonempty", [])
    if require_cols and filtered:
        req_norm = [_norm(c) for c in require_cols]
        src_norm_h = [_norm(h) for h in src_headers]
        # 후보 컬럼 인덱스 찾기 (부분일치 포함)
        req_indices = []
        for rn in req_norm:
            for si, sn in enumerate(src_norm_h):
                if rn == sn or rn in sn or sn in rn:
                    req_indices.append(si)
                    break
        if req_indices:
            before = len(filtered)
            filtered = [
                row for row in filtered
                if any(
                    idx < len(row) and row[idx] is not None and str(row[idx]).strip() not in ('', '-')
                    for idx in req_indices
                )
            ]
            log(f"  [{sheet_name}] 총판코드 없는 행 제외: {before - len(filtered)}행 제거 → {len(filtered)}행")

    if not filtered:
        return

    # 컬럼 매핑
    mapping = match_columns(src_headers, dest_headers)

    # 매핑 결과 로그 (처음 5개만)
    for i, (dh, si) in enumerate(zip(dest_headers[:5], mapping[:5])):
        sh = src_headers[si] if si is not None else "없음"
        log(f"    컬럼 매핑: [{dh}] ← [{sh}]")

    # 매핑 안 된 대상 컬럼 경고
    missing = [dest_headers[i] for i, si in enumerate(mapping) if si is None and dest_headers[i] not in ('열1','열2','열3','날짜변환','CMS등록(SO)')]
    if missing:
        log(f"    [주의] 매핑 안 됨: {missing[:5]}")

    mapped_rows = []
    for row in filtered:
        new_row = [row[idx] if (idx is not None and idx < len(row)) else None
                   for idx in mapping]
        mapped_rows.append(new_row)

    # 기존 데이터 지우고 쓰기
    clear_data_range(ws_dest, start_row, start_col_idx, len(dest_headers))
    write_rows(ws_dest, mapped_rows, start_row, start_col_idx)
    expand_tables(ws_dest, start_row + len(mapped_rows) - 1)
    log(f"  [{sheet_name}] {len(mapped_rows)}행 기록 완료")


def process_attach(ws_dest, filepath, start_row, start_col,
                   src_start_row=2, skip_last=False, dest_header_row=None, log=None):
    """첨부 파일 → 대상 시트에 기록 (헤더 매칭 지원)"""
    sheet_name = ws_dest.title
    start_col_idx = column_index_from_string(start_col)
    src_headers, rows = read_attach_rows(filepath, start_row=src_start_row, skip_last=skip_last)
    if log:
        log(f"  [{sheet_name}] {len(rows)}행")
    if not rows:
        return

    # 대상 헤더가 있고 소스 헤더도 있으면 컬럼 매칭
    _dest_hdr_row = dest_header_row if dest_header_row else (start_row - 1)
    dest_headers = get_dest_headers(ws_dest, _dest_hdr_row, start_col_idx)
    if src_headers and dest_headers and any(h for h in src_headers):
        mapping = match_columns(src_headers, dest_headers)
        mapped = []
        for row in rows:
            new_row = [row[idx] if (idx is not None and idx < len(row)) else None
                       for idx in mapping]
            mapped.append(new_row)
        if log:
            matched = sum(1 for m in mapping if m is not None)
            log(f"  [{sheet_name}] 컬럼 매칭: {matched}/{len(dest_headers)}개")
        rows = mapped
        num_cols = len(dest_headers)
    else:
        num_cols = max(len(r) for r in rows)

    clear_data_range(ws_dest, start_row, start_col_idx, num_cols)
    write_rows(ws_dest, rows, start_row, start_col_idx)
    expand_tables(ws_dest, start_row + len(rows) - 1)
    if log:
        log(f"  [{sheet_name}] 기록 완료")


def process_세계H(ws_dest, filepaths, start_row=6, start_col="J",
                   src_start_row=7, log=None):
    """세계(H): 여러 파일을 J6 부터 이어서 기록 (헤더 매칭 적용)"""
    sheet_name = ws_dest.title
    start_col_idx = column_index_from_string(start_col)
    dest_headers = get_dest_headers(ws_dest, start_row - 1, start_col_idx)
    clear_data_range(ws_dest, start_row, start_col_idx, 50)
    current_row = start_row
    for fp in filepaths:
        src_headers, rows = read_attach_rows(fp, start_row=src_start_row)
        if src_headers and dest_headers and any(h for h in src_headers):
            mapping = match_columns(src_headers, dest_headers)
            rows = [
                [row[idx] if (idx is not None and idx < len(row)) else None for idx in mapping]
                for row in rows
            ]
        if log:
            log(f"  [{sheet_name}] {Path(fp).name}: {len(rows)}행")
        write_rows(ws_dest, rows, current_row, start_col_idx)
        current_row += len(rows)
    if log:
        log(f"  [{sheet_name}] 총 {current_row - start_row}행 완료")


def run_automation(year, month, src_filepath, template_path, output_path,
                   file_수납내역, file_세계효, files_세계H, file_현영효,
                   log_func, done_func):
    try:
        log_func("=== 정산 자동화 시작 ===")
        log_func(f"정산 년월: {year}년 {month}월")

        # 템플릿 복사
        log_func(f"\n[1/2] 템플릿 복사...")
        shutil.copy2(template_path, output_path)
        log_func(f"  → {output_path}")

        # 엑셀 열기
        log_func(f"\n[2/2] 데이터 채우는 중...")
        wb = openpyxl.load_workbook(output_path, data_only=False)

        # B2G 소스 파일 → 각 시트
        if src_filepath and os.path.exists(src_filepath):
            for dest_sheet, cfg in SRC_SHEET_CONFIG.items():
                if dest_sheet not in wb.sheetnames:
                    log_func(f"  [{dest_sheet}] 시트 없음 — 건너뜀")
                    continue
                ws = wb[dest_sheet]
                process_src_sheet(ws, cfg, src_filepath, year, month, log_func)
        else:
            log_func("  [B2G 소스 파일] 미선택 — 관련 시트 건너뜀")

        # 수납내역(효)
        if file_수납내역 and os.path.exists(file_수납내역):
            log_func(f"\n  [수납내역(효)] 처리 중...")
            process_attach(wb["수납내역(효)"], file_수납내역,
                           start_row=3, start_col="G", src_start_row=2, log=log_func)
        else:
            log_func("  [수납내역(효)] 미첨부 — 건너뜀")

        # 세계(효)
        if file_세계효 and os.path.exists(file_세계효):
            log_func(f"\n  [세계(효)] 처리 중...")
            process_attach(wb["세계(효)"], file_세계효,
                           start_row=3, start_col="A", src_start_row=2, log=log_func)
        else:
            log_func("  [세계(효)] 미첨부 — 건너뜀")

        # 세계(H)
        if files_세계H:
            log_func(f"\n  [세계(H)] {len(files_세계H)}개 파일...")
            process_세계H(wb["세계(H)"], files_세계H,
                          start_row=6, start_col="J", src_start_row=7, log=log_func)
        else:
            log_func("  [세계(H)] 미첨부 — 건너뜀")

        # 현영(효)
        if file_현영효 and os.path.exists(file_현영효):
            log_func(f"\n  [현영(효)] 처리 중...")
            process_attach(wb["현영(효)"], file_현영효,
                           start_row=3, start_col="A", src_start_row=2,
                           skip_last=False, log=log_func)
        else:
            log_func("  [현영(효)] 미첨부 — 건너뜀")

        wb.save(output_path)
        # openpyxl이 UNIQUE/FILTER 등 동적 배열 수식을 레거시 배열 수식으로 저장하는 버그 수정
        _fix_dynamic_array_formulas(output_path, log_func)
        log_func(f"\n✅ 완료! → {output_path}")
        done_func(True, output_path)

    except Exception as e:
        import traceback
        log_func(f"\n❌ 오류: {e}")
        log_func(traceback.format_exc())
        done_func(False, str(e))


# ──────────────────────────────────────────────────────────────
# GUI
# ──────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("정산 자동화 도구")
        self.resizable(True, True)
        self.minsize(660, 720)

        self.year_var     = tk.StringVar(value=str(datetime.now().year))
        self.month_var    = tk.StringVar(value=str(datetime.now().month))
        self.src_path     = tk.StringVar()
        self.template_path = tk.StringVar()
        self.output_dir   = tk.StringVar()
        self.file_수납내역 = tk.StringVar()
        self.file_세계효  = tk.StringVar()
        self.file_현영효  = tk.StringVar()
        self.files_세계H  = []

        self._build_ui()

    def _build_ui(self):
        fp = {"padx": 10, "pady": 5, "fill": "x"}

        tk.Label(self, text="정산 자동화 도구",
                 font=("맑은 고딕", 15, "bold")).pack(pady=(14, 2))

        # 정산 년월
        f = tk.LabelFrame(self, text="정산 년월", font=("맑은 고딕", 10, "bold"))
        f.pack(**fp)
        row = tk.Frame(f); row.pack(fill="x", padx=8, pady=6)
        tk.Entry(row, textvariable=self.year_var, width=6).pack(side="left")
        tk.Label(row, text="년").pack(side="left")
        tk.Spinbox(row, from_=1, to=12, textvariable=self.month_var,
                   width=4).pack(side="left", padx=(6, 0))
        tk.Label(row, text="월").pack(side="left")

        # B2G 소스 파일
        f = tk.LabelFrame(self, text="B2G 소스 파일 (B2G_______.xlsx)",
                           font=("맑은 고딕", 10, "bold"))
        f.pack(**fp)
        self._file_row(f, self.src_path,
                       lambda: self._pick(self.src_path))

        # 템플릿
        f = tk.LabelFrame(self, text="정산 템플릿 파일",
                           font=("맑은 고딕", 10, "bold"))
        f.pack(**fp)
        self._file_row(f, self.template_path,
                       lambda: self._pick(self.template_path))

        # 출력 폴더
        f = tk.LabelFrame(self, text="출력 폴더 (빈칸 = 템플릿과 같은 폴더)",
                           font=("맑은 고딕", 10, "bold"))
        f.pack(**fp)
        row = tk.Frame(f); row.pack(fill="x", padx=8, pady=6)
        tk.Entry(row, textvariable=self.output_dir, width=52
                 ).pack(side="left", expand=True, fill="x")
        tk.Button(row, text="선택",
                  command=lambda: self.output_dir.set(
                      filedialog.askdirectory() or self.output_dir.get())
                  ).pack(side="left", padx=(6, 0))

        # 첨부 파일
        f = tk.LabelFrame(self, text="첨부 파일 (선택사항)",
                           font=("맑은 고딕", 10, "bold"))
        f.pack(**fp)

        rows_info = [
            ("수납내역(효)\n수납상세내역(청구별)_", self.file_수납내역),
            ("세계(효)\n세금계산서_발급목록_",       self.file_세계효),
            ("현영(효)\n현금영수증_발급목록_",       self.file_현영효),
        ]
        for label, var in rows_info:
            self._labeled_file_row(f, label, var)

        # 세계(H) 여러 파일
        row = tk.Frame(f); row.pack(fill="x", padx=8, pady=3)
        tk.Label(row, text="세계(H)\n매출전자세금계산서목록",
                 width=22, anchor="w", justify="left").pack(side="left")
        self.lbl_세계H = tk.Label(row, text="파일 없음", fg="gray", anchor="w",
                                    width=38, relief="sunken")
        self.lbl_세계H.pack(side="left", expand=True, fill="x")
        tk.Button(row, text="추가",
                  command=self._add_세계H).pack(side="left", padx=(6, 0))
        tk.Button(row, text="초기화",
                  command=self._clear_세계H).pack(side="left", padx=3)

        # 실행
        self.btn_run = tk.Button(
            self, text="실행하기", font=("맑은 고딕", 12, "bold"),
            bg="#4CAF50", fg="white", height=2, command=self._run)
        self.btn_run.pack(fill="x", padx=10, pady=8)

        # 로그
        f = tk.LabelFrame(self, text="처리 로그", font=("맑은 고딕", 10, "bold"))
        f.pack(padx=10, pady=4, fill="both", expand=True)
        self.log_area = scrolledtext.ScrolledText(
            f, height=12, state="disabled", font=("Consolas", 9))
        self.log_area.pack(fill="both", expand=True, padx=4, pady=4)

    def _file_row(self, parent, var, cmd):
        row = tk.Frame(parent); row.pack(fill="x", padx=8, pady=6)
        tk.Entry(row, textvariable=var, width=52
                 ).pack(side="left", expand=True, fill="x")
        tk.Button(row, text="선택", command=cmd).pack(side="left", padx=(6, 0))

    def _labeled_file_row(self, parent, label, var):
        row = tk.Frame(parent); row.pack(fill="x", padx=8, pady=3)
        tk.Label(row, text=label, width=22, anchor="w",
                 justify="left").pack(side="left")
        tk.Entry(row, textvariable=var, width=40
                 ).pack(side="left", expand=True, fill="x")
        tk.Button(row, text="선택",
                  command=lambda v=var: v.set(
                      filedialog.askopenfilename(
                          filetypes=[("Excel", "*.xlsx *.xlsm *.xls")]
                      ) or v.get())
                  ).pack(side="left", padx=(6, 0))

    def _pick(self, var):
        p = filedialog.askopenfilename(
            filetypes=[("Excel", "*.xlsx *.xlsm *.xls")])
        if p:
            var.set(p)

    def _add_세계H(self):
        files = filedialog.askopenfilenames(
            filetypes=[("Excel", "*.xlsx *.xlsm *.xls")])
        if files:
            self.files_세계H.extend(files)
            self.lbl_세계H.config(
                text=f"{len(self.files_세계H)}개 선택됨", fg="black")

    def _clear_세계H(self):
        self.files_세계H.clear()
        self.lbl_세계H.config(text="파일 없음", fg="gray")

    def _log(self, msg):
        self.log_area.config(state="normal")
        self.log_area.insert("end", msg + "\n")
        self.log_area.see("end")
        self.log_area.config(state="disabled")

    def _run(self):
        try:
            year  = int(self.year_var.get())
            month = int(self.month_var.get())
            assert 1 <= month <= 12
        except Exception:
            messagebox.showerror("입력 오류", "년도와 월을 올바르게 입력해주세요.")
            return

        tmpl = self.template_path.get().strip()
        if not tmpl or not os.path.exists(tmpl):
            messagebox.showerror("파일 오류", "템플릿 파일을 선택해주세요.")
            return

        out_dir = self.output_dir.get().strip() or str(Path(tmpl).parent)
        output_path = str(Path(out_dir) / f"{year}년{month}월_정산.xlsx")

        self.log_area.config(state="normal")
        self.log_area.delete("1.0", "end")
        self.log_area.config(state="disabled")

        self.btn_run.config(state="disabled", text="처리 중...")

        def done(ok, info):
            self.btn_run.config(state="normal", text="실행하기")
            if ok:
                messagebox.showinfo("완료", f"저장됨:\n{info}")
            else:
                messagebox.showerror("오류", info)

        def worker():
            run_automation(
                year=year, month=month,
                src_filepath=self.src_path.get().strip() or None,
                template_path=tmpl,
                output_path=output_path,
                file_수납내역=self.file_수납내역.get().strip() or None,
                file_세계효=self.file_세계효.get().strip() or None,
                files_세계H=self.files_세계H[:],
                file_현영효=self.file_현영효.get().strip() or None,
                log_func=lambda m: self.after(0, lambda msg=m: self._log(msg)),
                done_func=lambda s, i: self.after(0, lambda: done(s, i)),
            )

        threading.Thread(target=worker, daemon=True).start()


if __name__ == "__main__":
    App().mainloop()
