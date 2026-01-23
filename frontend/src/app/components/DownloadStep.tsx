// frontend/src/components/DownloadStep.tsx
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Download,
  FileSpreadsheet,
  Mail,
  RotateCcw,
  FileText,
  Package
} from 'lucide-react';

interface DownloadStepProps {
  file: File | null;
  formData: any;
  result: any; // 백엔드에서 받은 분석 결과 데이터
  onBack: () => void;
}

export function DownloadStep({ file, formData, result, onBack }: DownloadStepProps) {
  /**
   * ✅ 백엔드 응답 형태가 2가지일 수 있음
   * 1) setAnalysisResult(result.data ?? result) 때문에 result가 data만 들어오거나
   * 2) {status, data:{...}} 통째로 들어올 수 있음
   *
   * 그래서 result.data가 있으면 data를 우선 사용하고,
   * 없으면 result 자체를 사용하도록 정규화합니다.
   */
  const normalized = result?.data ?? result ?? {};

  // ✅ 다운로드 URL 키 통합 (과거 키(file_url)도 대비)
  const downloadUrl: string | null =
    normalized?.download_url ||
    normalized?.file_url ||
    null;

  // ✅ 리포트/카운트
  const aiReport: string = normalized?.ai_report ?? '';
  const errorCount: number | null =
    typeof normalized?.error_count === 'number' ? normalized.error_count : null;

  const totalCount: number | null =
    typeof normalized?.total_count === 'number' ? normalized.total_count : null;

  // ✅ zip 여부 (xls 처리 시 zip로 내려주는 경우)
  const isZip = (downloadUrl || '').toLowerCase().endsWith('.zip');

  // ✅ 표시용 파일명
  const baseName = (file?.name || 'result').replace(/\.[^/.]+$/, '');
  const displayFilename = isZip
    ? `${baseName}_검증결과.zip`
    : `${baseName}_검증완료.xlsx`;

  // ✅ 다운로드
  const handleDownload = () => {
    if (!downloadUrl) {
      alert('다운로드 경로를 찾을 수 없습니다. (백엔드 응답에 download_url이 없음)');
      return;
    }
    window.location.href = downloadUrl;
  };

  const handleEmailSend = () => {
    alert('이메일 전송 기능은 Firebase 연동 후 활성화됩니다.');
  };

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
          <p className="text-sm text-gray-500">AI가 생성한 결과 파일을 확인하세요</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ✅ .xls 처리 안내 (zip) */}
        {isZip && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 leading-relaxed">
              <div className="font-bold">.xls 업로드 감지</div>
              <div>
                .xls는 원본 서식 유지/셀 하이라이트 적용에 제한이 있어,
                <strong> 원본(.xls) + 오류리포트(.xlsx)</strong>가 포함된{' '}
                <strong>압축파일(zip)</strong>로 다운로드됩니다.
              </div>
            </div>
          </div>
        )}

        {/* ✅ AI 분석 보고서 */}
        <Card className="p-6 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-800">AI 분석 리포트 요약</h3>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {aiReport || '분석 리포트가 비어있습니다.'}
          </div>

          {(totalCount !== null || errorCount !== null) && (
            <div className="mt-4 text-xs text-slate-500">
              {totalCount !== null && <span>총 {totalCount}건</span>}
              {totalCount !== null && errorCount !== null && <span> · </span>}
              {errorCount !== null && <span>오류 {errorCount}건</span>}
            </div>
          )}
        </Card>

        {/* ✅ 파일 정보 카드 */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{displayFilename}</p>
              <p className="text-sm text-green-700 font-medium mt-1">
                {isZip
                  ? '원본(xls) + 오류리포트(xlsx) 포함'
                  : '오류 셀 하이라이트 + 오류리포트 시트 포함'}
              </p>
            </div>
          </div>
        </Card>

        {/* ✅ 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleDownload}
            className="py-8 bg-blue-600 hover:bg-blue-700 text-lg font-bold"
            size="lg"
            disabled={!downloadUrl}
          >
            <Download className="w-5 h-5 mr-2" /> 파일 다운로드
          </Button>

          <Button
            onClick={handleEmailSend}
            variant="outline"
            className="py-8 border-slate-200 text-lg font-bold"
            size="lg"
          >
            <Mail className="w-5 h-5 mr-2" /> 이메일 전송
          </Button>
        </div>

        {/* ✅ 작업 요약 */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">작업 요약</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-gray-500">검증된 사원 수</span>
            <span className="text-right font-semibold">{formData?.empCount || '-' }명</span>

            <span className="text-gray-500">적용된 정년 나이</span>
            <span className="text-right font-semibold">만 {formData?.retireAge || '-'}세</span>

            <span className="text-gray-500">검증 완료 일시</span>
            <span className="text-right font-semibold">{new Date().toLocaleString('ko-KR')}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleStartOver}
          className="w-full text-gray-400 hover:text-gray-600 mt-4"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> 처음부터 다시 시작하기
        </Button>
      </div>
    </Card>
  );
}
