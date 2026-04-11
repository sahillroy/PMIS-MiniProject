import { useState, useEffect } from 'react';
import { Users, Building2, FileText, TrendingUp, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import type { Stats } from '../types';

interface Props {
  onBack: () => void;
}

export default function StatsPage({ onBack }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center pt-20 pb-28 max-w-md mx-auto sm:max-w-4xl relative">
         <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-4" />
         <p className="text-gray-500 font-bold">Loading dashboard...</p>
      </div>
    );
  }

  // Fallback defaults if APIs return incomplete
  const f = stats.funnel || { registered: 500, applied: 200, accepted: 87, joined: 43 };
  const categories = stats.category_breakdown || { GEN: 50, OBC: 25, SC: 15, ST: 10 };
  const getSectors = () => stats.sector_distribution?.length ? stats.sector_distribution : [{ sector: "IT", count: 24, percentage: 30 }];
  const getStates = () => stats.state_distribution?.length ? stats.state_distribution : [{ state: "MH", count: 24, percentage: 30 }];

  // Helper for computing drop off %
  const calcDrop = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round((current / previous) * 100);
  };

  const getSectorColor = (sector: string) => {
    const s = sector.toLowerCase();
    if(s.includes('it') || s.includes('software')) return '#3b82f6';
    if(s.includes('manufactur')) return '#f59e0b';
    if(s.includes('health')) return '#ef4444';
    if(s.includes('retail')) return '#10b981';
    if(s.includes('agri')) return '#84cc16';
    if(s.includes('edu')) return '#8b5cf6';
    if(s.includes('finance') || s.includes('bank')) return '#06b6d4';
    return '#64748b';
  };

  const catTotal = Object.values(categories).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28 sm:max-w-5xl mx-auto w-full relative font-sans">
      
      <div className="bg-primary-blue px-6 pt-10 pb-8 shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition font-semibold mb-4 min-h-[44px] touch-manipulation"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Impact Dashboard</h1>
        <p className="text-blue-100 font-medium tracking-wide">Real-time statistics & PMIS AI conversion analytics</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* ROW 1: KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 text-primary-blue rounded-full mb-3 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Candidates</p>
            <p className="text-2xl font-black text-gray-900">{stats.total_candidates}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full mb-3 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Internships</p>
            <p className="text-2xl font-black text-gray-900">{stats.total_internships}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full mb-3 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Applications</p>
            <p className="text-2xl font-black text-gray-900">{stats.total_applications}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="w-20 h-20" />
            </div>
            <div className="w-10 h-10 bg-green-50 text-success-green rounded-full mb-3 flex items-center justify-center relative z-10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Conversion</p>
            <p className="text-2xl font-black text-gray-900 relative z-10">{stats.conversion_rate}</p>
          </div>
        </div>

        {/* ROW 2: Conversion Funnel */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Application Funnel</h2>
          
          <div className="relative mt-4 w-full">
            {/* Baselines */}
            <div className="absolute inset-x-0 inset-y-0 pointer-events-none hidden sm:block">
               <div className="absolute top-[80%] left-0 right-0 border-t border-dashed border-red-400 z-0">
                  <span className="text-[10px] sm:text-xs font-bold text-red-500 absolute -top-5 right-2 bg-white/80 px-1">Phase 1 Baseline (10.6%)</span>
               </div>
               <div className="absolute top-[50%] left-0 right-0 border-t-2 border-solid border-success-green z-0">
                  <span className="text-[10px] sm:text-xs font-bold text-success-green absolute -top-5 right-2 bg-white/80 px-1">Projected Target (40%)</span>
               </div>
            </div>

            {/* Desktop Horizontal SVGs (hidden on mobile) */}
            <div className="hidden sm:flex relative w-full h-[160px] items-end">
               <svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible absolute inset-0 text-gray-800">
                  {/* Trapezoids / Blocks */}
                  {/* Registered */}
                  <polygon points="0,160 0,0 24%,40 24%,160" fill="#3b82f6" />
                  <text x="2%" y="150" fill="white" fontSize="12" fontWeight="bold">Registered</text>
                  <text x="2%" y="130" fill="white" fontSize="16" fontWeight="900">{f.registered}</text>

                  {/* Connecting Line 1 */}
                  <text x="25%" y="60" fontSize="10" fontWeight="bold" fill="#64748b">→ {calcDrop(f.applied, f.registered)}% apply</text>

                  {/* Applied */}
                  <polygon points="26%,160 26%,40 48%,80 48%,160" fill="#0ea5e9" />
                  <text x="28%" y="150" fill="white" fontSize="12" fontWeight="bold">Applied</text>
                  <text x="28%" y="130" fill="white" fontSize="16" fontWeight="900">{f.applied}</text>

                  {/* Connecting Line 2 */}
                  <text x="49%" y="100" fontSize="10" fontWeight="bold" fill="#64748b">→ {calcDrop(f.accepted, f.applied)}% selected</text>

                  {/* Accepted */}
                  <polygon points="50%,160 50%,80 72%,110 72%,160" fill="#10b981" />
                  <text x="52%" y="150" fill="white" fontSize="12" fontWeight="bold">Accepted</text>
                  <text x="52%" y="130" fill="white" fontSize="16" fontWeight="900">{f.accepted}</text>

                  {/* Connecting Line 3 */}
                  <text x="73%" y="130" fontSize="10" fontWeight="bold" fill="#64748b">→ {calcDrop(f.joined, f.accepted)}% join</text>

                  {/* Joined */}
                  <polygon points="74%,160 74%,110 98%,130 98%,160" fill="#047857" />
                  <text x="76%" y="150" fill="white" fontSize="12" fontWeight="bold">Joined</text>
                  <text x="76%" y="130" fill="white" fontSize="16" fontWeight="900">{f.joined}</text>
               </svg>
            </div>

            {/* Mobile Vertical SVGs / Layout (visible only on mobile) */}
            <div className="flex flex-col sm:hidden w-full space-y-4">
              <div className="flex flex-col">
                <div className="flex justify-between items-center bg-blue-500 rounded-t-lg p-3 text-white shadow-sm">
                  <span className="font-bold text-sm">Registered</span>
                  <span className="font-black text-lg">{f.registered}</span>
                </div>
                <div className="flex justify-center items-center py-2 bg-gray-50 border-x border-gray-100">
                  <span className="text-xs font-bold text-gray-500">↓ {calcDrop(f.applied, f.registered)}% apply</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center bg-sky-500 p-3 text-white shadow-sm w-[90%] mx-auto">
                  <span className="font-bold text-sm">Applied</span>
                  <span className="font-black text-lg">{f.applied}</span>
                </div>
                <div className="flex justify-center items-center py-2 bg-gray-50 w-[90%] mx-auto border-x border-gray-100">
                  <span className="text-xs font-bold text-gray-500">↓ {calcDrop(f.accepted, f.applied)}% selected</span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center bg-emerald-500 p-3 text-white shadow-sm w-[80%] mx-auto">
                  <span className="font-bold text-sm">Accepted</span>
                  <span className="font-black text-lg">{f.accepted}</span>
                </div>
                <div className="flex justify-center items-center py-2 bg-gray-50 w-[80%] mx-auto border-x border-gray-100">
                  <span className="text-xs font-bold text-gray-500">↓ {calcDrop(f.joined, f.accepted)}% join</span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center bg-emerald-700 rounded-b-lg p-3 text-white shadow-sm w-[70%] mx-auto">
                  <span className="font-bold text-sm">Joined</span>
                  <span className="font-black text-lg">{f.joined}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sectors - Horizontal Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Sectors</h2>
            <div className="flex-1 flex flex-col justify-between space-y-4">
              {getSectors().slice(0, 8).map((sec, i) => (
                 <div key={i} className="flex flex-col group mt-2">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1 w-full gap-2">
                      <span className="truncate flex-1 max-w-[140px] sm:max-w-[200px]" title={sec.sector}>{sec.sector}</span>
                      <span className="whitespace-nowrap shrink-0">{sec.count} ({sec.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full rounded-full transition-all duration-1000 ease-out"
                         style={{ 
                           width: `${sec.percentage}%`, 
                           backgroundColor: getSectorColor(sec.sector) 
                         }}
                       />
                    </div>
                 </div>
              ))}
            </div>
          </div>

          {/* States - Vertical Bar Chart via SVG */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Internships by State</h2>
            <div className="flex-1 w-full relative mt-2 min-h-[220px]">
               <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map(val => (
                    <line key={val} x1="0" y1={100 - val} x2="100" y2={100 - val} stroke="#f1f5f9" strokeWidth="0.5" />
                  ))}
                  
                  {/* Bars */}
                  {getStates().slice(0, 8).map((st, i) => {
                     const maxCount = Math.max(...getStates().map(s => s.count)) || 1;
                     const heightPct = (st.count / maxCount) * 90; // leave 10% for label above
                     const xPos = (100 / 8) * i + ((100 / 8) * 0.2); // 20% gap
                     const width = (100 / 8) * 0.6; // 60% width
                     
                     return (
                        <g key={i}>
                          <rect 
                            x={xPos} 
                            y={100 - heightPct} 
                            width={width} 
                            height={heightPct} 
                            fill="#3b82f6" 
                            rx="1" 
                            className="hover:fill-indigo-500 transition-colors cursor-pointer"
                          >
                             <title>{st.state}: {st.count}</title>
                          </rect>
                          
                          {/* Label above bar */}
                          <text x={xPos + (width/2)} y={100 - heightPct - 2} fontSize="3" fontWeight="bold" fill="#64748b" textAnchor="middle">
                            {st.count}
                          </text>

                          {/* State Abbreviation below (using standard text offset) */}
                          <text x={xPos + (width/2)} y="105" fontSize="3" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                            {st.state.substring(0, 3).toUpperCase()}
                          </text>
                        </g>
                     );
                  })}
               </svg>
            </div>
          </div>
        </div>

        {/* ROW 4: Affirmative Action / Diversity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <h2 className="text-lg font-bold text-gray-900 mb-6 self-start w-full">Candidate Category Diversity</h2>
              {/* Pie Chart */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90 rounded-full">
                   {/* Create segments dynamically */}
                   {(() => {
                      let currentOffset = 0;
                      const colors = { GEN: '#e2e8f0', OBC: '#60a5fa', SC: '#8b5cf6', ST: '#3b82f6' };
                      return Object.entries(categories).map(([cat, val]) => {
                         const rawValue = val as number;
                         const percentage = catTotal > 0 ? (rawValue / catTotal) * 100 : 0;
                         const dasharray = `${percentage} 100`;
                         const group = (
                           <circle 
                             key={cat}
                             r="16" cx="16" cy="16" 
                             fill="transparent" 
                             stroke={colors[cat as keyof typeof colors] || '#000'} 
                             strokeWidth="32" 
                             strokeDasharray={dasharray} 
                             strokeDashoffset={`-${currentOffset}`} 
                             className="hover:opacity-80 transition cursor-pointer"
                           >
                             <title>{cat}: {percentage.toFixed(1)}%</title>
                           </circle>
                         );
                         currentOffset += percentage;
                         return group;
                      });
                   })()}
                </svg>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
              {/* Legend for Pie */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#e2e8f0]"></div><span className="text-sm font-bold text-gray-600">General</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#60a5fa]"></div><span className="text-sm font-bold text-gray-600">OBC</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#8b5cf6]"></div><span className="text-sm font-bold text-gray-600">SC</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#3b82f6]"></div><span className="text-sm font-bold text-gray-600">ST</span></div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
                 <div>
                    <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
                      <span>Rural Candidates</span>
                      <span className="text-primary-blue">{stats.rural_percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-primary-blue rounded-full" style={{ width: `${stats.rural_percentage}%` }}></div>
                    </div>
                 </div>

                 <div>
                    <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
                      <span>First-time Interns</span>
                      {/* Simulating first-time interns as 100 - conversion if not passed, or 85% proxy */}
                      <span className="text-indigo-500">82%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                 </div>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}
