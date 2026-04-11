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

/** Weights (must sum to 100) */
const COMPLETENESS_WEIGHTS = {
  education_level: 20,
  skills: 20,          // ≥3 skills for full weight
  sector_interests: 15, // ≥1 sector for full weight
  preferred_state: 15,
  category: 10,
  name: 10,
  cgpa: 5,
  is_rural: 5,
};

interface Props {
  onFinish: () => void;
}

export default function Step4Location({ onFinish }: Props) {
  const {
    preferred_state, open_to_pan_india, category, is_rural, district,
    education_level, skills, sector_interests, name, cgpa,
    min_stipend_preference,
    setField,
  } = useProfileStore();

  const [isLoading, setIsLoading] = useState(false);

  // ── Profile completeness calculation ─────────────────────────────────────
  const completeness = Math.round(
    (education_level                ? COMPLETENESS_WEIGHTS.education_level  : 0) +
    (skills.length >= 3             ? COMPLETENESS_WEIGHTS.skills           : skills.length > 0 ? 10 : 0) +
    (sector_interests.length >= 1   ? COMPLETENESS_WEIGHTS.sector_interests : 0) +
    ((preferred_state || open_to_pan_india) ? COMPLETENESS_WEIGHTS.preferred_state : 0) +
    (category                       ? COMPLETENESS_WEIGHTS.category         : 0) +
    (name.trim()                    ? COMPLETENESS_WEIGHTS.name             : 0) +
    (cgpa                           ? COMPLETENESS_WEIGHTS.cgpa             : 0) +
    (is_rural !== undefined         ? COMPLETENESS_WEIGHTS.is_rural         : 0)   // always true since boolean
  );

  const barColor =
    completeness >= 80 ? 'bg-green-500'
    : completeness >= 60 ? 'bg-amber-400'
    : 'bg-red-400';

  const barTextColor =
    completeness >= 80 ? 'text-green-700'
    : completeness >= 60 ? 'text-amber-700'
    : 'text-red-600';

  // ── Stipend helpers ───────────────────────────────────────────────────────
  const stipendValue = min_stipend_preference ?? 0;
  const stipendLabel =
    stipendValue === 0
      ? 'No minimum'
      : `₹${(stipendValue / 1000).toFixed(0)},000/month`;

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => { onFinish(); }, 400);
  };

  const isFormValid = (preferred_state || open_to_pan_india) && category;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Where do you want to intern?</h2>

      {/* ── Profile completeness bar ──────────────────────────────────────── */}
      <div className="mb-6 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-bold ${barTextColor}`}>
            Profile {completeness}% complete
          </span>
          <span className="text-xs text-gray-400">more detail = better matches</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`${barColor} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 60 && (
          <p className="text-xs text-red-500 mt-2">
            ⚠️ Add more skills and a sector interest for better recommendations
          </p>
        )}
        {completeness >= 80 && (
          <p className="text-xs text-green-600 mt-2">✅ Great profile! You'll get highly accurate matches.</p>
        )}
      </div>

      <div className="flex flex-col gap-6 mb-40">
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

        {/* ── Minimum Stipend Slider ──────────────────────────────────────── */}
        <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
          <div className="flex justify-between items-start mb-1">
            <label className="text-sm font-bold text-gray-700">
              Minimum monthly stipend needed
              <span className="block text-xs font-normal text-gray-400 mt-0.5">न्यूनतम मासिक वेतन</span>
            </label>
            <span className={`text-base font-black tabular-nums ${stipendValue === 0 ? 'text-gray-400' : 'text-primary-blue'}`}>
              {stipendLabel}
            </span>
          </div>

          <input
            id="stipend-slider"
            type="range"
            min={0}
            max={20000}
            step={1000}
            value={stipendValue}
            onChange={(e) => setField('min_stipend_preference', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-blue mt-3"
          />

          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₹0</span>
            <span>₹5k</span>
            <span>₹10k</span>
            <span>₹15k</span>
            <span>₹20k</span>
          </div>

          <p className={`text-xs mt-3 font-medium ${stipendValue === 0 ? 'text-gray-400' : 'text-indigo-600'}`}>
            {stipendValue === 0
              ? "We'll show all opportunities"
              : `We'll hide internships paying below ${stipendLabel}`}
          </p>
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
