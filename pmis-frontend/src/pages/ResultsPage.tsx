import { useEffect, useState } from 'react';
import { useProfileStore } from '../store/profileStore';
import { useRecommendations } from '../hooks/useRecommendations';
import RecommendationCard from '../components/results/RecommendationCard';
import ComparePanel from '../components/results/ComparePanel';
import CFStatusBanner from '../components/results/CFStatusBanner';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

interface Props {
  onSearchAgain: () => void;
}

const FALLBACK_PROFILE = {
  name: "Demo User",
  education_level: "Graduate",
  field_of_study: "Computer Science", 
  skills: ["Python", "Communication", "MS Office"],
  sector_interests: ["IT/Software", "Finance/Banking"],
  preferred_state: "Maharashtra",
  category: "SC",
  is_rural: true,
  open_to_pan_india: false
};

export default function ResultsPage({ onSearchAgain }: Props) {
  const { t, i18n } = useTranslation();
  
  const profileStore = useProfileStore();
  const activeProfile = profileStore.skills.length > 0 ? profileStore : FALLBACK_PROFILE;
  
  const { recommendations, isLoading, error, fetchRecommendations } = useRecommendations();
  
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(t('analysing'));

  // Compare mode states
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setLoadingText(t('analysing'));
      const t1 = setTimeout(() => { setProgress(40); }, 800);
      const t2 = setTimeout(() => { setProgress(80); }, 1600);
      const t3 = setTimeout(() => { setProgress(100); }, 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setProgress(100);
      setLoadingText("Done");
    }
  }, [isLoading, t]);

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 max-w-md mx-auto shadow-xl relative font-sans">
      <div className="bg-primary-blue px-6 pt-10 pb-12 shadow-md rounded-b-3xl relative overflow-hidden">
        <button 
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
          aria-label="Toggle language"
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white font-bold border border-white/40 px-3 py-1.5 rounded-full text-sm z-20 focus:outline-none focus:ring-2 focus:ring-white min-h-[44px] min-w-[44px]"
        >
          {i18n.language === 'en' ? 'हिं' : 'EN'}
        </button>

        <h1 className="text-2xl font-bold text-white mb-1 relative z-10 mt-2">
          {activeProfile.name ? `${activeProfile.name} - ${t('your_results')}` : t('your_results')}
        </h1>
        
        <div className="flex justify-between items-center relative z-10">
          <p className="text-blue-100 font-medium tracking-wide text-sm">
            {isLoading ? loadingText : (compareMode ? (t('compareBtnLabel')?.replace(/\d+.*$/, 'Select 2') || 'Select 2 to compare') : t('top_matches'))}
          </p>
          {!isLoading && !error && recommendations.length > 1 && (
            <button 
              onClick={() => {
                setCompareMode(!compareMode);
                if (compareMode) setSelectedForCompare([]);
              }}
              className={`text-xs font-bold px-2.5 py-1 rounded-md border transition-colors ${compareMode ? 'bg-white/20 border-white/40 text-white hover:bg-white/30' : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white'}`}
            >
              {compareMode ? 'Cancel' : t('compareMode') || 'Compare'}
            </button>
          )}
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blue-900/40">
            <div 
              className="h-full bg-white transition-all duration-700 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 -mt-6 relative z-10">
        {!isLoading && !error && recommendations.length > 0 && (
          <CFStatusBanner />
        )}

        {!isLoading && profileStore.sessionFeedbackCount >= 3 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-center shadow-sm animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-indigo-900 mb-3 font-medium">You've rated {profileStore.sessionFeedbackCount} internships. Want to refresh your recommendations with your feedback?</p>
            <button 
              onClick={() => {
                // Reset session count to avoid spamming the refresh button
                profileStore.setField('sessionFeedbackCount', 0);
                fetchRecommendations();
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-100 rounded"></div>
                  <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center mt-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Interrupted</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">{error}</p>
            <button 
              onClick={() => fetchRecommendations()}
              className="px-6 py-4 min-h-[56px] bg-primary-blue text-white rounded-xl font-bold w-full shadow-md"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!isLoading && !error && recommendations.length === 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mt-4">
            <div className="w-16 h-16 bg-blue-50 text-primary-blue rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No direct matches found</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">No internships matched your strict profile filters. Try broadening your interests or clearing the district filter.</p>
          </div>
        )}

        {!isLoading && !error && recommendations.map((rec, index) => (
          <RecommendationCard 
            key={rec.internship_id} 
            data={rec} 
            index={index} 
            compareMode={compareMode}
            isSelected={selectedForCompare.includes(String(rec.internship_id))}
            canSelectMore={selectedForCompare.length < 2}
            onSelectToggle={() => toggleCompareSelection(String(rec.internship_id))}
          />
        ))}
      </div>

      {!isLoading && (
        <>
          {compareMode && selectedForCompare.length === 2 && (
             <div className="fixed bottom-[84px] left-0 right-0 max-w-md mx-auto px-4 z-30 animate-in slide-in-from-bottom-5">
                <button 
                  onClick={() => setCompareOpen(true)}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2"
                >
                  {t('compareBtnLabel') || 'Compare 2 selected'} &rarr;
                </button>
             </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
            <button 
              onClick={onSearchAgain}
              aria-label={t('refine_search')}
              className="w-full min-h-[56px] rounded-xl font-bold text-lg text-primary-blue border-2 border-primary-blue transition hover:bg-blue-50 bg-white"
            >
              {t('refine_search')}
            </button>
          </div>
        </>
      )}

      {compareOpen && (
        <ComparePanel 
           internships={recommendations.filter(r => selectedForCompare.includes(String(r.internship_id)))}
           onClose={() => setCompareOpen(false)}
           onApply={(id) => {
             console.log("Applying to", id, "from compare mode");
           }}
        />
      )}
    </div>
  );
}
