// 결과 파일 다운로드 링크 연결
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, FileSpreadsheet, CheckCircle, Mail, RotateCcw, FileText } from 'lucide-react';

interface DownloadStepProps {
  file: File | null;
  formData: any;
  result: any; // [추가] 백엔드에서 받은 분석 결과 데이터
  onBack: () => void;
}

export function DownloadStep({ file, formData, result, onBack }: DownloadStepProps) {
  
  // [수정] 실제 백엔드 다운로드 API 호출
  const handleDownload = () => {
    if (!result?.file_url) {
      alert("다운로드 경로를 찾을 수 없습니다.");
      return;
    }
    window.location.href = result.file_url;
  };

  const handleEmailSend = () => { alert('이메일 전송 기능은 Firebase 연동 후 활성화됩니다.'); };

  const handleStartOver = () => {
    if (window.confirm('모든 데이터를 초기화하고 처음으로 돌아갈까요?')) {
      window.location.reload();
    }
  };

  return (
    <Card className="p-8 bg-white shadow-xl border-none">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Download className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">검증 완료 및 다운로드</h2>
          <p className="text-sm text-gray-500">AI가 수정한 최종 결과 파일을 확인하세요</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* AI 분석 보고서 요약 (추가 제안) */}
        <Card className="p-6 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-slate-800">AI 분석 리포트 요약</h3>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {result?.ai_report || "분석 리포트를 불러오는 중입니다..."}
            </div>
        </Card>

        {/* 파일 정보 카드 */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileSpreadsheet className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {file?.name.replace(/\.[^/.]+$/, "")}_검증완료.xlsx
                </p>
                <p className="text-sm text-green-700 font-medium mt-1">AI 검출 오류 하이라이트 적용됨</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 다운로드 및 이메일 버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={handleDownload} className="py-8 bg-blue-600 hover:bg-blue-700 text-lg font-bold" size="lg">
            <Download className="w-5 h-5 mr-2" /> 파일 다운로드
          </Button>
          <Button onClick={handleEmailSend} variant="outline" className="py-8 border-slate-200 text-lg font-bold" size="lg">
            <Mail className="w-5 h-5 mr-2" /> 이메일 전송
          </Button>
        </div>

        {/* 검증 정보 요약 */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">작업 요약</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-gray-500">검증된 사원 수</span>
            <span className="text-right font-semibold">{formData.empCount || '-'}명</span>
            <span className="text-gray-500">적용된 정년 나이</span>
            <span className="text-right font-semibold">만 {formData.retireAge || '-'}세</span>
            <span className="text-gray-500">검증 완료 일시</span>
            <span className="text-right font-semibold">{new Date().toLocaleString('ko-KR')}</span>
          </div>
        </div>

        <Button variant="ghost" onClick={handleStartOver} className="w-full text-gray-400 hover:text-gray-600 mt-4">
          <RotateCcw className="w-4 h-4 mr-2" /> 처음부터 다시 시작하기
        </Button>
      </div>
    </Card>
  );
}