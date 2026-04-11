import type { RecommendationBreakdown } from '../../types';
import { GraduationCap, ExternalLink } from 'lucide-react';

interface Props {
  matched: string[];
  missing: string[];
  data?: RecommendationBreakdown;
}

export default function SkillChart({ matched, missing, data }: Props) {
  const total = matched.length + missing.length;
  if(total === 0) return null;

  const gapPct = data?.skill_gap_percentage || 0;
  const courses = data?.courses_for_missing || [];

  return (
    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
      {data && gapPct === 0 ? (
         <p className="text-xs font-bold text-success-green mb-2">✅ All required skills matched!</p>
      ) : (
         <p className="text-xs font-bold text-gray-700 mb-2">
           Skill gap: {Math.max(gapPct, Math.round((missing.length / total) * 100))}% — {missing.length} missing skill{missing.length > 1 ? 's' : ''}
         </p>
      )}

      {/* Matched Pills */}
      {matched.length > 0 && (
         <div className="flex flex-wrap gap-1.5 mb-2">
           {matched.map((s, i) => (
             <span key={`m-${i}`} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
               ✅ {s}
             </span>
           ))}
         </div>
      )}

      {/* Missing Pills */}
      {missing.length > 0 && (
         <div className="flex flex-col gap-2 mt-2">
           {missing.map((s, i) => {
             const course = courses.find(c => c.skill === s);
             return (
               <div key={`ms-${i}`} className="flex flex-col">
                 <div className="inline-flex items-center self-start px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                   <GraduationCap className="w-3 h-3 mr-1" />
                   ⚠️ {s}
                 </div>
                 {course && (
                   <a href={course.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 ml-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition">
                     Learn → <span className="opacity-75 font-medium">({course.course_name} • {course.duration} {course.free ? '• Free' : ''})</span>
                   </a>
                 )}
               </div>
             )
           })}
         </div>
      )}
    </div>
  );
}
