import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Sparkles, CheckCircle, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

interface AIVerificationStepProps {
  file: File | null;
  onStartAnalysis: () => Promise<any>;
  onComplete: () => void;
  onBack: () => void;
}

export function AIVerificationStep({ file, onStartAnalysis, onComplete, onBack }: AIVerificationStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('분석 준비 중...');
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [stats, setStats] = useState({
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    warningRows: 0,
  });

  // frontend/src/components/AIVerificationStep.tsx 내부 수정

// AIVerificationStep.tsx 내부 수정
// AIVerificationStep.tsx 내부 수정
useEffect(() => {
  const runRealVerification = async () => {
    try {
      setCurrentTask('데이터 분석 엔진 가동 중...');
      setProgress(30);

      // [중요] 호출 주소를 127.0.0.1로 명시해 보세요.
      const response = await onStartAnalysis(); 
      console.log("서버 응답 확인:", response);

      // 백엔드가 에러를 보낸 경우 (상태값이 error일 때)
      if (response.status === "error") {
        // 이제 화면에 "data가 없다"는 말 대신 백엔드의 진짜 에러 메시지가 뜹니다.
        throw new Error(response.message || "서버 검증 실패");
      }

      const resultData = response.data; 
      if (resultData) {
        setStats({
          totalRows: resultData.total_count || 0,
          validRows: (resultData.total_count - resultData.error_count) || 0,
          errorRows: resultData.error_count || 0,
          warningRows: 0,
        });
        setProgress(100);
        setCurrentTask('검증 완료!');
        setIsComplete(true);
      }
    } catch (error: any) {
      //console.error("실제 에러 내용:", error);
      setIsError(true);
      // Failed to fetch가 뜬다면 브라우저 콘솔(F12)의 Network 탭을 확인해야 합니다.
      setCurrentTask(error.message || '연결에 실패했습니다.');
    }
  };
  runRealVerification();
}, []);

  return (
    <Card className="p-8 bg-white shadow-xl border-none rounded-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          {isComplete ? (
            <CheckCircle className="w-6 h-6 text-green-600 animate-in zoom-in" />
          ) : isError ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : (
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">AI 명부 검증</h2>
          <p className="text-sm text-gray-500">AI가 퇴직급여 명부의 논리 오류를 실시간 검출합니다</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 파일 정보 */}
        {file && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">{file.name}</span>
          </div>
        )}

        {/* 진행률 바 */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm mb-1">
            <span className={`font-medium ${isError ? 'text-red-500' : 'text-purple-700'}`}>
              {currentTask}
            </span>
            <span className="font-bold text-purple-600">{progress}%</span>
          </div>
          <Progress value={progress} className={`h-3 ${isError ? 'bg-red-100' : ''}`} />
        </div>

        {/* 분석 결과 통계 (완료 시에만 표시) */}
        {isComplete && (
          <div className="grid grid-cols-2 gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-blue-50 rounded-2xl text-center border border-blue-100">
              <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">검증 데이터</p>
              <p className="text-3xl font-black text-blue-900">{stats.totalRows}<span className="text-lg ml-1 font-bold">건</span></p>
            </div>
            <div className="p-6 bg-red-50 rounded-2xl text-center border border-red-100">
              <p className="text-xs text-red-600 font-bold mb-1 uppercase tracking-wider">발견된 오류</p>
              <p className="text-3xl font-black text-red-900">{stats.errorRows}<span className="text-lg ml-1 font-bold">건</span></p>
            </div>
          </div>
        )}

        {/* 에러 발생 시 안내 */}
        {isError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">서버와의 통신이 원활하지 않거나 파일 형식이 잘못되었습니다.</p>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <Button variant="outline" onClick={onBack} disabled={!isComplete && !isError} className="flex-1 py-6 rounded-xl">이전 단계</Button>
          <Button 
            onClick={onComplete} 
            disabled={!isComplete} 
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 rounded-xl shadow-lg transition-all active:scale-95"
          >
            최종 결과 확인하기
          </Button>
        </div>
      </div>
    </Card>
  );
}