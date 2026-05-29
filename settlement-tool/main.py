"""
정산 자동화 도구
매월 정산 엑셀 파일을 자동으로 채워주는 프로그램
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import os
import sys
import shutil
from datetime import datetime
from pathlib import Path
import re

import openpyxl
from openpyxl.utils import column_index_from_string

# Google Sheets 관련
import gspread
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# ──────────────────────────────────────────────────────────────
# 상수
# ──────────────────────────────────────────────────────────────
SPREADSHEET_ID = "1G-HfiXb6WH6NYFovdhmBD2z7Q941WNc4mMisgF5VVks"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# gid → 시트 역할 매핑
GID_MAP = {
    459362940:  "통장016",
    175848238:  "학교장터",
    196159749:  "풀리(총판)",
    1841069902: "b2g매출내역",
    334891014:  "풀리b2b매출내역",
}

# 각 대상 시트의 데이터 시작 위치 (시트명: (start_row, start_col_letter))
DEST_CONFIG = {
    "통장016":          {"start_row": 4, "start_col": "D", "header_row": 3,
                         "date_col": "거래일시", "src_gid": 459362940},
    "학교장터":          {"start_row": 3, "start_col": "D", "header_row": 2,
                         "date_col": "승인일시", "src_gid": 175848238},
    "풀리(총판)":        {"start_row": 4, "start_col": "D", "header_row": 3,
                         "date_cols": ["매출월", "(수식 자동입력)입금일", "입금일"],
                         "src_gid": 196159749},
    "b2g매출내역":       {"start_row": 3, "start_col": "D", "header_row": 2,
                         "date_col": "날짜", "src_gid": 1841069902},
    "풀리b2b매출내역":   {"start_row": 3, "start_col": "A", "header_row": 2,
                         "date_col": "날짜", "src_gid": 334891014},
}

# ──────────────────────────────────────────────────────────────
# 유틸 함수
# ──────────────────────────────────────────────────────────────

def resource_path(filename):
    """PyInstaller 번들 내부 또는 일반 실행 경로에서 파일 경로 반환"""
    if getattr(sys, "frozen", False):
        base = Path(sys.executable).parent
    else:
        base = Path(__file__).parent
    return base / filename


def get_credentials():
    """OAuth 토큰을 얻거나 갱신한다. credentials.json 이 필요."""
    token_path = resource_path("token.json")
    creds_path = resource_path("credentials.json")

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not creds_path.exists():
                raise FileNotFoundError(
                    "credentials.json 파일이 없습니다.\n"
                    "프로그램과 같은 폴더에 Google OAuth credentials.json을 넣어주세요.\n\n"
                    "발급 방법:\n"
                    "1. console.cloud.google.com 접속\n"
                    "2. 새 프로젝트 생성\n"
                    "3. Google Sheets API 활성화\n"
                    "4. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)\n"
                    "5. JSON 다운로드 후 credentials.json 으로 저장"
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
            creds = flow.run_local_server(port=0)
        with open(str(token_path), "w") as f:
            f.write(creds.to_json())

    return creds


def parse_date(val):
    """문자열 또는 datetime 에서 (year, month) 추출. 실패 시 None."""
    if val is None or val == "":
        return None
    if isinstance(val, datetime):
        return (val.year, val.month)
    s = str(val).strip()
    # 숫자만 있으면 엑셀 시리얼 날짜일 수 있음 — 무시
    if re.match(r"^\d{4}[-./년](\d{1,2})", s):
        m = re.match(r"^(\d{4})[-./년](\d{1,2})", s)
        if m:
            return (int(m.group(1)), int(m.group(2)))
    return None


def is_total_row(row_values):
    """첫 번째 셀이 '총합' 포함이면 True"""
    if not row_values:
        return False
    first = str(row_values[0]).strip()
    return "총합" in first or "합계" == first or first == "합 계"


def is_formula(cell):
    return cell.value is not None and str(cell.value).startswith("=")


def clear_data_range(ws, start_row, start_col_idx, num_cols):
    """
    지정 범위의 기존 데이터를 지운다.
    수식이 있는 셀은 건드리지 않는다.
    """
    max_row = ws.max_row
    for r in range(start_row, max_row + 1):
        any_data = False
        for c in range(start_col_idx, start_col_idx + num_cols):
            cell = ws.cell(row=r, column=c)
            if cell.value is not None and not is_formula(cell):
                any_data = True
                break
        if not any_data and r > start_row + 2:
            # 빈 행이 연속으로 나오면 중단
            break
        for c in range(start_col_idx, start_col_idx + num_cols):
            cell = ws.cell(row=r, column=c)
            if not is_formula(cell):
                cell.value = None


def write_rows(ws, rows, start_row, start_col_idx):
    """rows(리스트의 리스트) 를 start_row, start_col 부터 기록. 수식 셀 건너뜀."""
    for ri, row_data in enumerate(rows):
        r = start_row + ri
        for ci, val in enumerate(row_data):
            c = start_col_idx + ci
            cell = ws.cell(row=r, column=c)
            if is_formula(cell):
                continue
            cell.value = val


# ──────────────────────────────────────────────────────────────
# Google Sheets 읽기
# ──────────────────────────────────────────────────────────────

def fetch_sheet_data(client, gid):
    """지정 gid의 시트 전체 데이터를 [[값,...], ...] 로 반환 (헤더 포함)"""
    ss = client.open_by_key(SPREADSHEET_ID)
    ws = ss.get_worksheet_by_id(gid)
    return ws.get_all_values()


def filter_by_month(all_values, year, month, date_col_names):
    """
    헤더 행(첫 행)을 기준으로 date_col_names 중 하나를 찾아
    해당 연월의 행만 반환한다. 총합 행 제외.
    반환: (headers, filtered_rows)
    """
    if not all_values:
        return [], []

    headers = all_values[0]
    # 날짜 컬럼 인덱스 찾기
    date_col_idx = None
    for name in date_col_names:
        for i, h in enumerate(headers):
            # 줄바꿈 포함 가능성 있으므로 strip
            if name.replace("\n", "").strip() in h.replace("\n", "").strip():
                date_col_idx = i
                break
        if date_col_idx is not None:
            break

    filtered = []
    for row in all_values[1:]:
        if is_total_row(row):
            continue
        if not any(v.strip() for v in row):
            continue
        if date_col_idx is not None and date_col_idx < len(row):
            parsed = parse_date(row[date_col_idx])
            if parsed is None:
                continue
            if parsed != (year, month):
                continue
        else:
            # 날짜 컬럼 못 찾으면 모두 포함
            pass
        filtered.append(row)

    return headers, filtered


def match_columns(src_headers, dest_headers):
    """
    dest_headers 순서대로 src_headers 에서 같은 이름의 컬럼 인덱스를 찾는다.
    못 찾으면 None 을 반환하는 매핑 리스트 반환.
    """
    mapping = []
    for dh in dest_headers:
        dh_clean = dh.replace("\n", "").strip()
        found = None
        for si, sh in enumerate(src_headers):
            sh_clean = sh.replace("\n", "").strip()
            if dh_clean == sh_clean or dh_clean in sh_clean or sh_clean in dh_clean:
                found = si
                break
        mapping.append(found)
    return mapping


def apply_column_mapping(rows, mapping):
    """매핑에 따라 각 행에서 필요한 컬럼만 뽑는다."""
    result = []
    for row in rows:
        new_row = []
        for idx in mapping:
            if idx is not None and idx < len(row):
                new_row.append(row[idx])
            else:
                new_row.append(None)
        result.append(new_row)
    return result


# ──────────────────────────────────────────────────────────────
# 엑셀 파일 읽기 (첨부 파일용)
# ──────────────────────────────────────────────────────────────

def read_excel_rows(filepath, start_row=2, skip_last=False):
    """
    pandas로 엑셀 파일을 빠르게 읽어 [[값,...]] 반환.
    start_row: 1-based 행 번호 (2 = 두 번째 행부터)
    skip_last: True 이면 마지막 행 제외.
    총합 행 제외.
    """
    import pandas as pd
    ext = str(filepath).lower()
    engine = "xlrd" if ext.endswith(".xls") else "openpyxl"
    df = pd.read_excel(filepath, header=None, skiprows=start_row - 1,
                       engine=engine)
    # 완전 빈 행 제외
    df = df.dropna(how="all")
    # 총합 행 제외
    df = df[~df.iloc[:, 0].astype(str).str.strip().isin(["총합", "합계", "합 계"])]
    # NaN → None 변환
    rows = [[None if (isinstance(v, float) and __import__('math').isnan(v)) else v
             for v in row]
            for row in df.values.tolist()]
    if skip_last and rows:
        rows = rows[:-1]
    return rows


def read_excel_rows_from_row(filepath, start_row=7):
    """세계(H) 용: 특정 행부터 읽기"""
    return read_excel_rows(filepath, start_row=start_row, skip_last=False)


# ──────────────────────────────────────────────────────────────
# 각 시트별 처리
# ──────────────────────────────────────────────────────────────

def process_gsheet_to_dest(ws_dest, cfg, src_all_values, year, month, log):
    """Google Sheets 데이터를 정산 파일 시트에 기록"""
    sheet_name = ws_dest.title
    start_row = cfg["start_row"]
    start_col_idx = column_index_from_string(cfg["start_col"])
    header_row_num = cfg["header_row"]

    # 대상 시트에서 헤더 읽기
    dest_headers = []
    for c in range(start_col_idx, ws_dest.max_column + 1):
        val = ws_dest.cell(row=header_row_num, column=c).value
        if val is None:
            # 연속 빈 열이 나오면 중단
            if dest_headers:
                break
            continue
        dest_headers.append(str(val))

    # 풀리(총판) 은 여러 날짜 컬럼
    date_cols = cfg.get("date_cols", [cfg.get("date_col", "날짜")])

    src_headers, filtered_rows = filter_by_month(src_all_values, year, month, date_cols)
    log(f"  [{sheet_name}] 소스 행 수: {len(filtered_rows)}")

    if not filtered_rows:
        log(f"  [{sheet_name}] 해당 월 데이터 없음 — 건너뜀")
        return

    # 컬럼 매핑
    mapping = match_columns(src_headers, dest_headers)
    mapped_rows = apply_column_mapping(filtered_rows, mapping)

    # 기존 데이터 지우기
    clear_data_range(ws_dest, start_row, start_col_idx, len(dest_headers))

    # 새 데이터 쓰기
    write_rows(ws_dest, mapped_rows, start_row, start_col_idx)
    log(f"  [{sheet_name}] {len(mapped_rows)}행 기록 완료")


def process_manual_file(ws_dest, filepath, start_row, start_col, src_start_row=2,
                         skip_last=False, log=None):
    """첨부 엑셀 파일 데이터를 대상 시트에 기록"""
    sheet_name = ws_dest.title
    start_col_idx = column_index_from_string(start_col)

    rows = read_excel_rows(filepath, start_row=src_start_row, skip_last=skip_last)
    if log:
        log(f"  [{sheet_name}] 파일 행 수: {len(rows)}")

    if not rows:
        if log:
            log(f"  [{sheet_name}] 데이터 없음 — 건너뜀")
        return

    # 기존 데이터 지우기 (최대 컬럼 수 추측)
    num_cols = max(len(r) for r in rows) if rows else 30
    clear_data_range(ws_dest, start_row, start_col_idx, num_cols)
    write_rows(ws_dest, rows, start_row, start_col_idx)
    if log:
        log(f"  [{sheet_name}] {len(rows)}행 기록 완료")


def process_세계H(ws_dest, filepaths, start_row, start_col, src_start_row=7, log=None):
    """세계(H): 여러 파일을 순서대로 J6부터 이어서 기록"""
    sheet_name = ws_dest.title
    start_col_idx = column_index_from_string(start_col)
    current_row = start_row

    # 먼저 기존 데이터 모두 지우기
    num_cols = 50
    clear_data_range(ws_dest, start_row, start_col_idx, num_cols)

    for fp in filepaths:
        rows = read_excel_rows_from_row(fp, start_row=src_start_row)
        if log:
            log(f"  [{sheet_name}] {Path(fp).name}: {len(rows)}행")
        write_rows(ws_dest, rows, current_row, start_col_idx)
        current_row += len(rows)

    if log:
        log(f"  [{sheet_name}] 총 {current_row - start_row}행 기록 완료")


# ──────────────────────────────────────────────────────────────
# 메인 실행 로직
# ──────────────────────────────────────────────────────────────

def run_automation(year, month, template_path, output_path,
                   file_수납내역, file_세계효, files_세계H, file_현영효,
                   log_func, done_func):
    try:
        log_func("=== 정산 자동화 시작 ===")
        log_func(f"정산 년월: {year}년 {month}월")

        # 1. 템플릿 복사
        log_func(f"\n[1/3] 템플릿 복사 중...")
        shutil.copy2(template_path, output_path)
        log_func(f"  출력 파일: {output_path}")

        # 2. Google Sheets 인증 및 데이터 읽기
        log_func(f"\n[2/3] Google Sheets 데이터 가져오기...")
        creds = get_credentials()
        gc = gspread.authorize(creds)

        # 각 소스 시트의 데이터를 미리 읽어둠
        gsheet_data = {}
        for gid, role in GID_MAP.items():
            log_func(f"  [{role}] 데이터 로딩...")
            try:
                gsheet_data[gid] = fetch_sheet_data(gc, gid)
                log_func(f"  [{role}] {len(gsheet_data[gid])-1}행 수신")
            except Exception as e:
                log_func(f"  [{role}] 오류: {e}")
                gsheet_data[gid] = []

        # 3. 엑셀 파일에 기록
        log_func(f"\n[3/3] 엑셀 파일 작성 중...")
        wb = openpyxl.load_workbook(output_path, data_only=False)

        # Google Sheets → 엑셀 시트
        for sheet_name, cfg in DEST_CONFIG.items():
            if sheet_name not in wb.sheetnames:
                log_func(f"  [{sheet_name}] 시트 없음 — 건너뜀")
                continue
            ws = wb[sheet_name]
            gid = cfg["src_gid"]
            src_data = gsheet_data.get(gid, [])
            if src_data:
                try:
                    process_gsheet_to_dest(ws, cfg, src_data, year, month, log_func)
                except Exception as e:
                    log_func(f"  [{sheet_name}] 오류: {e}")
            else:
                log_func(f"  [{sheet_name}] 소스 데이터 없음 — 건너뜀")

        # 수납내역(효)
        if file_수납내역 and os.path.exists(file_수납내역):
            log_func(f"\n  [수납내역(효)] 처리 중...")
            ws = wb["수납내역(효)"]
            process_manual_file(ws, file_수납내역, start_row=3, start_col="G",
                                 src_start_row=2, log=log_func)
        else:
            log_func("  [수납내역(효)] 파일 미첨부 — 건너뜀")

        # 세계(효)
        if file_세계효 and os.path.exists(file_세계효):
            log_func(f"\n  [세계(효)] 처리 중...")
            ws = wb["세계(효)"]
            process_manual_file(ws, file_세계효, start_row=3, start_col="A",
                                 src_start_row=2, log=log_func)
        else:
            log_func("  [세계(효)] 파일 미첨부 — 건너뜀")

        # 세계(H) - 여러 파일
        if files_세계H:
            log_func(f"\n  [세계(H)] {len(files_세계H)}개 파일 처리 중...")
            ws = wb["세계(H)"]
            process_세계H(ws, files_세계H, start_row=6, start_col="J",
                          src_start_row=7, log=log_func)
        else:
            log_func("  [세계(H)] 파일 미첨부 — 건너뜀")

        # 현영(효)
        if file_현영효 and os.path.exists(file_현영효):
            log_func(f"\n  [현영(효)] 처리 중...")
            ws = wb["현영(효)"]
            process_manual_file(ws, file_현영효, start_row=3, start_col="A",
                                 src_start_row=2, skip_last=True, log=log_func)
        else:
            log_func("  [현영(효)] 파일 미첨부 — 건너뜀")

        # 저장
        wb.save(output_path)
        log_func(f"\n✅ 완료! 파일 저장됨: {output_path}")
        done_func(True, output_path)

    except Exception as e:
        log_func(f"\n❌ 오류 발생: {e}")
        import traceback
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
        self.minsize(640, 700)

        # 변수
        self.template_path = tk.StringVar()
        self.output_dir = tk.StringVar()
        self.year_var = tk.StringVar(value=str(datetime.now().year))
        self.month_var = tk.StringVar(value=str(datetime.now().month))

        self.file_수납내역 = tk.StringVar()
        self.file_세계효 = tk.StringVar()
        self.files_세계H = []
        self.file_현영효 = tk.StringVar()

        self._build_ui()

    def _build_ui(self):
        pad = {"padx": 10, "pady": 4}
        frame_pad = {"padx": 10, "pady": 6, "fill": "x"}

        # ── 제목 ──
        tk.Label(self, text="📊 정산 자동화 도구", font=("맑은 고딕", 16, "bold")
                 ).pack(pady=(14, 2))
        tk.Label(self, text="Google Sheets + 엑셀 첨부 파일로 정산 파일을 자동 완성합니다",
                 fg="gray").pack(pady=(0, 10))

        # ── 정산 년월 ──
        f = tk.LabelFrame(self, text="정산 년월", font=("맑은 고딕", 10, "bold"))
        f.pack(**frame_pad)
        row = tk.Frame(f)
        row.pack(fill="x", padx=8, pady=6)
        tk.Entry(row, textvariable=self.year_var, width=6).pack(side="left")
        tk.Label(row, text="년").pack(side="left")
        tk.Spinbox(row, from_=1, to=12, textvariable=self.month_var, width=4
                   ).pack(side="left", padx=(6, 0))
        tk.Label(row, text="월").pack(side="left")

        # ── 템플릿 파일 ──
        f = tk.LabelFrame(self, text="템플릿 엑셀 파일", font=("맑은 고딕", 10, "bold"))
        f.pack(**frame_pad)
        row = tk.Frame(f)
        row.pack(fill="x", padx=8, pady=6)
        tk.Entry(row, textvariable=self.template_path, width=52).pack(side="left", expand=True, fill="x")
        tk.Button(row, text="선택", command=self._pick_template).pack(side="left", padx=(6, 0))

        # ── 출력 폴더 ──
        f = tk.LabelFrame(self, text="출력 폴더 (빈칸이면 템플릿과 같은 폴더)", font=("맑은 고딕", 10, "bold"))
        f.pack(**frame_pad)
        row = tk.Frame(f)
        row.pack(fill="x", padx=8, pady=6)
        tk.Entry(row, textvariable=self.output_dir, width=52).pack(side="left", expand=True, fill="x")
        tk.Button(row, text="선택", command=self._pick_output_dir).pack(side="left", padx=(6, 0))

        # ── 첨부 파일 ──
        f = tk.LabelFrame(self, text="첨부 파일 (선택사항)", font=("맑은 고딕", 10, "bold"))
        f.pack(**frame_pad)

        self._file_row(f, "수납내역(효)\n(수납상세내역(청구별)_)",    self.file_수납내역, self._pick_수납내역)
        self._file_row(f, "세계(효)\n(세금계산서_발급목록_)",          self.file_세계효,   self._pick_세계효)
        self._세계H_row(f)
        self._file_row(f, "현영(효)\n(현금영수증_발급목록_)",          self.file_현영효,   self._pick_현영효)

        # ── 구글 로그인 ──
        f = tk.LabelFrame(self, text="Google 계정", font=("맑은 고딕", 10, "bold"))
        f.pack(**frame_pad)
        row = tk.Frame(f)
        row.pack(fill="x", padx=8, pady=6)
        tk.Button(row, text="Google 로그인 / 갱신", command=self._google_login
                  ).pack(side="left")
        self.lbl_login = tk.Label(row, text="미로그인", fg="red")
        self.lbl_login.pack(side="left", padx=10)
        self._check_login_status()

        # ── 실행 버튼 ──
        self.btn_run = tk.Button(self, text="▶ 실행하기", font=("맑은 고딕", 12, "bold"),
                                  bg="#4CAF50", fg="white", height=2,
                                  command=self._run)
        self.btn_run.pack(fill="x", padx=10, pady=8)

        # ── 로그 ──
        f = tk.LabelFrame(self, text="처리 로그", font=("맑은 고딕", 10, "bold"))
        f.pack(padx=10, pady=4, fill="both", expand=True)
        self.log_area = scrolledtext.ScrolledText(f, height=12, state="disabled",
                                                   font=("Consolas", 9))
        self.log_area.pack(fill="both", expand=True, padx=4, pady=4)

    def _file_row(self, parent, label, var, cmd):
        row = tk.Frame(parent)
        row.pack(fill="x", padx=8, pady=3)
        tk.Label(row, text=label, width=22, anchor="w", justify="left"
                 ).pack(side="left")
        tk.Entry(row, textvariable=var, width=40).pack(side="left", expand=True, fill="x")
        tk.Button(row, text="선택", command=cmd).pack(side="left", padx=(6, 0))

    def _세계H_row(self, parent):
        row = tk.Frame(parent)
        row.pack(fill="x", padx=8, pady=3)
        tk.Label(row, text="세계(H)\n(매출전자세금계산서목록)", width=22, anchor="w",
                 justify="left").pack(side="left")
        self.lbl_세계H = tk.Label(row, text="파일 없음", fg="gray", anchor="w",
                                    width=40, relief="sunken")
        self.lbl_세계H.pack(side="left", expand=True, fill="x")
        tk.Button(row, text="추가", command=self._add_세계H).pack(side="left", padx=(6, 0))
        tk.Button(row, text="초기화", command=self._clear_세계H).pack(side="left", padx=(3, 0))

    def _pick_template(self):
        p = filedialog.askopenfilename(filetypes=[("Excel", "*.xlsx *.xlsm")])
        if p:
            self.template_path.set(p)

    def _pick_output_dir(self):
        p = filedialog.askdirectory()
        if p:
            self.output_dir.set(p)

    def _pick_수납내역(self):
        p = filedialog.askopenfilename(filetypes=[("Excel", "*.xlsx *.xlsm *.xls")])
        if p:
            self.file_수납내역.set(p)

    def _pick_세계효(self):
        p = filedialog.askopenfilename(filetypes=[("Excel", "*.xlsx *.xlsm *.xls")])
        if p:
            self.file_세계효.set(p)

    def _add_세계H(self):
        files = filedialog.askopenfilenames(filetypes=[("Excel", "*.xlsx *.xlsm *.xls")])
        if files:
            self.files_세계H.extend(files)
            self.lbl_세계H.config(text=f"{len(self.files_세계H)}개 파일 선택됨", fg="black")

    def _clear_세계H(self):
        self.files_세계H.clear()
        self.lbl_세계H.config(text="파일 없음", fg="gray")

    def _pick_현영효(self):
        p = filedialog.askopenfilename(filetypes=[("Excel", "*.xlsx *.xlsm *.xls")])
        if p:
            self.file_현영효.set(p)

    def _check_login_status(self):
        token_path = resource_path("token.json")
        if token_path.exists():
            try:
                creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
                if creds and creds.valid:
                    self.lbl_login.config(text="✓ 로그인됨", fg="green")
                elif creds and creds.expired and creds.refresh_token:
                    self.lbl_login.config(text="토큰 만료 (재로그인 필요)", fg="orange")
            except Exception:
                pass

    def _google_login(self):
        try:
            get_credentials()
            self.lbl_login.config(text="✓ 로그인됨", fg="green")
            messagebox.showinfo("성공", "Google 로그인 완료!")
        except FileNotFoundError as e:
            messagebox.showerror("credentials.json 없음", str(e))
        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _log(self, msg):
        self.log_area.config(state="normal")
        self.log_area.insert("end", msg + "\n")
        self.log_area.see("end")
        self.log_area.config(state="disabled")

    def _run(self):
        # 유효성 검사
        try:
            year = int(self.year_var.get())
            month = int(self.month_var.get())
            assert 1 <= month <= 12
        except Exception:
            messagebox.showerror("입력 오류", "년도와 월을 올바르게 입력해주세요.")
            return

        template = self.template_path.get().strip()
        if not template or not os.path.exists(template):
            messagebox.showerror("파일 오류", "템플릿 엑셀 파일을 선택해주세요.")
            return

        # 출력 경로 결정
        out_dir = self.output_dir.get().strip() or str(Path(template).parent)
        output_path = str(Path(out_dir) / f"{year}년{month}월_정산.xlsx")

        # 로그 초기화
        self.log_area.config(state="normal")
        self.log_area.delete("1.0", "end")
        self.log_area.config(state="disabled")

        self.btn_run.config(state="disabled", text="처리 중...")

        def done(success, info):
            self.btn_run.config(state="normal", text="▶ 실행하기")
            if success:
                messagebox.showinfo("완료", f"정산 파일이 저장되었습니다.\n\n{info}")
            else:
                messagebox.showerror("오류", f"처리 중 오류 발생:\n{info}")

        def run_thread():
            run_automation(
                year=year,
                month=month,
                template_path=template,
                output_path=output_path,
                file_수납내역=self.file_수납내역.get().strip() or None,
                file_세계효=self.file_세계효.get().strip() or None,
                files_세계H=self.files_세계H[:],
                file_현영효=self.file_현영효.get().strip() or None,
                log_func=lambda msg: self.after(0, lambda m=msg: self._log(m)),
                done_func=lambda s, i: self.after(0, lambda: done(s, i)),
            )

        threading.Thread(target=run_thread, daemon=True).start()


# ──────────────────────────────────────────────────────────────
# 엔트리 포인트
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app = App()
    app.mainloop()
