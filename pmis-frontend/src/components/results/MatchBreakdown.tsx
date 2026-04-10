import type { Recommendation } from '../../types';
import { X, ShieldCheck, HeartPulse } from 'lucide-react';

interface Props {
  data: Recommendation;
  onClose: () => void;
}

export default function MatchBreakdown({ data, onClose }: Props) {
  const R = data.reasons;
  const aff = R.affirmative_action;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 border-b border-gray-100 bg-gray-50">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 leading-tight pr-8">Match Transparency Engine</h2>
          <p className="text-xs text-gray-500 font-medium mt-2 flex items-center gap-1.5 uppercase tracking-wide">
            <HeartPulse className="w-3.5 h-3.5 text-primary-blue" />
            {data.scoring_mode === 'hybrid' ? 'Personalised AI Match' : 'Profile-Based Standard Match'}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-gray-700">Content Engine Score</span>
                <span className="text-sm font-bold text-gray-900">{(data.content_score * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-blue" style={{ width: `${Math.min(data.content_score * 100, 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-gray-700">Collaborative Trajectory</span>
                <span className="text-sm font-bold text-gray-900">{(data.cf_score * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400" style={{ width: `${Math.min(data.cf_score * 100, 100)}%` }} />
              </div>
            </div>

            {aff && aff.affirmative_boosts_applied.length > 0 && (
              <div className="pt-4 border-t border-dashed border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success-green" />
                  Social Inclusion Applied
                </h3>
                <div className="space-y-2">
                  {aff.affirmative_boosts_applied.map((b, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-green-50/50 border border-green-100">
                      <span className="font-medium text-gray-700">{b.reason}</span>
                      <span className="font-bold text-success-green">+{Number(b.boost * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
