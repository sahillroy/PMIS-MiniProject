import { useState } from 'react';
import axios from 'axios';
import { api } from '../../api/client';
import { useProfileStore } from '../../store/profileStore';
import type { Recommendation } from '../../types';
import MatchBreakdown from './MatchBreakdown';
import SkillChart from './SkillChart';
import { Bookmark, MapPin, IndianRupee, GraduationCap, Users, Info, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBookmarkStore } from '../../store/bookmarkStore';

interface Props {
  data: Recommendation;
  index?: number;
  compareMode?: boolean;
  isSelected?: boolean;
  canSelectMore?: boolean;
  onSelectToggle?: () => void;
}

export default function RecommendationCard({ data, index, compareMode, isSelected, canSelectMore, onSelectToggle }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Feedback State
  const candidateId = data.internship_id; // Fix: use internship_id as reference
  const incrementSessionFeedbackCount = useProfileStore(state => state.incrementSessionFeedbackCount);
  const [feedbackState, setFeedbackState] = useState<'none' | 'loading' | 'success' | 'done'>('none');
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);

  // Bookmark State
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const bookmarked = isBookmarked(data.internship_id);
  
  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(data.internship_id);
    } else {
      addBookmark(data);
    }
  };

  const matchPercent = data.match_percentage;
  const badgeColor = matchPercent >= 75 ? 'text-success-green border-success-green bg-green-50' : matchPercent >= 50 ? 'text-amber-600 border-amber-600 bg-amber-50' : 'text-gray-500 border-gray-400 bg-gray-50';

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/v1/apply/', {
        candidate_id: candidateId, 
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

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedbackState('loading');
    setFeedbackType(type);
    try {
      await api.submitFeedback(candidateId, data.internship_id, type);
      incrementSessionFeedbackCount();
      setFeedbackState('success');
      setTimeout(() => {
        setFeedbackState('done');
      }, 2000);
    } catch (e) {
      console.error(e);
      setFeedbackState('none');
      setFeedbackType(null);
    }
  };

  const R = data.reasons;
  const hasAffirmative = R?.affirmative_action && R.affirmative_action.total_boost > 0;
  
  let borderClass = 'border-gray-200';
  if (feedbackState === 'success' || feedbackState === 'done') {
    if (feedbackType === 'positive') borderClass = 'border-success-green border-2 shadow-sm shadow-green-100';
    else if (feedbackType === 'negative') borderClass = 'border-red-400 border-2 shadow-sm shadow-red-100';
  }

  // Calculate animation delay for staggered entrance
  const animationDelay = index ? `${index * 100}ms` : '0ms';

  return (
    <div 
      className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl transition duration-300 relative overflow-hidden group motion-safe:animate-scale-in text-left focus-within:ring-2 focus-within:ring-primary-blue ${borderClass}`}
      style={{ animationDelay }}
    >
      <div className="p-5">
        {/* Header Block */}
        <div className="flex justify-between items-start mb-4 gap-2">
          {compareMode && (
             <div className="mt-1 mr-1 shrink-0">
               <input 
                 type="checkbox" 
                 checked={isSelected}
                 onChange={onSelectToggle}
                 disabled={!isSelected && !canSelectMore}
                 aria-label="Select for comparison"
                 className="w-5 h-5 rounded border-gray-300 text-primary-blue focus:ring-primary-blue cursor-pointer"
               />
             </div>
          )}
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-blue-50 text-primary-blue text-xs font-bold rounded-full mb-2 border border-blue-100">
              {data.sector}
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-tight pr-2">{data.company}</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">{data.role}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
               <button 
                 onClick={toggleBookmark}
                 className={`p-1.5 rounded-full transition flex items-center justify-center min-h-[44px] min-w-[44px] ${bookmarked ? 'text-primary-blue bg-blue-50' : 'text-gray-400 bg-gray-50 hover:text-gray-600 focus:ring-2 focus:ring-primary-blue'}`}
                 aria-label={bookmarked ? "Remove bookmark" : "Bookmark this internship"}
               >
                 <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
               </button>
               
               {/* Match Percentage Badge */}
               <button 
                 onClick={() => setShowModal(true)}
                 aria-label={`Match breakdown: ${matchPercent}% match`}
                 className={`w-14 h-14 rounded-full border-4 flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue shrink-0 ${badgeColor}`}
               >
                 <div className="text-center mt-0.5">
                   <span className="block text-lg font-black leading-none">{matchPercent}</span>
                   <span className="block text-[8px] font-bold uppercase tracking-wide opacity-80 mt-0.5">%</span>
                 </div>
               </button>
            </div>
            
            {/* Phase 3 Slot 2: Confidence Area */}
            {data.confidence && (
              <div 
                className="mt-1.5 flex flex-col items-end cursor-pointer group/conf relative"
                title={data.confidence.confidence_note}
              >
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${(data.confidence.confidence_upper - data.confidence.confidence_lower) <= 10 ? 'bg-success-green' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-bold text-gray-500 tracking-tight">
                    {data.confidence.confidence_lower}-{data.confidence.confidence_upper}% {t('match_range_label') || 'range'}
                  </span>
                </div>
              </div>
            )}
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
            {data.min_stipend_met && <span aria-label="Meets your minimum" title="Meets your minimum"><CheckCircle2 className="w-3.5 h-3.5 text-success-green min-w-3.5" /></span>}
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

        {/* Expand/Collapse Matches section */}
        <div className="mt-4 border-t border-gray-100 pt-3">
          <button 
            type="button"
            className="flex items-center justify-between w-full text-left py-1 text-sm font-bold text-gray-700 hover:text-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue rounded"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            <span>{t('why_this_match')}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expanded && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                {R.skill_match && <SkillChart 
                   data={R.skill_match} 
                   matched={R.skill_match.matched_skills || []} 
                   missing={R.skill_match.missing_skills || []} 
                />}
                
                {R.location_match && R.location_match.score >= 0.8 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-green shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 flex-1 leading-snug">Location: {R.location_match.reason}</span>
                    <div className="w-12 h-1.5 ml-auto bg-success-green rounded-full shadow-inner opacity-80" />
                  </div>
                )}
                {data.stipend_warning && (
                  <div className="flex items-start gap-2 pt-1 bg-amber-50 p-2 rounded-lg border border-amber-100 mt-2">
                     <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                     <span className="text-xs font-medium text-amber-800 leading-snug">
                       {data.stipend_warning}
                     </span>
                  </div>
                )}
                
                {hasAffirmative && R.affirmative_action && (
                  <div className="relative group/tooltip">
                    <button 
                      type="button"
                      aria-label="Diversity boost breakdown"
                      className="flex items-center justify-between w-full mt-2 py-2.5 px-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] text-left hover:bg-indigo-100 transition min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-bold text-indigo-700 leading-tight flex-1">
                           ↑ Diversity boost: +{Number(R.affirmative_action.total_boost * 100).toFixed(0)}%
                        </span>
                      </div>
                    </button>
                    {/* CSS Popover */}
                    <div className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-gray-200 shadow-lg rounded-xl p-3 z-50 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:visible transition-all duration-200">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Boost Breakdown</h4>
                      <div className="space-y-1.5">
                        {R.affirmative_action.affirmative_boosts_applied.map((b, i) => (
                           <div key={i} className="flex justify-between text-xs font-semibold text-gray-700">
                             <span>{b.reason}</span>
                             <span className="text-success-green">+{Number(b.boost * 100).toFixed(0)}%</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
          className={`w-full min-h-[52px] rounded-xl font-bold text-sm transition flex justify-center items-center gap-2 mb-3 ${
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

        {/* Feedback Section */}
        {feedbackState !== 'done' && (
          <div className="border-t border-gray-200/60 pt-3">
            {feedbackState === 'none' && (
              <div className="flex flex-col animate-in fade-in">
                <span className="text-xs font-bold text-gray-500 mb-2 text-center">
                  {t('feedbackQuestion') || 'Was this a good match?'}
                </span>
                 <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleFeedback('positive')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-gray-200 rounded-lg text-xs font-bold transition min-h-[44px]"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {t('goodMatch') || 'Yes, good match'}
                  </button>
                  <button 
                    onClick={() => handleFeedback('negative')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200 rounded-lg text-xs font-bold transition min-h-[44px]"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    {t('notForMe') || 'Not for me'}
                  </button>
                </div>
              </div>
            )}
            
            {feedbackState === 'loading' && (
              <div className="flex items-center justify-center py-2 animate-in fade-in">
                 <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {feedbackState === 'success' && (
              <div className="flex items-center justify-center gap-2 py-2 animate-in fade-in slide-in-from-bottom-1">
                 <CheckCircle2 className="w-4 h-4 text-success-green" />
                 <span className="text-xs font-bold text-gray-600">
                   {t('feedbackThanks') || 'Improving your recommendations...'}
                 </span>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <MatchBreakdown data={data} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
