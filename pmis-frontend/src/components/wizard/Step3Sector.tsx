
import { useProfileStore } from '../../store/profileStore';

const SECTORS = [
  { name: 'IT & Technology', icon: '💻' },
  { name: 'Banking & Finance', icon: '🏦' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Manufacturing', icon: '🏭' },
  { name: 'Automobile', icon: '🚗' },
  { name: 'Energy', icon: '⚡' },
  { name: 'Retail & FMCG', icon: '📦' },
  { name: 'Agriculture', icon: '🌾' },
  { name: 'Education', icon: '📚' },
  { name: 'Infrastructure', icon: '🏗️' },
  { name: 'Media & Entertainment', icon: '🎬' },
  { name: 'Travel & Tourism', icon: '✈️' }
];

export default function Step3Sector() {
  const { sector_interests, setField, nextStep } = useProfileStore();

  const toggleSector = (sectorName: string) => {
    if (sector_interests.includes(sectorName)) {
      setField('sector_interests', sector_interests.filter(s => s !== sectorName));
    } else {
      if (sector_interests.length < 3) {
        setField('sector_interests', [...sector_interests, sectorName]);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Which fields interest you?</h2>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">Choose up to 3</p>
        <span className={`text-sm font-bold ${sector_interests.length === 3 ? 'text-success-green' : 'text-primary-blue'}`}>
          {sector_interests.length}/3 selected
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-24">
        {SECTORS.map(sec => {
          const isSelected = sector_interests.includes(sec.name);
          const isDisabled = !isSelected && sector_interests.length >= 3;
          
          return (
            <button
              key={sec.name}
              onClick={() => toggleSector(sec.name)}
              disabled={isDisabled}
              className={`min-h-[80px] p-3 rounded-xl border-2 transition flex flex-col items-center justify-center text-center gap-1 touch-manipulation ${
                isSelected 
                  ? 'border-success-green bg-green-50 shadow-sm' 
                  : isDisabled 
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl leading-none">{sec.icon}</span>
              <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-success-green' : 'text-gray-700'}`}>
                {sec.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 z-10">
        {sector_interests.length === 0 && (
          <p className="text-red-500 text-sm font-medium mb-2 text-center">Select at least 1 sector to proceed</p>
        )}
        <button 
          onClick={nextStep}
          disabled={sector_interests.length === 0}
          className={`w-full min-h-[56px] rounded-xl font-bold text-lg text-white transition shadow-md flex justify-center items-center ${
            sector_interests.length > 0 ? 'bg-primary-blue hover:bg-blue-900' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
