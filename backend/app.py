import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from tkinter import filedialog, messagebox
import threading
import pandas as pd
import os

# 백엔드 모듈 임포트
from backend.anonymizer import anonymize
from backend.rules import check_rules
from backend.ai_analyzer import analyze_with_gpt
from backend.exporter import save_validation_results

class ModernWikiApp:
    def __init__(self):
        # 1. 테마 설정 (cosmo 테마: 깔끔한 블루/화이트)
        self.root = ttk.Window(themename="cosmo", title="WIKISOFT AI 검증 시스템", size=(900, 700))
        
        self.config = {}
        self.selected_file = ""
        
        # 메인 컨테이너
        self.container = ttk.Frame(self.root, padding=40)
        self.container.pack(fill=BOTH, expand=YES)
        
        self.show_step_1()

    def show_step_1(self):
        """STEP 1: 기초 정보 입력 UI"""
        self.clear_frame()
        
        # 상단 타이틀
        ttk.Label(self.container, text="STEP 1. 기초 진단 정보 입력", font=("나눔고딕", 18, "bold"), bootstyle=PRIMARY).pack(pady=(0, 30))
        
        # 입력 카드 (Labelframe)
        card = ttk.Labelframe(self.container, text=" 회사 규정 입력 ", padding=30)
        card.pack(fill=X, pady=10)
        
        ttk.Label(card, text="1. 정년 나이 (만 기준)", font=("나눔고딕", 10)).pack(anchor=W)
        self.age_entry = ttk.Entry(card, font=("Arial", 11))
        self.age_entry.insert(0, "60")
        self.age_entry.pack(fill=X, pady=(5, 20))
        
        ttk.Label(card, text="2. 검증 대상 총 인원 수", font=("나눔고딕", 10)).pack(anchor=W)
        self.count_entry = ttk.Entry(card, font=("Arial", 11))
        self.count_entry.pack(fill=X, pady=5)
        
        # 버튼
        ttk.Button(self.container, text="다음 단계로 (파일 선택)  →", 
                   bootstyle=PRIMARY, width=30, command=self.save_step_1).pack(pady=40)

    def show_step_2(self):
        """STEP 2: 파일 업로드 UI"""
        self.clear_frame()
        ttk.Label(self.container, text="STEP 2. 데이터 파일 업로드", font=("나눔고딕", 18, "bold"), bootstyle=PRIMARY).pack(pady=(0, 30))
        
        upload_area = ttk.Frame(self.container, bootstyle=SECONDARY, padding=50)
        upload_area.pack(fill=X, pady=10)
        
        self.file_label = ttk.Label(upload_area, text="분석할 엑셀 파일을 선택해 주세요", font=("나눔고딕", 11), bootstyle="inverse-secondary")
        self.file_label.pack(pady=10)
        
        ttk.Button(upload_area, text="파일 찾기", bootstyle=INFO, command=self.browse_file).pack(pady=10)
        
        # 하단 네비게이션
        nav_frame = ttk.Frame(self.container)
        nav_frame.pack(side=BOTTOM, fill=X, pady=20)
        ttk.Button(nav_frame, text="← 이전", bootstyle="outline-secondary", command=self.show_step_1).pack(side=LEFT)
        ttk.Button(nav_frame, text="AI 검증 시작 →", bootstyle=SUCCESS, command=self.show_step_3).pack(side=RIGHT)

    def show_step_3(self):
        """STEP 3: 진행 상태 로그 UI"""
        if not self.selected_file:
            messagebox.showwarning("파일 미선택", "엑셀 파일을 먼저 선택해 주세요.")
            return self.show_step_2()

        self.clear_frame()
        ttk.Label(self.container, text="STEP 3. AI 자동 검증 진행 중", font=("나눔고딕", 18, "bold"), bootstyle=PRIMARY).pack(pady=(0, 10))
        
        # 프로그레스 바 (진행 표시)
        self.progress = ttk.Progressbar(self.container, bootstyle=SUCCESS, mode=INDETERMINATE)
        self.progress.pack(fill=X, pady=20)
        self.progress.start()
        
        # 로그 창
        self.log_area = ttk.ScrolledText(self.container, height=15, font=("Consolas", 9))
        self.log_area.pack(fill=BOTH, expand=YES, pady=10)
        
        # 백엔드 스레드 시작
        threading.Thread(target=self.run_logic, daemon=True).start()

    def run_logic(self):
        """백엔드 엔진 통합 실행"""
        try:
            self.log("🚀 분석 엔진을 가동합니다...")
            df_raw = pd.read_excel(self.selected_file, sheet_name='(2-2) 재직자 명부', header=0)
            df_raw.columns = [str(col).replace('\n', ' ').strip() for col in df_raw.columns]

            self.log("🔒 개인정보 비식별화 처리 중...")
            df_anon, _ = anonymize(df_raw)

            self.log("🔍 파이썬 규칙 및 사내 규정 대조 중...")
            p_errors = check_rules(df_anon, self.config)

            self.log("🤖 GPT-4o 심층 분석 중 (약 10초 소요)...")
            ai_report = analyze_with_gpt(df_anon, p_errors)

            self.log("💾 결과 엑셀 파일 생성 중...")
            out_path = save_validation_results(self.selected_file, p_errors, ai_report)

            self.log(f"✅ 검증 완료! 파일 저장: {out_path}")
            self.root.after(100, lambda: self.show_step_4(out_path))

        except Exception as e:
            self.log(f"❌ 오류 발생: {str(e)}")
            messagebox.showerror("오력", f"처리 중 오류가 발생했습니다: {e}")

    # (기당 save_step_1, browse_file, log, show_step_4 등 보조 함수는 이전과 유사하게 구현)
    def log(self, msg):
        self.log_area.insert(END, f" {msg}\n")
        self.log_area.see(END)

    def clear_frame(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    def browse_file(self):
        filename = filedialog.askopenfilename(filetypes=[("Excel files", "*.xlsx")])
        if filename:
            self.selected_file = filename
            self.file_label.config(text=os.path.basename(filename), bootstyle=SUCCESS)

    def save_step_1(self):
        try:
            self.config = {'retire_age': int(self.age_entry.get()), 'emp_count': int(self.count_entry.get())}
            self.show_step_2()
        except: messagebox.showwarning("오류", "숫자 형식으로 입력해 주세요.")

    def show_step_4(self, path):
        self.clear_frame()
        ttk.Label(self.container, text="STEP 4. 검증 완료", font=("나눔고딕", 22, "bold"), bootstyle=SUCCESS).pack(pady=50)
        ttk.Label(self.container, text="데이터 분석 및 리포트 생성이 완료되었습니다.", font=("나눔고딕", 11)).pack(pady=10)
        ttk.Button(self.container, text="결과 파일 확인하기 (엑셀 열기)", bootstyle=PRIMARY, command=lambda: os.startfile(path)).pack(pady=20)
        ttk.Button(self.container, text="처음으로 돌아가기", bootstyle="outline-secondary", command=self.show_step_1).pack(pady=10)

if __name__ == "__main__":
    app = ModernWikiApp()
    app.root.mainloop()