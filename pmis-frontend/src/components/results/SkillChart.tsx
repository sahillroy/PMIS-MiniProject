import React from 'react';

interface Props {
  matched: string[];
  missing: string[];
}

export default function SkillChart({ matched, missing }: Props) {
  const total = matched.length + missing.length;
  if(total === 0) return null;

  return (
    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-xs font-bold text-gray-700 mb-2">
        Skill match: {matched.length} of {total} required
      </p>
      <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-gray-200">
        {matched.map((_, i) => (
          <div key={`m-${i}`} className="h-full bg-success-green flex-1" />
        ))}
        {missing.map((_, i) => (
          <div key={`ms-${i}`} className="h-full bg-amber-400 flex-1 opacity-40" />
        ))}
      </div>
    </div>
  );
}
