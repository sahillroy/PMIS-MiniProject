import { useEffect, useRef } from 'react';
import type { Recommendation } from '../../types';
import { X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  internships: Recommendation[];
  onClose: () => void;
  onApply: (internshipId: string) => void;
}

export default function ComparePanel({ internships, onClose, onApply }: Props) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (internships.length !== 2) return null;

  const [a, b] = internships;

  // Helpers for comparison highlights
  const higherStipend = Math.max(a.stipend_monthly, b.stipend_monthly);

  const getMissingSkills = (rec: Recommendation) => 
    rec.reasons?.skill_match?.missing_skills || [];
    
  const getMatchedCount = (rec: Recommendation) => {
    const sm = rec.reasons?.skill_match;
    if (!sm) return '0/0';
    const total = (sm.matched_skills?.length || 0) + (sm.missing_skills?.length || 0);
    return `${sm.matched_skills?.length || 0} / ${total}`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center animate-in slide-in-from-bottom-full duration-300">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10" onClick={onClose} aria-hidden="true" />
      
      <div 
        ref={panelRef}
        tabIndex={-1}
        className="bg-white w-full max-w-4xl rounded-t-3xl shadow-2xl overflow-hidden focus:outline-none max-h-[90vh] flex flex-col"
        role="dialog"
        aria-label="Compare Internships"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Compare Internships</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition focus:ring-2 focus:ring-primary-blue"
            aria-label={t('closeCompare') || 'Close comparison'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Headers visible on desktop */}
            <div className="hidden sm:block space-y-4 font-semibold text-gray-500 text-sm py-4">
              <div className="h-16 flex items-center">Company & Role</div>
              <div className="h-14 flex items-center">Match %</div>
              <div className="h-10 flex items-center">Sector</div>
              <div className="h-10 flex items-center">Location</div>
              <div className="h-10 flex items-center">Stipend</div>
              <div className="h-10 flex items-center">Education</div>
              <div className="h-10 flex items-center">Skills Matched</div>
              <div className="h-20 flex items-center">Skills Missing</div>
              <div className="h-10 flex items-center">Affirmative Boost</div>
              <div className="h-10 flex items-center">Slots</div>
            </div>

            {[a, b].map((rec, idx) => {
              const missing = getMissingSkills(rec);
              const conf = rec.confidence;
              const boost = rec.reasons?.affirmative_action?.total_boost || 0;
              
              return (
              <div key={rec.internship_id} className={`space-y-4 py-4 ${idx === 0 ? 'border-b sm:border-b-0 sm:border-r border-gray-100' : ''}`}>
                <div className="h-auto sm:h-16 flex flex-col justify-center">
                  <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Company & Role</span>
                  <h3 className="font-bold text-gray-900 leading-tight">{rec.company}</h3>
                  <p className="text-sm text-gray-600">{rec.role}</p>
                </div>
                
                <div className="h-auto sm:h-14 flex flex-col justify-center">
                  <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Match</span>
                  <div className="flex flex-col">
                    <span className="font-black text-lg">{rec.match_percentage}%</span>
                    {conf && <span className="text-[10px] text-gray-500 font-medium">{conf.confidence_lower}-{conf.confidence_upper}% range</span>}
                  </div>
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                  <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Sector</span>
                  <div><span className="inline-block px-2 py-0.5 bg-blue-50 text-primary-blue text-xs font-bold rounded">{rec.sector}</span></div>
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                  <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Location</span>
                  <span className="text-sm font-medium">{rec.location}</span>
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                  <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Stipend</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${rec.stipend_monthly === higherStipend ? 'text-success-green' : 'text-gray-700'}`}>
                      ₹{rec.stipend_monthly}/mo
                    </span>
                    {rec.min_stipend_met && <CheckCircle2 className="w-3.5 h-3.5 text-success-green" />}
                  </div>
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                   <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Education</span>
                   <div className="flex items-center gap-1 text-sm text-gray-700">
                     <span className="truncate">{rec.reasons?.education_match?.reason || "Graduate"}</span>
                     <CheckCircle2 className="w-3.5 h-3.5 text-success-green shrink-0" />
                   </div>
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                   <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Skills Matched</span>
                   <span className="text-sm font-bold">{getMatchedCount(rec)}</span>
                </div>

                <div className="h-auto sm:h-20 flex flex-col justify-start pt-1 sm:pt-0 sm:justify-center overflow-y-auto">
                   <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Skills Missing</span>
                   {missing.length === 0 ? (
                     <span className="text-sm text-success-green font-medium">None</span>
                   ) : (
                     <div className="flex flex-wrap gap-1">
                       {missing.map((m, i) => (
                         <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800">⚠️ {m}</span>
                       ))}
                     </div>
                   )}
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                   <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Affirmative Boost</span>
                   <span className="text-sm font-medium text-gray-700">{boost > 0 ? `+${(boost * 100).toFixed(0)}%` : '-'}</span>
                </div>

                <div className="h-auto sm:h-10 flex flex-col justify-center">
                   <span className="sm:hidden text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Slots Available</span>
                   <span className="text-sm font-medium text-gray-700">{rec.reasons?.capacity?.slots_available || 1}</span>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => onApply(rec.internship_id)}
                    className="w-full py-2.5 bg-primary-blue text-white font-bold rounded-xl hover:bg-blue-900 transition text-sm"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}
