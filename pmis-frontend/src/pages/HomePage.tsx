import React from 'react';
import { Briefcase, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  onStart: () => void;
  onDemo: () => void;
}

const HomePage: React.FC<Props> = ({ onStart, onDemo }) => {
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between max-w-md mx-auto relative shadow-xl overflow-hidden">
      {/* Header / Top Section */}
      <div className="px-6 pt-8 pb-6 text-center">
        <button 
          onClick={toggleLanguage}
          aria-label="Toggle language"
          className="absolute top-4 right-4 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold px-3 py-1.5 rounded-full text-sm z-20 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-blue min-h-[44px] min-w-[44px]"
        >
          {i18n.language === 'en' ? 'हिं' : 'EN'}
        </button>
        
        <div className="w-20 h-20 bg-primary-blue rounded-full mx-auto flex items-center justify-center shadow-md mb-6 mt-4">
          <Briefcase className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          PM Internship Scheme
        </h1>
        
        <p className="text-gray-600 text-base leading-relaxed mb-6 px-2">
          Discover government-certified internships tailored to your education, location, and skills. Step-by-step guidance in your preferred language.
        </p>

        {/* How it Works / Stats section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 text-left">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2">Phase 1 Bottleneck</h2>
          <p className="text-xs text-gray-500 font-medium mb-4 leading-relaxed">
            <span className="block mb-1 sm:inline">
              <strong className="text-gray-800">621K applications → 127K opportunities → only 8.7K joined (10.6%).</strong>
            </span>
            With AI matching and localized accessibility, we target a <strong className="text-primary-blue">35-40% conversion rate</strong>.
          </p>
          
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 pt-2 border-t border-gray-100">How it works</h2>
          <ul className="space-y-3">
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-blue-50 text-primary-blue flex justify-center items-center text-xs font-bold shrink-0">1</div>
               <p className="text-xs text-gray-600 font-medium mt-0.5">Tell us your background and rural locality restrictions.</p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-blue-50 text-primary-blue flex justify-center items-center text-xs font-bold shrink-0">2</div>
               <p className="text-xs text-gray-600 font-medium mt-0.5">Select targeted skills securely via visual mapping.</p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-blue-50 text-primary-blue flex justify-center items-center text-xs font-bold shrink-0">3</div>
               <p className="text-xs text-gray-600 font-medium mt-0.5">Let AI securely map gaps and apply diversity priority matching.</p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-blue-50 text-primary-blue flex justify-center items-center text-xs font-bold shrink-0">4</div>
               <p className="text-xs text-gray-600 font-medium mt-0.5">Apply 1-click matching straight to central capacity systems.</p>
             </li>
          </ul>
        </div>
      </div>

      {/* Footer / CTA Section */}
      <div className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <div className="space-y-3 mb-4">
          <button 
            onClick={onStart}
            aria-label={t('find_internship')}
            className="w-full bg-primary-blue hover:bg-blue-900 active:bg-blue-950 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition flex justify-center items-center gap-2 group min-h-[44px]"
          >
            <span>{t('find_internship')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onDemo}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl border border-gray-200 transition text-sm min-h-[44px]"
          >
            Try Demo (No Sign-up)
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-4">
          A platform for youth upskilling and affirmative action.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
