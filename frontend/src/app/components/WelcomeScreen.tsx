import { Button } from './ui/button';
import { Card } from './ui/card';
import { FileSpreadsheet, Sparkles, CheckCircle, Download, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden py-20 px-12">
          {/* Neural Network Background Pattern */}
          <svg className="absolute right-20 top-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-10" viewBox="0 0 400 400">
            {/* Brain-like network pattern */}
            <g stroke="#000000" strokeWidth="1" fill="none">
              {/* Nodes */}
              <circle cx="100" cy="100" r="20" />
              <circle cx="200" cy="80" r="25" />
              <circle cx="300" cy="120" r="20" />
              <circle cx="150" cy="200" r="30" />
              <circle cx="250" cy="220" r="25" />
              <circle cx="180" cy="320" r="20" />
              <circle cx="120" cy="280" r="15" />
              <circle cx="280" cy="300" r="20" />
              <circle cx="320" cy="200" r="15" />
              
              {/* Connections */}
              <line x1="100" y1="100" x2="200" y2="80" />
              <line x1="200" y1="80" x2="300" y2="120" />
              <line x1="100" y1="100" x2="150" y2="200" />
              <line x1="200" y1="80" x2="150" y2="200" />
              <line x1="300" y1="120" x2="250" y2="220" />
              <line x1="150" y1="200" x2="250" y2="220" />
              <line x1="150" y1="200" x2="180" y2="320" />
              <line x1="150" y1="200" x2="120" y2="280" />
              <line x1="250" y1="220" x2="280" y2="300" />
              <line x1="250" y1="220" x2="320" y2="200" />
              <line x1="300" y1="120" x2="320" y2="200" />
              <line x1="180" y1="320" x2="280" y2="300" />
              <line x1="120" y1="280" x2="180" y2="320" />
              
              {/* Additional connecting lines */}
              <line x1="100" y1="100" x2="120" y2="280" />
              <line x1="200" y1="80" x2="250" y2="220" />
              <line x1="280" y1="300" x2="320" y2="200" />
            </g>
          </svg>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Text */}
            <div className="space-y-4">
              <h1 className="text-8xl font-black text-black tracking-tight leading-none">
                WIKISOFT
              </h1>
              <h2 className="text-4xl font-light text-black tracking-wide">
                AI VALIDATION
              </h2>
            </div>

            {/* Right Side - Button */}
            <div className="flex justify-center items-center">
              <Button
                onClick={onStart}
                size="lg"
                className="px-16 py-6 text-xl font-semibold h-auto bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all uppercase tracking-wide rounded-full"
              >
                START
              </Button>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200 shadow-md">
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              AI가 퇴직금 명부를 자동으로 분석하고 검증합니다. <br />
              복잡한 수작업 없이 몇 분 만에 정확한 검증 결과를 받아보세요.
            </p>
          </Card>
        </div>

        {/* Process Title */}
        <div className="text-center pt-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">간편한 4단계 프로세스</h2>
          <p className="text-gray-600">클릭 몇 번으로 완료되는 스마트한 검증</p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-8 bg-white hover:shadow-xl transition-all border-gray-200 relative group">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-center justify-center mx-auto group-hover:border-sky-400 transition-all">
                <FileSpreadsheet className="w-10 h-10 text-sky-600" />
              </div>
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold mx-auto">1</div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">정보 입력</h3>
                <p className="text-sm text-gray-600">14개 검증 항목 입력</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white hover:shadow-xl transition-all border-gray-200 relative group">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-center justify-center mx-auto group-hover:border-sky-400 transition-all">
                <FileSpreadsheet className="w-10 h-10 text-sky-600" />
              </div>
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold mx-auto">2</div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">엑셀 첨부</h3>
                <p className="text-sm text-gray-600">명부 파일 업로드</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white hover:shadow-xl transition-all border-gray-200 relative group">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-center justify-center mx-auto group-hover:border-sky-400 transition-all">
                <Sparkles className="w-10 h-10 text-sky-600" />
              </div>
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold mx-auto">3</div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">AI 검증</h3>
                <p className="text-sm text-gray-600">자동 오류 검출</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white hover:shadow-xl transition-all border-gray-200 relative group">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-center justify-center mx-auto group-hover:border-sky-400 transition-all">
                <Download className="w-10 h-10 text-sky-600" />
              </div>
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold mx-auto">4</div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">결과 다운로드</h3>
                <p className="text-sm text-gray-600">검증 완료 파일 제공</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="text-center space-y-6 pt-4">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>무료 사용</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>실시간 검증</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>상세 오류 보고서</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}