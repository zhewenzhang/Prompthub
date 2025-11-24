
export interface Role {
  id: string;
  name: string;
  description: string;
  icon: string; // store emoji char or icon name
  color: string; // tailwind color class snippet
  createdAt: number;
}

export interface Scenario {
  id: string;
  roleId: string;
  title: string;
  goal: string;
  createdAt: number;
}

export interface PromptHistoryItem {
  version: number;
  content: string;
  optimizedContent?: string;
  timestamp: number;
}

export interface Prompt {
  id: string;
  scenarioId: string;
  title: string;
  content: string;
  optimizedContent?: string;
  tags: string[];
  version: number;
  createdAt: number;
  updatedAt: number;
  history?: PromptHistoryItem[];
}

export interface Article {
  id: string;
  title: string;
  content: string; // Markdown content
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'dashboard' | 'library' | 'settings' | 'articles';

export type AIProvider = 'gemini' | 'siliconflow';

export interface AppSettings {
  language: 'en' | 'zh';
  theme: 'light' | 'dark'; // Added theme support
  aiProvider: AIProvider;
  gemini: {
    apiKey: string;
    model: string;
  };
  siliconFlow: {
    apiKey: string;
    model: string;
    baseUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
}

export interface AppData {
  roles: Role[];
  scenarios: Scenario[];
  prompts: Prompt[];
  articles: Article[];
}
