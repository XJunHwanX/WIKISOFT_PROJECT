// 사원 수, 정년나이 입력 받은 값을 사용하기 위함.
import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Input } from './ui/input'; // [추가] 사원 수 입력을 위한 인풋
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileText, ArrowLeft, ArrowRight } from 'lucide-react';

interface InfoInputStepProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function InfoInputStep({ onSubmit, onBack }: InfoInputStepProps) {
  const [formData, setFormData] = useState<any>({
    empCount: '', // [추가] 백엔드 전송용 사원 수
    question1: '', question2: '만 60세', question3: '', question4: '',
    question5: '', question6: '', question7: '', question8: '',
    question9: '', question10: '', question11: '', question12: '',
    question13: '', question14: '',
  });

  const questions = [
    { id: 'question1', label: '1. 사외직팀자산', question: '회계 장부 반영 금액과 일치합니까?', type: 'yesno' },
    { id: 'question2', label: '2. 정년', question: '정년은 만 몇 세 입니까?', type: 'age' },
    { id: 'question3', label: '3. 입금피크제', question: '입금피크제 미적용 기업임니까?', type: 'yesno' },
    { id: 'question4', label: '4. 기타장기종업원급여', question: '기타장기종업원급여 미적용 기업임니까?', type: 'yesno' },
    { id: 'question5', label: '5. 퇴직금제도', question: '퇴직금제도는 발령제를 적용합니까?', type: 'yesno' },
    { id: 'question6', label: '6. 운용폰/호봉제', question: '호봉기준에 따른 호봉 미적용 기업임니까?', type: 'yesno' },
    { id: 'question7', label: '7. 재직일자', question: '합의후 산출기준 관련 회사계산A 적용 기업임니까?', type: 'yesno' },
    { id: 'question8', label: '8. 1년 미만 재직자', question: '1년 미만 재직자도 기재 하셨습니까?', type: 'yesno' },
    { id: 'question9', label: '9. 퇴직금 추계액', question: '모든 재직자의 당년도, 차년도 퇴직금 추계액을 입력하셨습니까? (1년 미만 재직자의 경우 일할 계산)', type: 'yesno' },
    { id: 'question10', label: '10. 기준급여', question: '3개월 미만 재직자의 경우 합법 근무 시 지급받는 급여로 기재 하셨습니까?', type: 'yesno' },
    { id: 'question11', label: '11. 평가기준일 퇴사자', question: '평가기준일 발생 퇴직금을 비용(미지급 포함) 처리 하셨습니까?', type: 'yesno' },
    { id: 'question12', label: '12. 평가기준일 퇴사자', question: '재직자명부에서 평가기준일 퇴사자 제외 하셨습니까?', type: 'yesno' },
    { id: 'question13', label: '13. 중간정산 대상자', question: '근로법 시행령 제3조에(퇴직금 중간정산 사유)에 해당합니까?', type: 'yesno' },
    { id: 'question14', label: '14. 평가기준일 퇴사자', question: '퇴직자명부에 평가기준일 퇴사자를 포함하셨습니까?', type: 'yesno' },
  ];

  const handleChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // [중요] 백엔드 형식에 맞게 데이터 변환
    const processedData = {
      ...formData,
      // "만 60세" 문자열에서 숫자만 추출하여 저장
      retireAge: parseInt(formData.question2.replace(/[^0-9]/g, "")) || 60,
      empCount: parseInt(formData.empCount) || 0
    };

    onSubmit(processedData);
  };

  return (
    <Card className="p-8 bg-white shadow-xl border-none">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">기초 정보 입력</h2>
          <p className="text-sm text-gray-500">정확한 AI 검증을 위해 정보를 입력해주세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* [추가] 백엔드 필수 정보: 사원 수 입력 섹션 */}
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <Label className="text-blue-900 font-bold mb-2 block">검증 대상 사원 수</Label>
          <p className="text-xs text-blue-600 mb-3">엑셀 명부에 기재된 총 인원을 입력하세요.</p>
          <Input 
            type="number" 
            placeholder="예: 120"
            value={formData.empCount}
            onChange={(e) => handleChange('empCount', e.target.value)}
            className="bg-white border-blue-200"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <Label className="text-gray-900 font-bold">{question.label}</Label>
              <p className="text-sm text-gray-600">{question.question}</p>
              
              {question.type === 'yesno' ? (
                <div className="flex gap-3">
                  {['예', '아니오'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange(question.id, opt)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                        formData[question.id] === opt
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Select
                  value={formData[question.id]}
                  onValueChange={(value) => handleChange(question.id, value)}
                >
                  <SelectTrigger className="bg-white h-12 rounded-xl">
                    <SelectValue placeholder="나이 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 55).map((age) => (
                      <SelectItem key={age} value={`만 ${age}세`}>만 {age}세</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="ghost" onClick={onBack} className="text-gray-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> 이전 단계
          </Button>
          <Button type="submit" size="lg" className="px-10 bg-blue-600 hover:bg-blue-700 font-bold py-6 rounded-xl">
            다음 단계 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Card>
  );
}