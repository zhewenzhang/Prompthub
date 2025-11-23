import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Wand2, 
  Copy, 
  ChevronRight, 
  Database, 
  User, 
  Layers, 
  MessageSquare,
  Search,
  History,
  Clock,
  RotateCcw,
  X,
  Settings,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Loader2
} from 'lucide-react';
import { Role, Scenario, Prompt, PromptHistoryItem, AppSettings, AppData, ViewMode } from './types';
import { optimizePromptWithAI, generateIdeasWithAI } from './services/aiService';
import { 
  uploadBackupToSupabase, 
  downloadBackupFromSupabase, 
  upsertRole, 
  deleteRole, 
  upsertScenario, 
  upsertPrompt 
} from './services/supabaseService';

// --- Helper Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, message, action }: { icon: any, message: string, action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
    <Icon className="w-12 h-12 mb-3 opacity-40" />
    <p className="mb-4 font-medium">{message}</p>
    {action}
  </div>
);

const SyncIndicator = ({ status }: { status: { type: string, msg: string } }) => {
  if (status.type === 'idle' && !status.msg) return null;
  
  const bgColor = 
    status.type === 'loading' ? 'bg-indigo-100 text-indigo-700' : 
    status.type === 'success' ? 'bg-green-100 text-green-700' : 
    status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-white/50 flex items-center space-x-2 transition-all duration-300 animate-in slide-in-from-top-2 ${bgColor}`}>
      {status.type === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
      {status.type === 'error' && <AlertCircle className="w-3 h-3" />}
      <span>{status.msg}</span>
    </div>
  );
};

// --- DEFAULT SETTINGS ---
const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'gemini',
  gemini: {
    apiKey: process.env.API_KEY || '',
    model: 'gemini-2.5-flash'
  },
  siliconFlow: {
    apiKey: '',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    baseUrl: 'https://api.siliconflow.cn/v1'
  },
  supabase: {
    // PRE-CONFIGURED CREDENTIALS
    url: 'https://uwvlduprxppwdkjkvwby.supabase.co',
    anonKey: 'sb_publishable_NCyVuDM0d_Nkn50QvKdY-Q_OCQJsN5L'
  }
};

// --- Main App ---

export default function App() {
  // -- State --
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  
  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('roles');
    return saved ? JSON.parse(saved) : [];
  });
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem('scenarios');
    return saved ? JSON.parse(saved) : [];
  });
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem('prompts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // SMART MERGE: If local storage has empty Supabase keys, inject the defaults.
        // This ensures the auto-config works even if the user visited the site before.
        const mergedSupabase = {
          url: parsed.supabase?.url || DEFAULT_SETTINGS.supabase.url,
          anonKey: parsed.supabase?.anonKey || DEFAULT_SETTINGS.supabase.anonKey
        };
        return { 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          supabase: mergedSupabase
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  
  // History Sidebar
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Form States
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleEmoji, setNewRoleEmoji] = useState('🤖');
  
  const [newScenarioTitle, setNewScenarioTitle] = useState('');
  const [newScenarioGoal, setNewScenarioGoal] = useState('');
  const [suggestingScenarios, setSuggestingScenarios] = useState(false);

  // Prompt Editor State
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorOptimized, setEditorOptimized] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Cloud Sync Status
  const [syncStatus, setSyncStatus] = useState<{type: 'idle' | 'success' | 'error' | 'loading', msg: string}>({ type: 'idle', msg: '' });

  // -- Effects --
  useEffect(() => { localStorage.setItem('roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('scenarios', JSON.stringify(scenarios)); }, [scenarios]);
  useEffect(() => { localStorage.setItem('prompts', JSON.stringify(prompts)); }, [prompts]);
  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(settings)); }, [settings]);

  // Automatic Cloud Sync on Mount
  useEffect(() => {
    const initCloudData = async () => {
      // Ensure we have Supabase credentials
      if (!settings.supabase.url || !settings.supabase.anonKey) return;

      setSyncStatus({ type: 'loading', msg: 'Syncing...' });
      try {
        const cloudData = await downloadBackupFromSupabase(settings);
        if (cloudData) {
          // If we got data, update the local state to match the cloud source of truth
          setRoles(cloudData.roles);
          setScenarios(cloudData.scenarios);
          setPrompts(cloudData.prompts);
          setSyncStatus({ type: 'success', msg: 'Synced' });
        }
      } catch (e) {
        console.error("Auto-sync failed on mount:", e);
        setSyncStatus({ type: 'error', msg: 'Sync Failed' });
      } finally {
        setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 2000);
      }
    };

    initCloudData();
  }, []); // Run once on mount

  // -- Derived State --
  const activeRole = roles.find(r => r.id === selectedRoleId);
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId);
  const activePrompt = prompts.find(p => p.id === selectedPromptId);
  
  const filteredScenarios = scenarios.filter(s => s.roleId === selectedRoleId);
  const filteredPrompts = prompts.filter(p => p.scenarioId === selectedScenarioId);
  
  const isCloudConfigured = !!(settings.supabase.url && settings.supabase.anonKey);

  // -- Handlers --

  const performAutoSync = async (action: () => Promise<any>) => {
    if (!isCloudConfigured) return;
    
    setSyncStatus({ type: 'loading', msg: 'Syncing...' });
    try {
      await action();
      setSyncStatus({ type: 'success', msg: 'Saved' });
      setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 2000);
    } catch (e: any) {
      setSyncStatus({ type: 'error', msg: 'Sync Failed' });
      console.error("Auto-sync error:", e);
      setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 3000);
    }
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    const role: Role = {
      id: crypto.randomUUID(),
      name: newRoleName,
      description: newRoleDesc,
      icon: newRoleEmoji,
      color: 'bg-indigo-100 text-indigo-600',
      createdAt: Date.now()
    };
    setRoles([...roles, role]);
    
    // Auto-Sync
    performAutoSync(() => upsertRole(role, settings));

    setNewRoleName(''); setNewRoleDesc(''); setIsRoleModalOpen(false);
    setSelectedRoleId(role.id);
    setSelectedScenarioId(null);
  };

  const handleDeleteRole = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Delete this role and all its scenarios?")) {
      setRoles(roles.filter(r => r.id !== id));
      setScenarios(scenarios.filter(s => s.roleId !== id));
      
      // Auto-Sync (Database cascade should handle children, we just delete role)
      performAutoSync(() => deleteRole(id, settings));

      if (selectedRoleId === id) {
        setSelectedRoleId(null);
        setSelectedScenarioId(null);
      }
    }
  };

  const handleAddScenario = () => {
    if (!newScenarioTitle.trim() || !selectedRoleId) return;
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      roleId: selectedRoleId,
      title: newScenarioTitle,
      goal: newScenarioGoal,
      createdAt: Date.now()
    };
    setScenarios([...scenarios, scenario]);

    // Auto-Sync
    performAutoSync(() => upsertScenario(scenario, settings));

    setNewScenarioTitle(''); setNewScenarioGoal(''); setIsScenarioModalOpen(false);
    setSelectedScenarioId(scenario.id);
  };

  const handleSuggestScenarios = async () => {
    if (!activeRole) return;
    setSuggestingScenarios(true);
    const ideas = await generateIdeasWithAI(activeRole, settings);
    if (ideas.length > 0) {
       setNewScenarioTitle(ideas[0].title);
       setNewScenarioGoal(ideas[0].goal);
    }
    setSuggestingScenarios(false);
  }

  const handleCreatePrompt = () => {
    if (!selectedScenarioId) return;
    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      scenarioId: selectedScenarioId,
      title: 'New Draft Prompt',
      content: '',
      tags: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };
    setPrompts([...prompts, newPrompt]);
    
    // Auto-Sync
    performAutoSync(() => upsertPrompt(newPrompt, settings));

    setSelectedPromptId(newPrompt.id);
    setEditorTitle(newPrompt.title);
    setEditorContent('');
    setEditorOptimized('');
    setIsEditingPrompt(true);
    setIsHistoryOpen(false);
  };

  const handleSelectPrompt = (p: Prompt) => {
    setSelectedPromptId(p.id);
    setEditorTitle(p.title);
    setEditorContent(p.content);
    setEditorOptimized(p.optimizedContent || '');
    setIsEditingPrompt(true);
    setIsHistoryOpen(false);
  };

  const handleSavePrompt = () => {
    if (!selectedPromptId) return;
    
    let updatedPrompt: Prompt | null = null;

    setPrompts(prev => prev.map(p => {
      if (p.id === selectedPromptId) {
        const historyItem: PromptHistoryItem = {
          version: p.version,
          content: p.content,
          optimizedContent: p.optimizedContent,
          timestamp: p.updatedAt
        };

        const newHistory = p.history ? [...p.history] : [];
        if (p.content || p.optimizedContent) {
           newHistory.push(historyItem);
        }

        updatedPrompt = {
          ...p,
          title: editorTitle,
          content: editorContent,
          optimizedContent: editorOptimized,
          updatedAt: Date.now(),
          version: p.version + 1,
          history: newHistory
        };
        return updatedPrompt;
      }
      return p;
    }));

    // Auto-Sync outside reducer
    if (updatedPrompt) {
        const promptToSave = updatedPrompt as Prompt; // TS Guard
        performAutoSync(() => upsertPrompt(promptToSave, settings));
    }
  };

  const handleRestoreVersion = (historyItem: PromptHistoryItem) => {
    if (confirm(`Restore version ${historyItem.version}? Unsaved changes will be lost.`)) {
      setEditorContent(historyItem.content);
      setEditorOptimized(historyItem.optimizedContent || '');
      setIsHistoryOpen(false);
    }
  };

  const handleOptimize = async () => {
    if (!activeRole || !activeScenario || !editorContent) return;
    setIsOptimizing(true);
    try {
      const result = await optimizePromptWithAI(editorContent, activeRole, activeScenario, settings);
      setEditorOptimized(result);
    } catch (error: any) {
      alert(`Optimization failed: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSaveAndSyncSupabase = async () => {
    if (!settings.supabase.url || !settings.supabase.anonKey) {
        setSyncStatus({ type: 'error', msg: 'Configuration Error' });
        return;
    }
    
    setSyncStatus({ type: 'loading', msg: 'Checking Cloud...' });
    try {
        // 1. Check if cloud has data first
        const cloudData = await downloadBackupFromSupabase(settings);
        
        const hasCloudData = cloudData && (
            cloudData.roles.length > 0 || 
            cloudData.scenarios.length > 0 || 
            cloudData.prompts.length > 0
        );

        if (hasCloudData) {
            // Cloud has data -> Restore it to local
            // In a real app, we might ask to merge, but for "Sync" setup, fetching existing DB is safer
            setRoles(cloudData.roles);
            setScenarios(cloudData.scenarios);
            setPrompts(cloudData.prompts);
            setSyncStatus({ type: 'success', msg: 'Data Downloaded from Cloud' });
        } else {
            // Cloud is empty -> Upload all local data to initialize
            const data: AppData = { roles, scenarios, prompts };
            await uploadBackupToSupabase(data, settings);
            setSyncStatus({ type: 'success', msg: 'Local Data Uploaded' });
        }
    } catch (e: any) {
        console.error(e);
        setSyncStatus({ type: 'error', msg: 'Connection Failed: ' + e.message });
    }
    
    setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 3000);
  };

  const handleCloudSync = async (direction: 'download') => {
     setSyncStatus({ type: 'loading', msg: 'Downloading...' });
     try {
        const data = await downloadBackupFromSupabase(settings);
        if (data) {
          if (confirm("This will overwrite your local data. Continue?")) {
            setRoles(data.roles || []);
            setScenarios(data.scenarios || []);
            setPrompts(data.prompts || []);
            setSyncStatus({ type: 'success', msg: 'Restored!' });
          } else {
            setSyncStatus({ type: 'idle', msg: '' });
          }
        } else {
          setSyncStatus({ type: 'error', msg: 'No data found.' });
        }
     } catch (e: any) {
       setSyncStatus({ type: 'error', msg: e.message });
     }
     setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 3000);
  };

  // -- Render Components --

  const SettingsView = () => (
    <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-y-auto">
      <div className="p-6 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-indigo-600" /> Settings
        </h2>

        {/* AI Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
           <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
             <Cpu className="w-5 h-5 mr-2 text-indigo-500" /> AI Model Configuration
           </h3>
           
           <div className="mb-6">
             <label className="block text-sm font-medium text-slate-700 mb-2">AI Provider</label>
             <div className="flex space-x-4">
               <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${settings.aiProvider === 'gemini' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                 <input 
                   type="radio" 
                   name="provider" 
                   value="gemini" 
                   checked={settings.aiProvider === 'gemini'}
                   onChange={() => setSettings({...settings, aiProvider: 'gemini'})}
                   className="hidden" 
                 />
                 <div className="font-semibold text-slate-800">Google Gemini</div>
                 <div className="text-xs text-slate-500 mt-1">Recommended for stability</div>
               </label>
               <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${settings.aiProvider === 'siliconflow' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                 <input 
                   type="radio" 
                   name="provider" 
                   value="siliconflow" 
                   checked={settings.aiProvider === 'siliconflow'}
                   onChange={() => setSettings({...settings, aiProvider: 'siliconflow'})}
                   className="hidden" 
                 />
                 <div className="font-semibold text-slate-800">SiliconFlow / OpenAI</div>
                 <div className="text-xs text-slate-500 mt-1">Compatible with local models & others</div>
               </label>
             </div>
           </div>

           {settings.aiProvider === 'gemini' ? (
             <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                  <input 
                    type="password"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="AIza..."
                    value={settings.gemini.apiKey}
                    onChange={(e) => setSettings({...settings, gemini: {...settings.gemini, apiKey: e.target.value}})}
                  />
                  <p className="text-xs text-slate-400 mt-1">Leave blank to use environment defaults if hosted appropriately.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="gemini-2.5-flash"
                    value={settings.gemini.model}
                    onChange={(e) => setSettings({...settings, gemini: {...settings.gemini, model: e.target.value}})}
                  />
                </div>
             </div>
           ) : (
             <div className="space-y-4 animate-in fade-in">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://api.siliconflow.cn/v1"
                    value={settings.siliconFlow.baseUrl}
                    onChange={(e) => setSettings({...settings, siliconFlow: {...settings.siliconFlow, baseUrl: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                  <input 
                    type="password"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="sk-..."
                    value={settings.siliconFlow.apiKey}
                    onChange={(e) => setSettings({...settings, siliconFlow: {...settings.siliconFlow, apiKey: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Qwen/Qwen2.5-7B-Instruct"
                    value={settings.siliconFlow.model}
                    onChange={(e) => setSettings({...settings, siliconFlow: {...settings.siliconFlow, model: e.target.value}})}
                  />
                </div>
             </div>
           )}
        </div>

        {/* Storage Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
             <Database className="w-5 h-5 mr-2 text-indigo-500" /> Data Management (Supabase)
           </h3>
           
           <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100 flex items-center">
              <div className="p-2 bg-white rounded-full text-green-600 shadow-sm mr-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Cloud Service Active</h4>
                <p className="text-xs text-slate-500">Your application is automatically connected to the remote database.</p>
              </div>
           </div>

           <div className="flex items-center space-x-4 border-t border-slate-100 pt-4">
              <button 
                onClick={handleSaveAndSyncSupabase}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-sm"
              >
                <CloudUpload className="w-4 h-4 mr-2" />
                Save & Enable Sync
              </button>
              
              <button 
                onClick={() => handleCloudSync('download')}
                className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <CloudDownload className="w-4 h-4 mr-2" />
                Restore from Cloud
              </button>

              {syncStatus.msg && syncStatus.type !== 'loading' && (
                <div className={`text-sm flex items-center ${
                  syncStatus.type === 'success' ? 'text-green-600' : 
                  syncStatus.type === 'error' ? 'text-red-500' : 'text-slate-500'
                }`}>
                  {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 mr-1" />}
                  {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 mr-1" />}
                  {syncStatus.msg}
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Global Sync Status Indicator */}
      <SyncIndicator status={syncStatus} />

      {/* COLUMN 1: SIDEBAR */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm flex-shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <Database className="w-5 h-5" />
            <h1 className="font-bold text-lg tracking-tight">PromptArch</h1>
          </div>
          <p className="text-xs text-slate-500">Role-Based Prompt Manager</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           <div 
             onClick={() => setViewMode('dashboard')}
             className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all font-medium ${viewMode === 'dashboard' ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <Layers className="w-5 h-5" />
             <span>Dashboard</span>
           </div>
           
           <div className="my-4 border-t border-slate-100"></div>

           <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Roles</div>
           
           {roles.map(role => (
            <div 
              key={role.id}
              onClick={() => { 
                setViewMode('dashboard');
                setSelectedRoleId(role.id); 
                setSelectedScenarioId(null); 
                setSelectedPromptId(null); 
                setIsEditingPrompt(false); 
              }}
              className={`group flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                viewMode === 'dashboard' && selectedRoleId === role.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white border border-slate-100 shadow-sm`}>
                {role.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className={`font-medium text-sm truncate ${selectedRoleId === role.id ? 'text-indigo-900' : 'text-slate-700'}`}>{role.name}</h3>
                  <button 
                    onClick={(e) => handleDeleteRole(role.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 truncate">{role.description}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setIsRoleModalOpen(true)}
            className="w-full mt-2 flex items-center justify-center space-x-2 p-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>

        <div className="p-3 border-t border-slate-100">
           <div 
             onClick={() => setViewMode('settings')}
             className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all font-medium ${viewMode === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Settings className="w-5 h-5" />
             <span>Settings</span>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {viewMode === 'settings' ? (
        <SettingsView />
      ) : (
        <>
          {/* COLUMN 2: SCENARIOS */}
          <div className={`w-80 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 transition-opacity duration-300 ${!selectedRoleId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center h-[73px] bg-slate-50/50">
              <div>
                 <h2 className="font-semibold text-slate-800">Scenarios</h2>
                 <p className="text-xs text-slate-500">Contexts for {activeRole?.name || 'Selected Role'}</p>
              </div>
              <button 
                onClick={() => setIsScenarioModalOpen(true)} 
                disabled={!selectedRoleId}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!selectedRoleId ? (
                <EmptyState icon={User} message="Select a Role to view Scenarios" />
              ) : filteredScenarios.length === 0 ? (
                <EmptyState 
                  icon={Layers} 
                  message="No scenarios for this role." 
                  action={
                    <button onClick={() => setIsScenarioModalOpen(true)} className="text-indigo-600 text-sm font-medium hover:underline mt-2">
                      Add Scenario
                    </button>
                  } 
                />
              ) : (
                <div className="space-y-2">
                  {filteredScenarios.map(scenario => (
                    <div 
                      key={scenario.id}
                      onClick={() => { setSelectedScenarioId(scenario.id); setSelectedPromptId(null); setIsEditingPrompt(false); }}
                      className={`p-4 rounded-lg cursor-pointer border transition-all ${
                        selectedScenarioId === scenario.id
                          ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-100'
                          : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow'
                      }`}
                    >
                      <h3 className="font-medium text-slate-800 text-sm mb-1">{scenario.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{scenario.goal}</p>
                      <div className="mt-3 flex items-center text-[10px] text-slate-400 space-x-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                           {prompts.filter(p => p.scenarioId === scenario.id).length} Prompts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: PROMPTS */}
          <div className="flex-1 flex flex-col bg-slate-100 h-full overflow-hidden relative min-w-0">
            {!selectedScenarioId ? (
                 <div className="flex items-center justify-center h-full text-slate-400">
                   <div className="text-center">
                     <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                     <h2 className="text-xl font-light text-slate-500">Select a Scenario</h2>
                   </div>
                 </div>
            ) : !isEditingPrompt ? (
              /* PROMPT LIST VIEW */
              <div className="flex flex-col h-full">
                 <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center h-[73px]">
                   <div>
                      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>Prompts</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <span className="text-indigo-600 font-normal">{activeScenario?.title}</span>
                      </h2>
                   </div>
                   <button 
                     onClick={handleCreatePrompt}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm shadow-indigo-200 transition-all"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     New Prompt
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6">
                    {filteredPrompts.length === 0 ? (
                       <EmptyState icon={MessageSquare} message="No prompts created yet." />
                    ) : (
                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {filteredPrompts.map(prompt => (
                            <div 
                              key={prompt.id}
                              onClick={() => handleSelectPrompt(prompt)}
                              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative hover:border-indigo-200"
                            >
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="p-1.5 bg-slate-100 rounded-full hover:bg-indigo-100 text-slate-400 hover:text-indigo-600">
                                   <Search className="w-4 h-4" />
                                 </div>
                              </div>
                              <h3 className="font-bold text-slate-800 mb-2 pr-8 truncate">{prompt.title}</h3>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 h-24 overflow-hidden relative">
                                <p className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                                  {prompt.optimizedContent || prompt.content}
                                </p>
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${prompt.optimizedContent ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {prompt.optimizedContent ? 'Optimized' : 'Draft'}
                                    </span>
                                    <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    v{prompt.version}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400">
                                   {new Date(prompt.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            ) : (
              /* PROMPT EDITOR VIEW */
              <div className="flex flex-col h-full bg-white relative">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center h-[73px]">
                  <div className="flex items-center space-x-4 flex-1">
                     <button onClick={() => setIsEditingPrompt(false)} className="text-slate-500 hover:text-slate-800 transition-colors p-1 hover:bg-slate-100 rounded">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                     </button>
                     <input 
                       type="text" 
                       value={editorTitle} 
                       onChange={(e) => setEditorTitle(e.target.value)}
                       className="text-xl font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded px-2 py-1 w-full max-w-md"
                       placeholder="Prompt Title"
                     />
                  </div>
                  <div className="flex items-center space-x-3">
                     <button 
                       onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                       className={`p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all relative ${isHistoryOpen ? 'bg-indigo-50 text-indigo-600' : ''}`}
                       title="Version History"
                     >
                        <History className="w-5 h-5" />
                        {activePrompt?.history && activePrompt.history.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                        )}
                     </button>
                     <div className="h-6 w-px bg-slate-200 mx-1"></div>
                     <button 
                       onClick={handleOptimize} 
                       disabled={isOptimizing || !editorContent}
                       className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${
                         isOptimizing 
                         ? 'bg-indigo-100 text-indigo-400 cursor-wait' 
                         : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                       }`}
                     >
                       {isOptimizing ? (
                         <span className="animate-pulse">Optimizing...</span>
                       ) : (
                         <>
                           <Wand2 className="w-4 h-4 mr-2" />
                           Optimize
                         </>
                       )}
                     </button>
                     <button 
                       onClick={handleSavePrompt}
                       className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all shadow-sm active:scale-95"
                     >
                       <Save className="w-4 h-4 mr-2" />
                       Save v{activePrompt ? activePrompt.version + 1 : 1}
                     </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 flex overflow-hidden relative">
                  
                  {/* Main Editors */}
                  <div className="flex-1 flex h-full">
                    {/* Left: Draft */}
                    <div className={`flex-1 p-6 border-r border-slate-200 flex flex-col transition-all duration-300 ${editorOptimized ? 'w-1/2' : 'w-full'}`}>
                        <div className="flex justify-between mb-2 items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Draft</label>
                        <button onClick={() => copyToClipboard(editorContent)} className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100"><Copy className="w-3 h-3" /></button>
                        </div>
                        <textarea 
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="flex-1 w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-4 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed placeholder:text-slate-400"
                        placeholder="Type your raw prompt idea here..."
                        />
                    </div>

                    {/* Right: Optimized (Conditional) */}
                    {editorOptimized && (
                        <div className="flex-1 p-6 flex flex-col bg-indigo-50/30 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between mb-2 items-center">
                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center">
                            <Wand2 className="w-3 h-3 mr-1" /> AI Optimized
                            </label>
                            <div className="flex space-x-2 items-center">
                            <button onClick={() => setEditorContent(editorOptimized)} className="text-xs font-medium text-indigo-600 hover:underline">Apply to Draft</button>
                            <div className="w-px h-3 bg-indigo-200"></div>
                            <button onClick={() => copyToClipboard(editorOptimized)} className="text-indigo-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-100"><Copy className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <textarea 
                            readOnly
                            value={editorOptimized}
                            className="flex-1 w-full bg-white border border-indigo-200 text-slate-900 rounded-lg p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed shadow-sm"
                        />
                        </div>
                    )}
                  </div>

                  {/* History Sidebar */}
                  {isHistoryOpen && (
                      <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto p-4 flex flex-col animate-in slide-in-from-right duration-200 absolute right-0 top-0 bottom-0 z-20 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-slate-500"/> Version History
                            </h3>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                        {activePrompt?.history && activePrompt.history.length > 0 ? (
                            [...activePrompt.history].reverse().map((h) => (
                                <div key={h.version} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm hover:border-indigo-200 transition-colors group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 rounded text-xs">v{h.version}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="text-slate-600 mb-3 text-xs font-mono bg-white p-2 rounded border border-slate-100 max-h-24 overflow-hidden relative">
                                        {h.content || <span className="italic text-slate-300">Empty content</span>}
                                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent"></div>
                                    </div>
                                    <button 
                                        onClick={() => handleRestoreVersion(h)}
                                        className="w-full text-xs text-indigo-600 hover:bg-indigo-50 py-1.5 rounded border border-indigo-100 hover:border-indigo-200 flex items-center justify-center transition-colors font-medium"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1.5"/> Restore this version
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 italic text-xs">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                                No previous versions saved.
                            </div>
                        )}
                        </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MODALS --- */}
      
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Create New Persona">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Avatar (Emoji)</label>
            <input 
              type="text" 
              maxLength={2} 
              className="w-12 h-12 text-center text-2xl border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              value={newRoleEmoji}
              onChange={(e) => setNewRoleEmoji(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
            <input 
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              placeholder="e.g., Senior Frontend Engineer"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Context</label>
            <textarea 
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none placeholder:text-slate-400 leading-relaxed"
              placeholder="Describe the expertise and tone of this persona..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddRole}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            Create Role
          </button>
        </div>
      </Modal>

      <Modal isOpen={isScenarioModalOpen} onClose={() => setIsScenarioModalOpen(false)} title="Add Scenario">
        <div className="space-y-4">
          <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800 mb-2 flex items-center border border-indigo-100">
            <span className="mr-1">Adding scenario for:</span>
            <strong className="font-semibold">{activeRole?.name}</strong>
          </div>
           <div className="flex justify-end">
            <button 
              onClick={handleSuggestScenarios}
              disabled={suggestingScenarios}
              className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
            >
              {suggestingScenarios ? 'Thinking...' : '✨ Suggest ideas with AI'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scenario Title</label>
            <input 
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              placeholder="e.g., Debugging React Code"
              value={newScenarioTitle}
              onChange={(e) => setNewScenarioTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Goal / Outcome</label>
            <textarea 
              className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none placeholder:text-slate-400 leading-relaxed"
              placeholder="What should be achieved in this scenario?"
              value={newScenarioGoal}
              onChange={(e) => setNewScenarioGoal(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddScenario}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            Add Scenario
          </button>
        </div>
      </Modal>

    </div>
  );
}