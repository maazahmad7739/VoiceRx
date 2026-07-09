import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Authentication & Session
  token: typeof window !== 'undefined' ? localStorage.getItem('voicerx_token') : null,
  doctor: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('voicerx_doctor') || 'null') : null,
  
  // Theme state
  darkMode: typeof window !== 'undefined' ? localStorage.getItem('voicerx_theme') !== 'light' : true, // default to dark
  
  // Active clinical state
  patients: [],
  activeSoapResult: null,

  // Setters
  loginStore: (token, doctor) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voicerx_token', token);
      localStorage.setItem('voicerx_doctor', JSON.stringify(doctor));
    }
    set({ token, doctor });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voicerx_token');
      localStorage.removeItem('voicerx_doctor');
    }
    set({ token: null, doctor: null, activeSoapResult: null, patients: [] });
  },

  setDoctor: (doctor) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voicerx_doctor', JSON.stringify(doctor));
    }
    set({ doctor });
  },

  setPatients: (patients) => set({ patients }),
  addPatient: (patient) => set((state) => ({ patients: [patient, ...state.patients] })),

  setActiveSoapResult: (result) => set({ activeSoapResult: result }),

  toggleDarkMode: () => {
    const nextMode = !get().darkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('voicerx_theme', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ darkMode: nextMode });
  },

  initializeTheme: () => {
    const isDark = get().darkMode;
    if (typeof window !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}));

export default useAppStore;
