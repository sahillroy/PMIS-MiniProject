import React, { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';

const EDUCATION_LEVELS = ['10th Pass', '12th Pass', 'ITI', 'Diploma', 'Graduate'];
const FIELDS = ['Engineering', 'Commerce', 'Arts', 'Science', 'Computer Science', 'Management', 'Medical', 'Other'];

export default function Step1Education() {
  const { education_level, field_of_study, cgpa, setField, nextStep } = useProfileStore();
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!education_level) {
      setError('Please select an education level to continue.');
      return;
    }
    setError('');
    nextStep();
  };

  const isNextDisabled = !education_level;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">What is your education level?</h2>
      
      <div className="flex flex-col gap-3 mb-8">
        {EDUCATION_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setField('education_level', level)}
            className={`min-h-[56px] px-4 rounded-xl border-2 text-left text-lg font-medium transition flex items-center justify-between ${
              education_level === level 
                ? 'border-primary-blue bg-blue-50 text-primary-blue shadow-sm' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
            }`}
          >
            {level}
            {education_level === level && (
              <div className="w-5 h-5 rounded-full bg-primary-blue flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {education_level && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-3">What did you study?</h3>
          <select 
            value={field_of_study}
            onChange={(e) => setField('field_of_study', e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-lg mb-4 outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
          >
            <option value="" disabled>Select your field</option>
            {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">CGPA or Percentage (optional)</h3>
          <input 
            type="number"
            placeholder="e.g. 75 or 7.5"
            value={cgpa}
            onChange={(e) => setField('cgpa', e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-lg outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100">
        <button 
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`w-full min-h-[56px] rounded-xl font-bold text-lg text-white transition shadow-md flex items-center justify-center ${
            !isNextDisabled ? 'bg-primary-blue hover:bg-blue-900' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
