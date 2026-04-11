import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WizardPage from './pages/WizardPage';
import ResultsPage from './pages/ResultsPage';
import StatsPage from './pages/StatsPage';
import { useProfileStore } from './store/profileStore';
import './i18n/config';
import './index.css';

function App() {
  const store = useProfileStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // If we have a stored profile that has progressed past the wizard, skip to Results on hard refresh
  const hasPopulatedProfile = Boolean(store.education_level && store.skills.length > 0);
  const initialView = hasPopulatedProfile && store.currentStep === 4 ? 'results' : 'home';
  
  // Natively check if the user manually routed to /stats without ReactRouter payload
  const isStatsUrl = location.pathname === '/stats';
  const [view, setView] = useState<'home' | 'wizard' | 'results' | 'stats'>(isStatsUrl ? 'stats' : initialView);

  // Sync React Router's location with local state
  useEffect(() => {
    if (location.pathname === '/stats') {
      setView('stats');
    } else if (location.pathname === '/' && view === 'stats') {
      setView('home'); // or whichever default
    }
  }, [location.pathname]);

  const handleSetView = (newView: 'home' | 'wizard' | 'results' | 'stats') => {
    setView(newView);
    if (newView === 'stats') {
      navigate('/stats');
    } else {
      navigate('/');
    }
  };

  let content = <HomePage onStart={() => handleSetView('wizard')} onDemo={() => {
     store.loadDemoProfile();
     handleSetView('results');
  }} />;
  
  if (view === 'wizard') {
    content = <WizardPage onFinish={() => handleSetView('results')} onExit={() => handleSetView('home')} />;
  } else if (view === 'results') {
    content = <ResultsPage onSearchAgain={() => {
      // Navigate to wizard and reset to step 1
      useProfileStore.getState().setStep(1);
      handleSetView('wizard');
    }} />;
  } else if (view === 'stats') {
    content = <StatsPage onBack={() => handleSetView('home')} />;
  }

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
      {content}
    </div>
  );
}

export default App;
