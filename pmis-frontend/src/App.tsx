import { useState } from 'react';
import HomePage from './pages/HomePage';
import WizardPage from './pages/WizardPage';
import ResultsPage from './pages/ResultsPage';
import { useProfileStore } from './store/profileStore';
import './i18n/config';
import './index.css';

function App() {
  const store = useProfileStore();
  
  // If we have a stored profile that has progressed past the wizard, skip to Results on hard refresh
  const hasPopulatedProfile = Boolean(store.education_level && store.skills.length > 0);
  const initialView = hasPopulatedProfile && store.currentStep === 4 ? 'results' : 'home';
  
  const [view, setView] = useState<'home' | 'wizard' | 'results'>(initialView);

  let content = <HomePage onStart={() => setView('wizard')} />;
  if (view === 'wizard') {
    content = <WizardPage onFinish={() => setView('results')} onExit={() => setView('home')} />;
  } else if (view === 'results') {
    content = <ResultsPage onSearchAgain={() => {
      // Navigate to wizard and reset to step 1
      useProfileStore.getState().setStep(1);
      setView('wizard');
    }} />;
  }

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
      {content}
    </div>
  );
}

export default App;
