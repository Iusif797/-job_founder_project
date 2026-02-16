export interface Lead {
  id: string;
  title: string;
  description: string;
  date: string;
  platform: string;
  url: string;
  country?: string; 
  contacts: {
    email?: string;
    phone?: string;
    telegram?: string;
    whatsapp?: string;
    contactName?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    vk?: string;
  };
  tags: string[];
}

export interface SearchFilters {
  mode: 'freelance' | 'vacancy';
  keyword: string;
  location: 'Worldwide' | 'Russia' | 'Europe' | 'Israel' | 'USA' | 'Asia';
  category: 'Web' | 'Mobile' | 'Design' | 'All';
  startDate: string;
  endDate: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface UserProfile {
  name: string;
  skills: string;
  experience: string;
}