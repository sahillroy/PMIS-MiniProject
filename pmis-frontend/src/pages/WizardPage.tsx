import React from 'react';
import { useProfileStore } from '../store/profileStore';
import { ArrowLeft } from 'lucide-react';
import Step1Education from '../components/wizard/Step1Education';
import Step2Skills from '../components/wizard/Step2Skills';
import Step3Sector from '../components/wizard/Step3Sector';
import Step4Location from '../components/wizard/Step4Location';

interface Props {
  onFinish: () => void;
  onExit: () => void;
}

const WizardPage: React.FC<Props> = ({ onFinish, onExit }) => {
  const { currentStep, prevStep } = useProfileStore();

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      onExit();
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Education />;
      case 2: return <Step2Skills />;
      case 3: return <Step3Sector />;
      case 4: return <Step4Location onFinish={onFinish} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-xl overflow-hidden font-sans">
      {/* Header & Progress */}
      <div className="bg-white px-6 pt-8 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition touch-manipulation min-h-[44px] min-w-[44px] flex justify-center items-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Step {currentStep} of 4
          </span>
          
          <div className="w-[44px] h-[44px]"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-1.5 w-full" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step} 
              aria-current={step === currentStep ? "step" : undefined}
              className={`h-2 flex-1 rounded-full transition-colors ${
                step <= currentStep ? 'bg-primary-blue' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
        {renderStep()}
      </div>
    </div>
  );
};

export default WizardPage;
