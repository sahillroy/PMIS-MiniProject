import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];

interface Props {
  onFinish: () => void;
}

export default function Step4Location({ onFinish }: Props) {
  const { 
    preferred_state, open_to_pan_india, category, is_rural, district, 
    setField 
  } = useProfileStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate delay for smooth UX transition
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  const isFormValid = (preferred_state || open_to_pan_india) && category;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Where do you want to intern?</h2>
      
      <div className="flex flex-col gap-6 mb-32">
        {/* State Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Select State</label>
          <select 
            value={preferred_state}
            onChange={(e) => {
              setField('preferred_state', e.target.value);
              if (e.target.value) setField('open_to_pan_india', false);
            }}
            disabled={open_to_pan_india}
            className={`w-full min-h-[56px] px-4 rounded-xl border-2 text-lg outline-none transition ${
              open_to_pan_india ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-gray-200 text-gray-700 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue'
            }`}
          >
            <option value="" disabled>Select a state</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Pan India Toggle */}
        <div 
          onClick={() => {
            const nextVal = !open_to_pan_india;
            setField('open_to_pan_india', nextVal);
            if (nextVal) setField('preferred_state', '');
          }}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 bg-white"
        >
          <div className={`w-6 h-6 flex shrink-0 items-center justify-center rounded border-2 ${open_to_pan_india ? 'bg-primary-blue border-primary-blue' : 'border-gray-400'}`}>
            {open_to_pan_india && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-base font-medium text-gray-700">I'm open to opportunities anywhere in India</span>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 mt-2">Social Category</label>
          <select 
            value={category}
            onChange={(e) => setField('category', e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-lg outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
          >
            <option value="" disabled>Select your category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Rural Area */}
        <div 
          onClick={() => setField('is_rural', !is_rural)}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 bg-white"
        >
          <div className={`w-6 h-6 flex shrink-0 items-center justify-center rounded border-2 ${is_rural ? 'bg-primary-blue border-primary-blue' : 'border-gray-400'}`}>
            {is_rural && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-base font-medium text-gray-700">I am from a rural/village area</span>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">District (Optional)</label>
          <input 
            type="text"
            placeholder="Type your district"
            value={district}
            onChange={(e) => setField('district', e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 text-lg outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 z-10">
        {!isFormValid && (
          <p className="text-red-500 text-sm font-medium mb-2 text-center">Please select Location and Category to finish</p>
        )}
        <button 
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className={`w-full min-h-[56px] flex justify-center items-center rounded-xl font-bold text-lg text-white transition shadow-md gap-2 ${
            isFormValid ? 'bg-success-green hover:bg-green-800' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : null}
          <span>Complete Profile</span>
        </button>
      </div>
    </div>
  );
}
