import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../store/profileStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import { useRecommendations } from '../hooks/useRecommendations';
import RecommendationCard from '../components/results/RecommendationCard';
import ComparePanel from '../components/results/ComparePanel';
import CFStatusBanner from '../components/results/CFStatusBanner';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Share2, Search, Settings2, Bookmark, CheckCircle2 } from 'lucide-react';

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
  const navigate = useNavigate();
  
  const profileStore = useProfileStore();
  const activeProfile = profileStore.skills.length > 0 ? profileStore : FALLBACK_PROFILE;
  
  const { recommendations, isLoading, error, fetchRecommendations } = useRecommendations();
  const { bookmarks } = useBookmarkStore();
  
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("🔍 Analysing your profile...");
  const [activeTab, setActiveTab] = useState<'all'|'saved'>('all');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Compare mode states
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Connection monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setLoadingText("🔍 Analysing your profile...");
      const t1 = setTimeout(() => { setProgress(40); setLoadingText("⚙️ Running AI matching across 500+ opportunities..."); }, 500);
      const t2 = setTimeout(() => { setProgress(80); setLoadingText("🎯 Ranking your best matches..."); }, 1200);
      const t3 = setTimeout(() => { setProgress(95); }, 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setProgress(100);
      setLoadingText("Done");
    }
  }, [isLoading]);

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My PMIS Internship Matches",
          text: "I found 5 great internship matches on the PM Internship Scheme app!",
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      const topRec = recommendations[0];
      const fallbackText = topRec ? `My top PMIS match: ${topRec.company} - ${topRec.role} at ${topRec.location} (Match: ${topRec.match_percentage}%)` : "I found great matches on the PMIS app!";
      navigator.clipboard.writeText(fallbackText);
      alert("Copied to clipboard!");
    }
  };

  // Safe router navigation logic ensuring wizard catches step updates
  const goBackToStep = (stepNumber: number) => {
     profileStore.setField('currentStep', stepNumber); 
     // We assume App.tsx or routing handles this. If App.tsx triggers wizard, we can force navigation.
     // Assuming ResultsPage is loaded via `/results` or equivalent, we trigger Home to load Wizard.
     onSearchAgain();
  };

  const displayData = activeTab === 'all' ? recommendations : bookmarks;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 max-w-md mx-auto shadow-xl relative font-sans">
      {isOffline && (
         <div className="bg-red-500 text-white text-xs font-bold text-center py-1.5 animate-pulse shrink-0">
            ⚠️ You're offline. Your last results are saved.
         </div>
      )}

      <div className="bg-primary-blue px-6 pt-8 pb-12 shadow-md rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2 z-20">
            <button 
              onClick={handleShare}
              aria-label="Share results"
              className="bg-white/20 hover:bg-white/30 text-white border border-white/40 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
              aria-label="Toggle language"
              className="bg-white/20 hover:bg-white/30 text-white font-bold border border-white/40 px-3 py-1.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
            >
              {i18n.language === 'en' ? 'हिं' : 'EN'}
            </button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 relative z-10 mt-6">
          {activeProfile.name ? `${activeProfile.name} - ${t('your_results')}` : t('your_results')}
        </h1>
        
        <div className="flex justify-between items-center relative z-10 mt-2">
          <p className="text-blue-100 font-medium tracking-wide text-xs">
            {isLoading ? loadingText : (compareMode ? (t('compareBtnLabel')?.replace(/\d+.*$/, 'Select 2') || 'Select 2 to compare') : `Using personalised matching`)}
          </p>
          {!isLoading && !error && recommendations.length > 1 && (
            <button 
              onClick={() => {
                setCompareMode(!compareMode);
                if (compareMode) setSelectedForCompare([]);
              }}
              className={`text-xs font-bold px-2.5 py-1 rounded-md border transition-colors shrink-0 ${compareMode ? 'bg-white/20 border-white/40 text-white hover:bg-white/30' : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white'}`}
            >
              {compareMode ? 'Cancel' : t('compareMode') || 'Compare'}
            </button>
          )}
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blue-900/40">
            <div 
              className="h-full bg-white transition-all duration-[400ms] ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 -mt-6 relative z-10">
        
        {/* TABS (All / Saved) */}
        {!isLoading && !error && (
           <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-2">
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-blue-50 text-primary-blue shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
              >
                 All Matches ({recommendations.length})
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'saved' ? 'bg-blue-50 text-primary-blue shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
              >
                 <Bookmark className="w-4 h-4" />
                 Saved ({bookmarks.length})
              </button>
           </div>
        )}

        {!isLoading && !error && recommendations.length > 0 && activeTab === 'all' && (
          <CFStatusBanner />
        )}

        {!isLoading && activeTab === 'all' && profileStore.sessionFeedbackCount >= 3 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-center shadow-sm animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-indigo-900 mb-3 font-medium">You've rated {profileStore.sessionFeedbackCount} internships. Want to refresh your recommendations with your feedback?</p>
            <button 
              onClick={() => {
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
            <div className="text-center font-bold text-gray-500 text-sm animate-pulse">{loadingText}</div>
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

        {!isLoading && error && !isOffline && (
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

        {!isLoading && !error && activeTab === 'all' && displayData.length === 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 text-center mt-4 text-left">
            <div className="w-14 h-14 bg-blue-50 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3 text-center">No exact matches found</h3>
            <p className="text-gray-500 mb-6 text-sm text-center">Try broadening your search criteria to unlock more opportunities.</p>
            
            <div className="space-y-3 pt-4 border-t border-gray-100">
               {/* Fixed suggestion buttons using correct wizard steps mapping: Sectors = Step 3, Filters/Stipend = Step 4 */}
               <button 
                  onClick={() => goBackToStep(4)} 
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition group text-left"
               >
                  <div>
                    <strong className="block text-sm text-gray-800">Lower minimum stipend</strong>
                    <span className="text-xs text-gray-500">Currently ₹{profileStore.minStipend} limit</span>
                  </div>
                  <Settings2 className="w-4 h-4 text-gray-400 group-hover:text-primary-blue" />
               </button>
               
               <button 
                  onClick={() => goBackToStep(3)} 
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition group text-left"
               >
                  <div>
                    <strong className="block text-sm text-gray-800">Add more sectors</strong>
                    <span className="text-xs text-gray-500">Currently {profileStore.sector_interests.length} selected</span>
                  </div>
                  <Settings2 className="w-4 h-4 text-gray-400 group-hover:text-primary-blue" />
               </button>
               
               <button 
                  onClick={() => goBackToStep(4)} 
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition group text-left"
               >
                  <div>
                    <strong className="block text-sm text-gray-800">Expand to Pan-India</strong>
                    <span className="text-xs text-gray-500">Open up remote flexibility</span>
                  </div>
                  <Settings2 className="w-4 h-4 text-gray-400 group-hover:text-primary-blue" />
               </button>
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'saved' && displayData.length === 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mt-4">
            <div className="w-16 h-16 bg-blue-50 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
               <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No saved internships</h3>
            <p className="text-gray-500 mb-6 text-sm">Save your favorites by clicking the bookmark icon on any recommendation card.</p>
          </div>
        )}

        {!isLoading && !error && displayData.map((rec, index) => (
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
             <div className="fixed bottom-[110px] left-0 right-0 max-w-md mx-auto px-4 z-30 animate-in slide-in-from-bottom-5">
                <button 
                  onClick={() => setCompareOpen(true)}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2"
                >
                  {t('compareBtnLabel') || 'Compare 2 selected'} &rarr;
                </button>
             </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col gap-2">
            <button 
              onClick={() => onSearchAgain()}
              aria-label={t('refine_search')}
              className="w-full min-h-[56px] rounded-xl font-bold text-lg text-primary-blue border-2 border-primary-blue transition hover:bg-blue-50 bg-white"
            >
              {t('refine_search')}
            </button>
            <button 
              onClick={() => navigate('/stats')}
              className="w-full text-center text-sm text-gray-400 hover:text-blue-600 py-2"
            >
              📊 View Platform Stats
            </button>
          </div>
        </>
      )}

      {compareOpen && (
        <ComparePanel 
           internships={displayData.filter(r => selectedForCompare.includes(String(r.internship_id)))}
           onClose={() => setCompareOpen(false)}
           onApply={(_id) => {
             // Navigation or state feedback handled in component
           }}
        />
      )}
    </div>
  );
}
