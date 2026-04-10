import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import WizardPage from './pages/WizardPage';
import './index.css';

function App() {
  const [view, setView] = useState<'home' | 'wizard' | 'results'>('home');

  let content = <HomePage onStart={() => setView('wizard')} />;
  if (view === 'wizard') {
    content = <WizardPage onFinish={() => setView('results')} onExit={() => setView('home')} />;
  } else if (view === 'results') {
    content = <div className="p-10 text-center max-w-md mx-auto"><h2 className="text-2xl font-bold text-primary-blue">Loading Results...</h2></div>;
  }

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
      {content}
    </div>
  );
}

export default App;
