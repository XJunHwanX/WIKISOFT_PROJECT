import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="relative">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          // ✅ 왼쪽 선(이전 -> 현재): 현재 단계에 도달했으면 파랑 (>=)
          const leftActive = currentStep >= step.number;

          // ✅ 오른쪽 선(현재 -> 다음): 현재 단계를 "완료"했으면 파랑 (>)
          const rightActive = currentStep > step.number;

          return (
            <div key={step.number} className="flex-1">
              <div className="relative flex flex-col items-center">
                {/* ✅ Left Connector (이전 -> 현재) */}
                {index > 0 && (
                  <div
                    className={`absolute top-6 left-0 w-1/2 h-0.5 ${
                      leftActive ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* ✅ Right Connector (현재 -> 다음) */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 w-1/2 h-0.5 ${
                      rightActive ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* Step Circle */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="mt-4 text-center max-w-[160px]">
                    <p
                      className={`font-semibold ${
                        isCurrent
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
