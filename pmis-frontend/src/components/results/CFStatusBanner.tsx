import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, ShieldAlert, Zap, CheckCircle2 } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';

export default function CFStatusBanner() {
  const candidateId = useProfileStore(state => state.id) || 1; // Fallback to candidate_id 1
  const sessionFeedbackCount = useProfileStore(state => state.sessionFeedbackCount || 0);
  
  const [status, setStatus] = useState<import('../../types').CFStatusResponse | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    // Re-fetch status whenever sessionFeedbackCount changes
    api.getFeedbackStatus(candidateId).then(setStatus).catch(console.error);
  }, [candidateId, sessionFeedbackCount]);

  if (!visible || !status) return null;

  let message = '';
  let Icon = ShieldAlert;
  let colorClass = 'bg-blue-50 border-blue-200 text-blue-800';
  let iconClass = 'text-blue-600';

  if (status.scoring_mode === 'content_only') {
    message = "🔍 Showing profile-based matches. Rate some internships to personalise further.";
  } else if (status.scoring_mode === 'content_heavy' || status.interaction_count < 10) {
    const remaining = 10 - status.interaction_count;
    message = `⚡ Personalisation is warming up. Rate ${remaining > 0 ? remaining : 1} more to unlock full AI matching.`;
    Icon = Zap;
    colorClass = 'bg-amber-50 border-amber-200 text-amber-800';
    iconClass = 'text-amber-500';
  } else {
    message = "✅ Fully personalised. Matches are based on your profile and preferences.";
    Icon = CheckCircle2;
    colorClass = 'bg-green-50 border-green-200 text-green-800';
    iconClass = 'text-green-600';
  }

  return (
    <div className={`flex items-start justify-between p-3.5 mb-4 rounded-xl border shadow-sm ${colorClass} animate-in fade-in slide-in-from-top-2`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
        <span className="text-sm font-medium leading-snug pr-2">{message}</span>
      </div>
      <button onClick={() => setVisible(false)} className={`p-1 rounded hover:bg-black/5 transition -mr-1 -mt-1 ${iconClass}`}>
        <X className="w-4 h-4 opacity-70 hover:opacity-100" />
      </button>
    </div>
  );
}
