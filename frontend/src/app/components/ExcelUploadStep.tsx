// 엑셀 파일 확보-> 전달
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Upload, FileSpreadsheet, X, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface ExcelUploadStepProps {
  onFileUpload: (file: File) => void;
  onBack: () => void;
}

export function ExcelUploadStep({ onFileUpload, onBack }: ExcelUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 드래그 이벤트 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  // 파일 드롭 핸들러
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // 엑셀 파일 확장자 검증 로직
  const validateAndSetFile = (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      setSelectedFile(file);
    } else {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileUpload(selectedFile); // App.tsx의 setUploadedFile로 전달
    }
  };

  return (
    <Card className="p-8 bg-white shadow-xl border-none rounded-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
          <Upload className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">엑셀 파일 업로드</h2>
          <p className="text-sm text-gray-500">검증할 퇴직금 명부 파일을 드래그하여 놓으세요</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 파일 업로드 영역 */}
        <div
          className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-white'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-md border border-gray-100">
                <FileSpreadsheet className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  파일을 여기에 드롭하거나{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4"
                  >
                    찾아보기
                  </button>
                </p>
                <p className="text-sm text-gray-400 mt-2">최대 용량 50MB (xlsx, xls 지원)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • 업로드 준비 완료
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                className="rounded-full px-6 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <X className="w-4 h-4 mr-2" /> 파일 취소
              </Button>
            </div>
          )}
        </div>

        {/* 안내 문구 */}
        {selectedFile && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3 animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-700 leading-relaxed">
              <strong>업로드 성공!</strong> 다음 단계로 이동하면 AI가 명부의 모든 행을 분석하여 
              오류(정년 불일치, 계산 오류 등)를 자동으로 찾아냅니다.
            </p>
          </div>
        )}

        {/* 하단 버튼부 */}
        <div className="flex justify-between items-center pt-6">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onBack} 
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 이전으로
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile}
            className={`px-10 py-7 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              selectedFile ? 'bg-blue-600 hover:bg-blue-700 scale-105' : 'bg-gray-200'
            }`}
          >
            AI 분석 시작하기 <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}