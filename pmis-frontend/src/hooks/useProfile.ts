import { useProfileStore } from '../store/profileStore';

export function useProfile() {
  const store = useProfileStore();
  
  const isComplete = Boolean(
    store.education_level && 
    store.skills.length > 0 && 
    store.sector_interests.length > 0 && 
    (store.preferred_state || store.open_to_pan_india) && 
    store.category
  );

  return {
    profile: store,
    updateProfile: store.setField,
    clearProfile: () => {
       store.setField('education_level', '');
       store.setField('skills', []);
       store.setField('sector_interests', []);
       store.setField('preferred_state', '');
       store.setField('category', '');
       store.setField('district', '');
       store.setField('is_rural', false);
       store.setStep(1);
    },
    isComplete
  };
}
