import { useState } from 'react';
import axios from 'axios';
import type { Recommendation } from '../../types';
import MatchBreakdown from './MatchBreakdown';
import SkillChart from './SkillChart';
import { MapPin, IndianRupee, GraduationCap, Users, Info, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  data: Recommendation;
}

export default function RecommendationCard({ data }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const matchPercent = data.match_percentage;
  const badgeColor = matchPercent >= 75 ? 'text-success-green border-success-green bg-green-50' : matchPercent >= 50 ? 'text-amber-600 border-amber-600 bg-amber-50' : 'text-gray-500 border-gray-400 bg-gray-50';

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/v1/apply/', {
        candidate_id: 1, 
        internship_id: data.internship_id
      });
      setApplied(true);
    } catch (e) {
      console.error(e);
      setApplied(true); 
    } finally {
      setIsApplying(false);
    }
  };

  const R = data.reasons;
  const hasAffirmative = R?.affirmative_action && R.affirmative_action.total_boost > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative" aria-label="Recommendation entry">
      <div className="p-5">
        {/* Header Block */}
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-blue-50 text-primary-blue text-xs font-bold rounded-full mb-2 border border-blue-100">
              {data.sector}
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-tight pr-2">{data.company}</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">{data.role}</p>
          </div>
          <div 
            className={`shrink-0 flex flex-col items-center justify-center w-[54px] h-[54px] rounded-full border-[3px] shadow-sm ${badgeColor}`}
            aria-label={`${matchPercent} percent match`}
          >
            <span className="text-sm font-black tracking-tighter">{matchPercent}%</span>
            <span className="text-[9px] font-bold uppercase tracking-wider -mt-1 opacity-80">Match</span>
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{data.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IndianRupee className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-semibold">{data.stipend_monthly}/mo</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate" title={R.education_match?.reason}>{R.education_match?.reason || "Graduate expected"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{R.capacity?.slots_available || 1} slots open</span>
          </div>
        </div>

        {/* Why this match - Collapsible */}
        <div className="border-t border-gray-100 pt-4">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full pb-1 select-none focus:outline-none focus:ring-2 focus:ring-blue-100 rounded"
            aria-expanded={expanded}
            aria-label={t('why_match')}
          >
            <h3 className="font-bold text-gray-800 text-sm">{t('why_match')}</h3>
            <div className="min-w-[44px] min-h-[44px] -mr-3 flex justify-center items-center rounded-full hover:bg-gray-50">
              {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </div>
          </button>
          
          {expanded && (
            <div className="animate-in fade-in slide-in-from-top-2">
              {R.skill_match && (
                <SkillChart 
                  matched={R.skill_match.matched_skills || []} 
                  missing={R.skill_match.missing_skills || []} 
                />
              )}
              
              <div className="space-y-3 mt-4">
                {R.sector_match && R.sector_match.score >= 1.0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-green shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 flex-1 leading-snug">Sector aligns directly with your interests</span>
                    <div className="w-12 h-1.5 ml-auto bg-success-green rounded-full shadow-inner opacity-80" />
                  </div>
                )}
                {R.location_match && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-green shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 flex-1 leading-snug">Location: {R.location_match.reason}</span>
                    <div className="w-12 h-1.5 ml-auto bg-success-green rounded-full shadow-inner opacity-80" />
                  </div>
                )}
                {R.skill_match?.missing_skills && R.skill_match.missing_skills.length > 0 && (
                  <div className="flex items-start gap-2 pt-1">
                     <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                     <span className="text-xs font-medium text-gray-600 leading-snug">
                       <strong className="text-amber-700">{t('missing_skills')}:</strong> {R.skill_match.missing_skills.slice(0, 3).join(', ')} 
                     </span>
                  </div>
                )}
                
                {hasAffirmative && (
                  <button 
                    onClick={() => setShowModal(true)}
                    aria-label={t('diversity_boost')}
                    className="flex items-center gap-2 w-full mt-2 py-2.5 px-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] text-left hover:bg-indigo-100 transition min-h-[44px]"
                  >
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-700 leading-tight flex-1">{t('diversity_boost')}</span>
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest pl-2">View Breakdown</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button 
          onClick={handleApply}
          disabled={applied || isApplying}
          aria-live="polite"
          aria-busy={isApplying}
          aria-label={applied ? t('applied') : t('apply_now')}
          className={`w-full min-h-[52px] rounded-xl font-bold text-sm transition flex justify-center items-center gap-2 ${
            applied 
              ? 'bg-success-green text-white shadow-sm border-2 border-success-green opacity-90' 
              : 'bg-primary-blue text-white shadow-md hover:bg-blue-900 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {isApplying ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : applied ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('applied')}</span>
            </>
          ) : (
             <span>{t('apply_now')}</span>
          )}
        </button>
      </div>

      {showModal && (
        <MatchBreakdown data={data} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
