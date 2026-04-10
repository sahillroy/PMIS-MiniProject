import React from 'react';
import { Briefcase, ArrowRight } from 'lucide-react';

interface Props {
  onStart: () => void;
}

const HomePage: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between max-w-md mx-auto relative shadow-xl overflow-hidden">
      {/* Header / Top Section */}
      <div className="px-6 pt-12 pb-6 text-center">
        <div className="w-20 h-20 bg-primary-blue rounded-full mx-auto flex items-center justify-center shadow-md mb-6">
          <Briefcase className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          PM Internship Scheme
        </h1>
        
        <p className="text-gray-600 text-base leading-relaxed mb-6 px-2">
          Discover government-certified internships tailored to your education, location, and skills. Step-by-step guidance in your preferred language.
        </p>

        {/* Stats Row */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Live Insights</h2>
          <div className="flex justify-between text-center divide-x divide-gray-100">
            <div className="px-2">
              <span className="block text-xl font-bold text-primary-blue">1.18 L</span>
              <span className="block text-xs text-gray-500 mt-1">Opportunities</span>
            </div>
            <div className="px-2">
              <span className="block text-xl font-bold text-primary-blue">24</span>
              <span className="block text-xs text-gray-500 mt-1">Sectors</span>
            </div>
            <div className="px-2">
              <span className="block text-xl font-bold text-primary-blue">735</span>
              <span className="block text-xs text-gray-500 mt-1">Districts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / CTA Section */}
      <div className="px-6 pb-12 pt-4 bg-white border-t border-gray-100">
        <button 
          onClick={onStart}
          className="w-full bg-primary-blue hover:bg-blue-900 active:bg-blue-950 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition flex justify-center items-center gap-2 group min-h-[44px]"
        >
          <span>Find My Internship</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-xs text-center text-gray-400 mt-4">
          A platform for youth upskilling and affirmative action.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
