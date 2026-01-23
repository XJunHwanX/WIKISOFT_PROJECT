import { useState } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { InfoInputStep } from './components/InfoInputStep';
import { ExcelUploadStep } from './components/ExcelUploadStep';
import { AIVerificationStep } from './components/AIVerificationStep';
import { DownloadStep } from './components/DownloadStep';

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // [추가] 분석 결과를 저장할 상태 (백엔드에서 받은 데이터 저장용)
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const steps = [
    { number: 1, title: '정보 입력', description: '기초 진단 질문 답변' },
    { number: 2, title: '엑셀 첨부', description: 'Excel 명부 파일 업로드' },
    { number: 3, title: 'AI 검증', description: '자동 명부 검증 및 오류 검출' },
    { number: 4, title: '결과 다운로드', description: '검증된 Excel 파일 다운로드' },
  ];

  const handleNextStep = () => { if (currentStep < 4) setCurrentStep(currentStep + 1); };
  const handlePrevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    handleNextStep();
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    handleNextStep();
  };

// frontend/src/app/App.tsx 내부 triggerAnalysis 함수 수정
const triggerAnalysis = async () => {
  if (!uploadedFile) return;

  const body = new FormData();
  body.append("file", uploadedFile);
  
  // [중요] JSON 문자열 형식이 아닌, 개별 필드로 데이터를 보냅니다.
  body.append("retire_age", formData.retireAge || "60");
  body.append("emp_count", formData.empCount || "0");

  try {
    // 모든 주소를 127.0.0.1로 통일하여 DNS 문제를 방지합니다.
    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      body: body,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 응답 에러: ${response.status}`);
    }

    const result = await response.json(); 
    setAnalysisResult(result.data);
    return result; // status 체크를 위해 전체 응답을 반환합니다.

  } catch (error) {
    console.error("분석 중 오류 발생:", error);
    throw error;
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">WIKISOFT</h1>
          <p className="text-sm text-gray-500 mt-1">퇴직급여채무 명부관리체계 AI 자동검증</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {currentStep > 0 && <StepIndicator steps={steps} currentStep={currentStep} />}

        <div className={currentStep > 0 ? "mt-12" : ""}>
          {currentStep === 0 && <WelcomeScreen onStart={handleNextStep} />}
          {currentStep === 1 && <InfoInputStep onSubmit={handleFormSubmit} onBack={handlePrevStep} />}
          {currentStep === 2 && (
            <ExcelUploadStep onFileUpload={handleFileUpload} onBack={handlePrevStep} />
          )}
          {currentStep === 3 && (
            <AIVerificationStep 
              file={uploadedFile}           // [에러 해결] 빠졌던 file 속성 추가
              onStartAnalysis={triggerAnalysis}  // API 호출 함수 전달
              onComplete={handleNextStep} 
              onBack={handlePrevStep} 
            />
          )}
          {currentStep === 4 && (
            <DownloadStep 
              file={uploadedFile}           // [에러 해결] 빠졌던 file 속성 추가
              formData={formData}            
              result={analysisResult} // 분석 결과 데이터 전달
              onBack={handlePrevStep} 
            />
          )}
        </div>
      </div>
    </div>
  );
}