
import { useProfileStore } from '../../store/profileStore';

const ALL_SKILLS = [
  'Communication', 'MS Office', 'Computer Basics', 'Data Entry', 'English Speaking',
  'Python', 'Java', 'Web Design', 'Accounting', 'Tally', 'Customer Service', 'Sales',
  'Electrical Work', 'Mechanical', 'Welding', 'Driving Licence', 
  'Graphic Design', 'Video Editing', 'Social Media', 'Content Writing'
];

export default function Step2Skills() {
  const { skills, setField, nextStep } = useProfileStore();

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setField('skills', skills.filter(s => s !== skill));
    } else {
      setField('skills', [...skills, skill]);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">What are your skills?</h2>
      <p className="text-gray-500 mb-6 text-sm">Tap all that apply</p>
      
      <div className="flex flex-wrap gap-3 mb-24">
        {ALL_SKILLS.map(skill => {
          const isSelected = skills.includes(skill);
          return (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`min-h-[44px] px-5 py-2 rounded-full border-2 text-sm font-semibold transition ${
                isSelected 
                  ? 'border-primary-blue bg-blue-50 text-primary-blue' 
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 z-10">
        {skills.length === 0 && (
          <p className="text-red-500 text-sm font-medium mb-2 text-center">Select at least 1 skill to proceed</p>
        )}
        <button 
          onClick={nextStep}
          disabled={skills.length === 0}
          className={`w-full min-h-[56px] rounded-xl font-bold text-lg text-white transition shadow-md flex justify-center items-center ${
            skills.length > 0 ? 'bg-primary-blue hover:bg-blue-900' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
