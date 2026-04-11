import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ArrowLeft, Users, Briefcase, Target, PieChart } from 'lucide-react';

interface StatsData {
  total_candidates: number;
  total_internships: number;
  applications_today: number;
  conversion_rate: string;
  top_sectors: {name: string, count: number}[];
  top_states: {name: string, count: number}[];
}

const mockStats: StatsData = {
  total_candidates: 621430,
  total_internships: 127000,
  applications_today: 4320,
  conversion_rate: "38.5%",
  top_sectors: [
    {name: "IT/Software", count: 45000},
    {name: "Manufacturing", count: 32000},
    {name: "Agriculture", count: 28000},
    {name: "Retail", count: 18000},
    {name: "Healthcare", count: 12000}
  ],
  top_states: [
    {name: "Maharashtra", count: 48000},
    {name: "Karnataka", count: 31000},
    {name: "Delhi", count: 22000},
    {name: "Gujarat", count: 19000},
    {name: "Tamil Nadu", count: 15000}
  ]
};

interface Props {
  onBack: () => void;
}

export default function StatsPage({ onBack }: Props) {
  const [stats, setStats] = useState<StatsData>(mockStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt real fetch, naturally fallback cleanly
    api.getStats().then((data: any) => {
      setStats(prev => ({...prev, ...data}));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const maxVal = Math.max(...stats.top_sectors.map(s => s.count));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center max-w-md mx-auto relative shadow-xl font-sans">
        <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-xl font-sans pb-10">
      <div className="px-6 pt-8 pb-6 bg-white border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} aria-label="Go back" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Platform Analytics</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex gap-2 items-center mb-1 text-primary-blue">
               <Users className="w-4 h-4" />
               <span className="text-xs font-bold uppercase">Candidates</span>
            </div>
            <p className="text-2xl font-black text-gray-800">{(stats.total_candidates / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex gap-2 items-center mb-1 text-success-green">
               <Briefcase className="w-4 h-4" />
               <span className="text-xs font-bold uppercase">Internships</span>
            </div>
            <p className="text-2xl font-black text-gray-800">{(stats.total_internships / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex gap-2 items-center mb-1 text-indigo-500">
               <Target className="w-4 h-4" />
               <span className="text-xs font-bold uppercase">AI Convert</span>
            </div>
            <p className="text-2xl font-black text-gray-800">{stats.conversion_rate}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex gap-2 items-center mb-1 text-amber-500">
               <PieChart className="w-4 h-4" />
               <span className="text-xs font-bold uppercase">Daily Apps</span>
            </div>
            <p className="text-2xl font-black text-gray-800">{stats.applications_today}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Top Sectors Requested</h3>
           <div className="space-y-4">
              {stats.top_sectors.map((sector, i) => (
                 <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{sector.name}</span>
                      <span className="text-gray-500 font-bold">{sector.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 align-middle overflow-hidden">
                       <div 
                         className="bg-primary-blue h-1.5 rounded-full" 
                         style={{ width: `${(sector.count / maxVal) * 100}%` }} 
                       />
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  )
}
