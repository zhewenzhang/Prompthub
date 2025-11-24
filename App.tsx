import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Globe,
  BookOpen,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Sun,
  Moon,
  Languages,
  PenTool,
  LayoutTemplate,
  Zap,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  FileText
} from 'lucide-react';
import { Role, Scenario, Prompt, PromptHistoryItem, AppSettings, AppData, ViewMode } from './types';
import { optimizePromptWithAI, generateIdeasWithAI } from './services/aiService';
import { 
  uploadBackupToSupabase, 
  downloadBackupFromSupabase, 
  upsertRole, 
  deleteRole, 
  upsertScenario, 
  upsertPrompt,
  signInUser,
  signUpUser,
  signOutUser,
  getSession
} from './services/supabaseService';
import { translations } from './locales';

// --- Constants ---

const AVAILABLE_SKILLS = [
  { id: 'deepThinking', labelKey: 'skillDeepThinking', instruction: "Please engage in deep, critical analysis before responding. Consider underlying assumptions and potential implications." },
  { id: 'cot', labelKey: 'skillCoT', instruction: "Let's think step by step. Break down the problem into smaller components." },
  { id: 'reflection', labelKey: 'skillReflection', instruction: "After generating the initial response, review it for accuracy and logical consistency. Correct any errors found." },
  { id: 'creative', labelKey: 'skillCreative', instruction: "Use divergent thinking. Provide multiple unique perspectives or creative solutions." }
];

// --- Helper Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, message, action }: { icon: any, message: string, action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
    <Icon className="w-12 h-12 mb-3 opacity-40" />
    <p className="mb-4 font-medium">{message}</p>
    {action}
  </div>
);

const SyncIndicator = ({ status }: { status: { type: string, msg: string } }) => {
  if (status.type === 'idle' && !status.msg) return null;
  
  const bgColor = 
    status.type === 'loading' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' : 
    status.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' : 
    status.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-white/50 dark:border-slate-700/50 flex items-center space-x-2 transition-all duration-300 animate-in slide-in-from-top-2 ${bgColor}`}>
      {status.type === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
      {status.type === 'error' && <AlertCircle className="w-3 h-3" />}
      <span>{status.msg}</span>
    </div>
  );
};

// --- CoStar Guide Component ---
const CoStarGuide = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <article className="prose dark:prose-invert max-w-none">
          <div className="mb-10 pb-8 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">
              CO-STAR 提示詞框架：解鎖 AI 潛能的黃金法則
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              一份為您準備的結構化提示詞指南，助您從零開始掌握引導 AI 生成高品質內容的藝術。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
             <div className="col-span-2">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">什麼是 CO-STAR？</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  CO-STAR 是一個首字母縮寫詞，代表了構成完美指令的六個關鍵要素。它是由新加坡政府科技局（GovTech）推廣的一套方法，被公認為目前最結構化、最有效的提示詞撰寫標準之一。
                </p>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                   <ul className="space-y-2 text-indigo-900 dark:text-indigo-200 font-medium">
                      <li className="flex items-center"><span className="w-8 font-bold">C</span> Context (背景資訊)</li>
                      <li className="flex items-center"><span className="w-8 font-bold">O</span> Objective (任務目標)</li>
                      <li className="flex items-center"><span className="w-8 font-bold">S</span> Style (撰寫風格)</li>
                      <li className="flex items-center"><span className="w-8 font-bold">T</span> Tone (語氣/態度)</li>
                      <li className="flex items-center"><span className="w-8 font-bold">A</span> Audience (目標受眾)</li>
                      <li className="flex items-center"><span className="w-8 font-bold">R</span> Response (輸出格式)</li>
                   </ul>
                </div>
             </div>
             <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white flex flex-col justify-center shadow-lg">
                <Sparkles className="w-12 h-12 mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2">為什麼有效？</h3>
                <p className="opacity-90 text-sm leading-relaxed">
                   只要在寫指令時涵蓋這六點，就能讓 AI 瞬間從「泛泛而談的機器人」變成「懂你的專業助理」。
                </p>
             </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">📚 深度解析：六大要素</h2>
          <div className="overflow-x-auto mb-12 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 font-bold">要素</th>
                  <th className="p-4 font-bold">核心問題</th>
                  <th className="p-4 font-bold hidden md:table-cell">為什麼重要？</th>
                  <th className="p-4 font-bold">範例 (以寫郵件為例)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr className="bg-white dark:bg-slate-900">
                  <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Context</td>
                  <td className="p-4">背景是什麼？</td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">AI 缺乏背景知識。情境可限制範圍，減少幻覺。</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">「我是一家軟體公司的產品經理，新功能上線延遲了。」</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Objective</td>
                  <td className="p-4">你要做什麼？</td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">指令的核心。告訴 AI 具體要完成什麼任務。</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">「請幫我寫一封解釋延遲原因並安撫客戶的郵件。」</td>
                </tr>
                <tr className="bg-white dark:bg-slate-900">
                  <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Style</td>
                  <td className="p-4">模仿誰的風格？</td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">指定寫作風格（如：簡潔有力、商業大師）。</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">「使用 Steve Jobs 的風格，簡潔、自信且具說服力。」</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Tone</td>
                  <td className="p-4">語氣如何？</td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">設定情感色彩，決定讀者的感受。</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">「語氣誠懇、帶有歉意，但展現對品質的堅持。」</td>
                </tr>
                <tr className="bg-white dark:bg-slate-900">
                  <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Audience</td>
                  <td className="p-4">寫給誰看？</td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">根據讀者調整用詞難度。</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">「目標受眾是長期支持我們的 VIP 企業客戶。」</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Response</td>
                  <td className="p-4">格式長怎樣？</td>
                  <td className="p-4 text-slate-500 hidden md:table-cell">規定輸出的形式（表格、代碼、清單）。</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">「以 Markdown 格式輸出，不要有其他廢話。」</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">🆚 實戰對比</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 rounded-xl">
               <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold mb-4">
                  <ThumbsDown className="w-5 h-5" />
                  <span>普通指令 (The Average Prompt)</span>
               </div>
               <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 mb-4 shadow-sm text-sm">
                 「幫我寫一個 Facebook 貼文，宣傳我們的有機咖啡豆。」
               </div>
               <p className="text-xs text-red-600/80 dark:text-red-400/80">
                 <strong className="block mb-1">AI 的反應：</strong> 
                 AI 會給出一個非常通用的貼文，可能充滿了陳腔濫調，且不一定符合你的品牌調性。
               </p>
            </div>

            <div className="border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 p-6 rounded-xl">
               <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 font-bold mb-4">
                  <ThumbsUp className="w-5 h-5" />
                  <span>CO-STAR 指令 (The CO-STAR Prompt)</span>
               </div>
               <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 mb-4 shadow-sm text-xs leading-relaxed">
                 <span className="font-bold text-indigo-600">C:</span> 公平貿易精品咖啡店，剛進口稀有衣索比亞豆。<br/>
                 <span className="font-bold text-indigo-600">O:</span> FB貼文，吸引顧客試飲並預購。<br/>
                 <span className="font-bold text-indigo-600">S:</span> 生活風格部落客，注重感官描述。<br/>
                 <span className="font-bold text-indigo-600">T:</span> 熱情、溫暖、文藝。<br/>
                 <span className="font-bold text-indigo-600">A:</span> 25-40歲都會上班族。<br/>
                 <span className="font-bold text-indigo-600">R:</span> 短文，含Emoji，加3個Hashtag。
               </div>
               <p className="text-xs text-green-600/80 dark:text-green-400/80">
                 <strong className="block mb-1">AI 的反應：</strong> 
                 AI 會寫出一段描述咖啡香氣、強調公平貿易故事的感性文案，精準擊中目標客群的痛點。
               </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">🛠️ 立即上手：CO-STAR 萬用模板</h2>
          <div className="bg-slate-900 text-slate-200 p-6 rounded-xl font-mono text-sm shadow-2xl relative mb-12">
             <div className="absolute top-4 right-4 text-slate-500 text-xs">Markdown</div>
             <pre className="whitespace-pre-wrap">
{`# CO-STAR Prompt 模板

1. **Context (背景)**: [在此輸入你的身份、現狀或背景資訊...]
2. **Objective (目標)**: [在此輸入你希望 AI 完成的具體任務...]
3. **Style (風格)**: [在此輸入寫作風格，例如：像某位名人、專業學術、口語化...]
4. **Tone (語氣)**: [在此輸入情感態度，例如：幽默、嚴肅、激勵人心...]
5. **Audience (受眾)**: [在此輸入這份內容是給誰看的...]
6. **Response (格式)**: [在此輸入你想要的輸出格式，例如：表格、條列式...]

---
請根據以上指示執行任務。`}
             </pre>
             <button 
                onClick={() => navigator.clipboard.writeText(`# CO-STAR Prompt 模板...`)}
                className="mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs flex items-center inline-flex transition-colors"
             >
                <Copy className="w-3 h-3 mr-1.5" /> 複製模板
             </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 rounded-r-xl">
             <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center">
               <Lightbulb className="w-5 h-5 mr-2" /> 給用戶的小撇步
             </h3>
             <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li><strong>風格 (Style) vs. 語氣 (Tone)：</strong> 風格是「寫作習慣」（長短句、用詞），語氣是「背後情緒」（憤怒、開心）。</li>
                <li><strong>R (格式) 很關鍵：</strong> 工作使用時務必明確指定（如 Excel, JSON），節省排版時間。</li>
                <li><strong>迭代優化：</strong> 結果不完美通常是 Context 不夠多。回頭微調 Context 和 Style 再次發送。</li>
             </ul>
          </div>

        </article>
      </div>
    </div>
  );
};

// --- DEFAULT SETTINGS ---
const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh',
  theme: 'light',
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

// --- Auth Component ---

const AuthPage = ({ settings, onLoginSuccess }: { settings: AppSettings, onLoginSuccess: (user: any) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const t = translations[settings.language] || translations.zh;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { session, user } = await signInUser(settings, email, password);
        if (user && session) {
          onLoginSuccess(user);
        } else {
           setError(t.auth.loginFailed);
        }
      } else {
        const { session, user } = await signUpUser(settings, email, password, username);
        if (user) {
          if (!session) {
            setError(t.auth.regSuccess);
            setIsLogin(true);
          } else {
            onLoginSuccess(user);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        <div className="w-full p-8">
           <div className="mb-8 text-center">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-3">
               <Database className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t.appName}</h1>
             <p className="text-slate-500 text-sm mt-1">
               {isLogin ? t.auth.welcome : t.auth.create}
             </p>
           </div>

           <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 ml-1">{t.auth.username}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required={!isLogin}
                      placeholder="johndoe"
                      className="w-full pl-10 pr-3 py-2 bg-white text-black placeholder:text-gray-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 ml-1">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2 bg-white text-black placeholder:text-gray-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 ml-1">{t.auth.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 bg-white text-black placeholder:text-gray-400 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-2 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md shadow-indigo-200 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>{isLogin ? t.auth.signIn : t.auth.createAccount}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
           </form>

           <div className="mt-6 text-center text-sm text-slate-500">
             {isLogin ? t.auth.noAccount : t.auth.haveAccount}
             <button 
               onClick={() => { setIsLogin(!isLogin); setError(''); }}
               className="text-indigo-600 font-semibold hover:underline ml-1"
             >
               {isLogin ? t.auth.signUp : t.auth.signIn}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard Home Component ---
const DashboardHome = ({ settings, user, onOpenGuide }: { settings: AppSettings, user: any, onOpenGuide: (guide: string) => void }) => {
    const t = translations[settings.language] || translations.zh;
    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
    
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6 md:p-10 transition-colors">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="space-y-2 mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      {t.dashboardHome.welcome} {username}
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">{t.dashboardHome.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Column 1: Learning Hub */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t.dashboardHome.learnTitle}</h2>
                        </div>
                        
                        <div className="grid gap-4">
                            {t.dashboardHome.tips.map((tip: any, index: number) => (
                                <div key={index} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-start space-x-4">
                                        <div className="mt-1 p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                            <Lightbulb className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{tip.title}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Recommended Structures */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t.dashboardHome.recTitle}</h2>
                        </div>
                        
                         <div className="grid gap-4">
                            {t.dashboardHome.frameworks.map((fw: any, index: number) => {
                                const isCostar = fw.name.includes('CO-STAR');
                                return (
                                <div 
                                    key={index} 
                                    onClick={isCostar ? () => onOpenGuide('costar') : undefined}
                                    className={`bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all relative overflow-hidden group ${isCostar ? 'cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600' : ''}`}
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/20 to-transparent rounded-bl-full -mr-4 -mt-4"></div>
                                    <h3 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2 relative z-10 flex items-center">
                                        {fw.name}
                                        {isCostar && <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 relative z-10">{fw.desc}</p>
                                </div>
                                );
                            })}
                            
                            <div className="bg-indigo-600 dark:bg-indigo-700 text-white p-6 rounded-xl shadow-lg mt-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{t.createRole}</h3>
                                    <p className="text-indigo-100 dark:text-indigo-200 text-sm">Start applying these frameworks now.</p>
                                </div>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};


// --- Main App ---

export default function App() {
  // -- State --
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  
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
        const mergedSupabase = {
          url: parsed.supabase?.url || DEFAULT_SETTINGS.supabase.url,
          anonKey: parsed.supabase?.anonKey || DEFAULT_SETTINGS.supabase.anonKey
        };
        // Init language if missing
        if (!parsed.language) parsed.language = 'zh';
        if (!parsed.theme) parsed.theme = 'light';
        
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

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Prompt Editor State
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorOptimized, setEditorOptimized] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Guided Mode State
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [guidedInputs, setGuidedInputs] = useState({
    role: '',
    context: '',
    task: '',
    constraints: '',
    format: '',
    tone: '',
    skills: [] as string[]
  });

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

  // Cloud Sync Status
  const [syncStatus, setSyncStatus] = useState<{type: 'idle' | 'success' | 'error' | 'loading', msg: string}>({ type: 'idle', msg: '' });

  const t = translations[settings.language] || translations.zh;

  // -- Effects --
  useEffect(() => { localStorage.setItem('roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('scenarios', JSON.stringify(scenarios)); }, [scenarios]);
  useEffect(() => { localStorage.setItem('prompts', JSON.stringify(prompts)); }, [prompts]);
  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(settings)); }, [settings]);

  // Apply Theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Check for active session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession(settings);
      if (session) {
        setUser(session.user);
      }
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  // Automatic Cloud Sync when User is authenticated
  useEffect(() => {
    if (!user) return; // Don't sync if not logged in

    const initCloudData = async () => {
      // Ensure we have Supabase credentials
      if (!settings.supabase.url || !settings.supabase.anonKey) return;

      setSyncStatus({ type: 'loading', msg: t.sync.syncing });
      try {
        const cloudData = await downloadBackupFromSupabase(settings);
        if (cloudData && (cloudData.roles.length > 0 || cloudData.scenarios.length > 0)) {
          setRoles(cloudData.roles);
          setScenarios(cloudData.scenarios);
          setPrompts(cloudData.prompts);
          setSyncStatus({ type: 'success', msg: t.sync.synced });
        } else {
           setSyncStatus({ type: 'idle', msg: '' });
        }
      } catch (e) {
        console.error("Auto-sync failed on mount:", e);
        setSyncStatus({ type: 'error', msg: t.sync.failed });
      } finally {
        setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 2000);
      }
    };

    initCloudData();
  }, [user]); 

  // -- Derived State --
  const activeRole = roles.find(r => r.id === selectedRoleId);
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId);
  const activePrompt = prompts.find(p => p.id === selectedPromptId);
  
  const filteredScenarios = scenarios.filter(s => s.roleId === selectedRoleId);
  const filteredPrompts = prompts.filter(p => p.scenarioId === selectedScenarioId);
  
  const isCloudConfigured = !!(settings.supabase.url && settings.supabase.anonKey);

  // -- Search Logic --
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { roles: [], scenarios: [], prompts: [] };
    const lowerQuery = searchQuery.toLowerCase();

    return {
      roles: roles.filter(r => r.name.toLowerCase().includes(lowerQuery) || r.description.toLowerCase().includes(lowerQuery)),
      scenarios: scenarios.filter(s => s.title.toLowerCase().includes(lowerQuery) || s.goal.toLowerCase().includes(lowerQuery)),
      prompts: prompts.filter(p => p.title.toLowerCase().includes(lowerQuery) || p.content.toLowerCase().includes(lowerQuery) || (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))))
    };
  }, [searchQuery, roles, scenarios, prompts]);

  // -- Handlers --

  const handleSignOut = async () => {
    await signOutUser(settings);
    setUser(null);
    setRoles([]);
    setScenarios([]);
    setPrompts([]);
  };

  const toggleLanguage = () => {
    setSettings(prev => ({
      ...prev,
      language: prev.language === 'en' ? 'zh' : 'en'
    }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const performAutoSync = async (action: () => Promise<any>) => {
    if (!isCloudConfigured || !user) return;
    
    setSyncStatus({ type: 'loading', msg: t.sync.syncing });
    try {
      await action();
      setSyncStatus({ type: 'success', msg: t.sync.saved });
      setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 2000);
    } catch (e: any) {
      setSyncStatus({ type: 'error', msg: e.message || t.sync.failed });
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
    performAutoSync(() => upsertRole(role, settings));
    setNewRoleName(''); setNewRoleDesc(''); setIsRoleModalOpen(false);
    setSelectedRoleId(role.id);
    setSelectedScenarioId(null);
  };

  const handleDeleteRole = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm(t.alerts.deleteRole)) {
      setRoles(roles.filter(r => r.id !== id));
      setScenarios(scenarios.filter(s => s.roleId !== id));
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
      title: t.originalDraft,
      content: '',
      tags: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };
    setPrompts([...prompts, newPrompt]);
    performAutoSync(() => upsertPrompt(newPrompt, settings));
    setSelectedPromptId(newPrompt.id);
    setEditorTitle(newPrompt.title);
    setEditorContent('');
    setEditorOptimized('');
    setIsEditingPrompt(true);
    setIsHistoryOpen(false);
    // Reset Guided Mode
    setIsGuidedMode(false);
    setGuidedInputs({role: '', context: '', task: '', constraints: '', format: '', tone: '', skills: []});
  };

  const handleSelectPrompt = (p: Prompt) => {
    setSelectedPromptId(p.id);
    setEditorTitle(p.title);
    setEditorContent(p.content);
    setEditorOptimized(p.optimizedContent || '');
    setIsEditingPrompt(true);
    setIsHistoryOpen(false);
    // Reset Guided Mode (Assume prompt is freeform unless we saved structure, which we don't yet)
    setIsGuidedMode(false);
    setGuidedInputs({role: '', context: '', task: '', constraints: '', format: '', tone: '', skills: []});
  };

  const generatePromptFromStructure = (inputs: typeof guidedInputs) => {
      let prompt = "";
      if (inputs.role) prompt += `# Role\n${inputs.role}\n\n`;
      if (inputs.context) prompt += `# Context\n${inputs.context}\n\n`;
      if (inputs.task) prompt += `# Task\n${inputs.task}\n\n`;
      if (inputs.constraints) prompt += `# Constraints\n${inputs.constraints}\n\n`;
      if (inputs.format) prompt += `# Format\n${inputs.format}\n\n`;
      if (inputs.tone) prompt += `# Tone\n${inputs.tone}\n\n`;
      
      if (inputs.skills && inputs.skills.length > 0) {
        prompt += `# Capabilities\n`;
        inputs.skills.forEach(skillId => {
          const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);
          if (skill) {
            prompt += `- ${skill.instruction}\n`;
          }
        });
      }

      return prompt.trim();
  };

  const handleGuidedChange = (key: keyof typeof guidedInputs, value: any) => {
      const newInputs = { ...guidedInputs, [key]: value };
      setGuidedInputs(newInputs);
      const newContent = generatePromptFromStructure(newInputs);
      setEditorContent(newContent);
  };

  const toggleGuidedSkill = (skillId: string) => {
    const currentSkills = guidedInputs.skills || [];
    const newSkills = currentSkills.includes(skillId) 
      ? currentSkills.filter(id => id !== skillId)
      : [...currentSkills, skillId];
    
    handleGuidedChange('skills', newSkills);
  };

  const handleSavePrompt = () => {
    if (!selectedPromptId) return;
    
    const currentRole = roles.find(r => r.id === selectedRoleId);
    const currentScenario = scenarios.find(s => s.id === selectedScenarioId);

    const promptIndex = prompts.findIndex(p => p.id === selectedPromptId);
    if (promptIndex === -1) return;
    const existingPrompt = prompts[promptIndex];

    const historyItem: PromptHistoryItem = {
      version: existingPrompt.version,
      content: existingPrompt.content,
      optimizedContent: existingPrompt.optimizedContent,
      timestamp: existingPrompt.updatedAt
    };

    const newHistory = existingPrompt.history ? [...existingPrompt.history] : [];
    if (existingPrompt.content || existingPrompt.optimizedContent) {
       newHistory.push(historyItem);
    }

    const updatedPrompt: Prompt = {
      ...existingPrompt,
      title: editorTitle,
      content: editorContent,
      optimizedContent: editorOptimized,
      updatedAt: Date.now(),
      version: existingPrompt.version + 1,
      history: newHistory
    };

    const newPromptsList = [...prompts];
    newPromptsList[promptIndex] = updatedPrompt;
    setPrompts(newPromptsList);

    performAutoSync(async () => {
        if (currentRole) await upsertRole(currentRole, settings);
        if (currentScenario) await upsertScenario(currentScenario, settings);
        await upsertPrompt(updatedPrompt, settings);
    });
  };

  const handleRestoreVersion = (historyItem: PromptHistoryItem) => {
    if (confirm(t.alerts.restoreVersion.replace('{v}', historyItem.version.toString()))) {
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
      alert(`${t.alerts.optimizationFailed} ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSaveAndSyncSupabase = async () => {
    if (!settings.supabase.url || !settings.supabase.anonKey) {
        setSyncStatus({ type: 'error', msg: t.alerts.checkConfig });
        return;
    }
    
    setSyncStatus({ type: 'loading', msg: t.alerts.checkingCloud });
    try {
        const cloudData = await downloadBackupFromSupabase(settings);
        
        const hasCloudData = cloudData && (
            cloudData.roles.length > 0 || 
            cloudData.scenarios.length > 0 || 
            cloudData.prompts.length > 0
        );

        if (hasCloudData) {
             if(confirm(t.sync.cloudDataFound)) {
                 setRoles(cloudData.roles);
                 setScenarios(cloudData.scenarios);
                 setPrompts(cloudData.prompts);
                 setSyncStatus({ type: 'success', msg: t.alerts.downloaded });
                 return;
             }
        } 
        
        const data: AppData = { roles, scenarios, prompts };
        await uploadBackupToSupabase(data, settings);
        setSyncStatus({ type: 'success', msg: t.alerts.localUploaded });
        
    } catch (e: any) {
        console.error(e);
        setSyncStatus({ type: 'error', msg: `${t.alerts.connectionFailed} ${e.message}` });
    }
    
    setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 3000);
  };

  const handleCloudSync = async (direction: 'download') => {
     setSyncStatus({ type: 'loading', msg: t.sync.downloading });
     try {
        const data = await downloadBackupFromSupabase(settings);
        if (data) {
          if (confirm(t.sync.overwriteLocal)) {
            setRoles(data.roles || []);
            setScenarios(data.scenarios || []);
            setPrompts(data.prompts || []);
            setSyncStatus({ type: 'success', msg: t.sync.restored });
          } else {
            setSyncStatus({ type: 'idle', msg: '' });
          }
        } else {
          setSyncStatus({ type: 'error', msg: t.sync.noData });
        }
     } catch (e: any) {
       setSyncStatus({ type: 'error', msg: e.message });
     }
     setTimeout(() => setSyncStatus({ type: 'idle', msg: '' }), 3000);
  };

  const handleSearchResultClick = (type: 'role' | 'scenario' | 'prompt', item: any) => {
      if (type === 'role') {
          setSelectedRoleId(item.id);
          setSelectedScenarioId(null);
          setSelectedPromptId(null);
          setIsEditingPrompt(false);
      } else if (type === 'scenario') {
          setSelectedRoleId(item.roleId);
          setSelectedScenarioId(item.id);
          setSelectedPromptId(null);
          setIsEditingPrompt(false);
      } else if (type === 'prompt') {
          const s = scenarios.find(s => s.id === item.scenarioId);
          if (s) {
              setSelectedRoleId(s.roleId);
              setSelectedScenarioId(item.scenarioId);
              handleSelectPrompt(item); 
          }
      }
      setViewMode('dashboard');
      setSearchQuery('');
      setActiveGuide(null);
  };

  // -- Render Components --

  if (authChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
         <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage settings={settings} onLoginSuccess={setUser} />;
  }

  const SettingsView = () => (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 h-full overflow-y-auto transition-colors">
      <div className="p-6 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" /> {t.settingsPage.title}
        </h2>
        
        {/* AI Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
             <Cpu className="w-5 h-5 mr-2 text-indigo-500" /> {t.settingsPage.aiConfig}
           </h3>
           
           <div className="mb-6">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.settingsPage.provider}</label>
             <div className="flex space-x-4">
               <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${settings.aiProvider === 'gemini' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                 <input 
                   type="radio" 
                   name="provider" 
                   value="gemini" 
                   checked={settings.aiProvider === 'gemini'}
                   onChange={() => setSettings({...settings, aiProvider: 'gemini'})}
                   className="hidden" 
                 />
                 <div className="font-semibold text-slate-800 dark:text-slate-200">Google Gemini</div>
               </label>
               <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${settings.aiProvider === 'siliconflow' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                 <input 
                   type="radio" 
                   name="provider" 
                   value="siliconflow" 
                   checked={settings.aiProvider === 'siliconflow'}
                   onChange={() => setSettings({...settings, aiProvider: 'siliconflow'})}
                   className="hidden" 
                 />
                 <div className="font-semibold text-slate-800 dark:text-slate-200">SiliconFlow / OpenAI</div>
               </label>
             </div>
           </div>

           {settings.aiProvider === 'gemini' ? (
             <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsPage.geminiKey}</label>
                  <input 
                    type="password"
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="AIza..."
                    value={settings.gemini.apiKey}
                    onChange={(e) => setSettings({...settings, gemini: {...settings.gemini, apiKey: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsPage.modelName}</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="gemini-2.5-flash"
                    value={settings.gemini.model}
                    onChange={(e) => setSettings({...settings, gemini: {...settings.gemini, model: e.target.value}})}
                  />
                </div>
             </div>
           ) : (
             <div className="space-y-4 animate-in fade-in">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsPage.baseUrl}</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://api.siliconflow.cn/v1"
                    value={settings.siliconFlow.baseUrl}
                    onChange={(e) => setSettings({...settings, siliconFlow: {...settings.siliconFlow, baseUrl: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsPage.apiKey}</label>
                  <input 
                    type="password"
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="sk-..."
                    value={settings.siliconFlow.apiKey}
                    onChange={(e) => setSettings({...settings, siliconFlow: {...settings.siliconFlow, apiKey: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.settingsPage.modelName}</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Qwen/Qwen2.5-7B-Instruct"
                    value={settings.siliconFlow.model}
                    onChange={(e) => setSettings({...settings, siliconFlow: {...settings.siliconFlow, model: e.target.value}})}
                  />
                </div>
             </div>
           )}
        </div>

        {/* Storage Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
             <Database className="w-5 h-5 mr-2 text-indigo-500" /> {t.settingsPage.dataMgmt}
           </h3>
           
           <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800 flex items-center">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-green-600 dark:text-green-400 shadow-sm mr-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t.settingsPage.cloudActive}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.settingsPage.cloudDesc}</p>
              </div>
           </div>

           <div className="flex items-center space-x-4 border-t border-slate-100 dark:border-slate-700 pt-4">
              <button 
                onClick={handleSaveAndSyncSupabase}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-sm"
              >
                <CloudUpload className="w-4 h-4 mr-2" />
                {t.settingsPage.saveSync}
              </button>
              
              <button 
                onClick={() => handleCloudSync('download')}
                className="flex items-center px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <CloudDownload className="w-4 h-4 mr-2" />
                {t.settingsPage.restoreCloud}
              </button>
           </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Global Sync Status Indicator */}
      <SyncIndicator status={syncStatus} />

      {/* COLUMN 1: SIDEBAR */}
      <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-sm flex-shrink-0 transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Database className="w-5 h-5" />
            <h1 className="font-bold text-lg tracking-tight">{t.appName}</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.subTitle}</p>
        </div>
        
        {/* Search Input Area */}
        <div className="px-4 pt-4 pb-2">
            <div className="relative z-20">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    type="text"
                    placeholder={t.search.placeholder}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Search Results Dropdown */}
                {searchQuery.trim() && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto overflow-x-hidden">
                        {(searchResults.roles.length === 0 && searchResults.scenarios.length === 0 && searchResults.prompts.length === 0) ? (
                            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">{t.search.noResults}</div>
                        ) : (
                            <div className="py-2">
                                {/* Roles */}
                                {searchResults.roles.length > 0 && (
                                    <div>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.search.roles}</div>
                                        {searchResults.roles.map(r => (
                                            <div 
                                                key={r.id} 
                                                onClick={() => handleSearchResultClick('role', r)}
                                                className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex items-center space-x-2"
                                            >
                                                <span className="text-base">{r.icon}</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Scenarios */}
                                {searchResults.scenarios.length > 0 && (
                                    <div>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">{t.search.scenarios}</div>
                                        {searchResults.scenarios.map(s => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => handleSearchResultClick('scenario', s)}
                                                className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                                            >
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.title}</div>
                                                <div className="text-xs text-slate-500 truncate">{s.goal}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Prompts */}
                                {searchResults.prompts.length > 0 && (
                                    <div>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">{t.search.prompts}</div>
                                        {searchResults.prompts.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => handleSearchResultClick('prompt', p)}
                                                className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                                            >
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{p.title}</div>
                                                <div className="text-xs text-slate-500 truncate font-mono opacity-70">
                                                    {(p.optimizedContent || p.content).substring(0, 40)}...
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           <div 
             onClick={() => {
                setViewMode('dashboard');
                setSelectedRoleId(null); // Reset to Home
                setSelectedScenarioId(null);
                setActiveGuide(null);
             }}
             className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all font-medium ${viewMode === 'dashboard' && !selectedRoleId ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <Layers className="w-5 h-5" />
             <span>{t.dashboard}</span>
           </div>
           
           <div className="my-4 border-t border-slate-100 dark:border-slate-700"></div>

           <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.roles}</div>
           
           {roles.map(role => (
            <div 
              key={role.id}
              onClick={() => { 
                setViewMode('dashboard');
                setSelectedRoleId(role.id); 
                setSelectedScenarioId(null); 
                setSelectedPromptId(null); 
                setIsEditingPrompt(false); 
                setActiveGuide(null);
              }}
              className={`group flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                viewMode === 'dashboard' && selectedRoleId === role.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm`}>
                {role.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className={`font-medium text-sm truncate ${selectedRoleId === role.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{role.name}</h3>
                  <button 
                    onClick={(e) => handleDeleteRole(role.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{role.description}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setIsRoleModalOpen(true)}
            className="w-full mt-2 flex items-center justify-center space-x-2 p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createRole}</span>
          </button>
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
           {/* Sidebar Toggles */}
           <div className="flex items-center justify-between mb-2 px-1">
             <button 
               onClick={toggleLanguage}
               className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
               title="Toggle Language"
             >
                <Globe className="w-3.5 h-3.5" />
                <span>{settings.language === 'en' ? 'EN' : '中文'}</span>
             </button>

             <button 
               onClick={toggleTheme}
               className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
               title="Toggle Theme"
             >
                {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>
           </div>

           <div 
             onClick={() => setViewMode('settings')}
             className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all font-medium ${viewMode === 'settings' ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}
           >
             <Settings className="w-5 h-5" />
             <span>{t.settings}</span>
           </div>
           
           <div 
             onClick={handleSignOut}
             className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all font-medium text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
           >
             <LogOut className="w-5 h-5" />
             <span>{t.signOut}</span>
           </div>
           
           {user && (
             <div className="px-3 pt-2 text-[10px] text-slate-400 text-center truncate">
               {t.auth.username}: {user.user_metadata?.username || user.email}
             </div>
           )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {activeGuide === 'costar' ? (
        <CoStarGuide onBack={() => setActiveGuide(null)} />
      ) : viewMode === 'settings' ? (
        <SettingsView />
      ) : !selectedRoleId ? (
        // DASHBOARD HOME VIEW (When no role selected)
        <DashboardHome settings={settings} user={user} onOpenGuide={setActiveGuide} />
      ) : (
        // WORKSPACE VIEW (When role selected)
        <>
          {/* COLUMN 2: SCENARIOS */}
          <div className={`w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 transition-all duration-300 ${!selectedRoleId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center h-[73px] bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                 <h2 className="font-semibold text-slate-800 dark:text-slate-200">{t.scenarios}</h2>
                 <p className="text-xs text-slate-500">{t.contextsFor} {activeRole?.name}</p>
              </div>
              <button 
                onClick={() => setIsScenarioModalOpen(true)} 
                disabled={!selectedRoleId}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!selectedRoleId ? (
                <EmptyState icon={User} message={t.selectRole} />
              ) : filteredScenarios.length === 0 ? (
                <EmptyState 
                  icon={Layers} 
                  message={t.noScenarios} 
                  action={
                    <button onClick={() => setIsScenarioModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline mt-2">
                      {t.addScenario}
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
                          ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow'
                      }`}
                    >
                      <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">{scenario.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{scenario.goal}</p>
                      <div className="mt-3 flex items-center text-[10px] text-slate-400 space-x-2">
                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                           {prompts.filter(p => p.scenarioId === scenario.id).length} {t.prompts}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: PROMPTS */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 h-full overflow-hidden relative min-w-0 transition-colors">
            {!selectedScenarioId ? (
                 <div className="flex items-center justify-center h-full text-slate-400">
                   <div className="text-center">
                     <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                     <h2 className="text-xl font-light text-slate-500 dark:text-slate-400">{t.selectScenario}</h2>
                   </div>
                 </div>
            ) : !isEditingPrompt ? (
              /* PROMPT LIST VIEW */
              <div className="flex flex-col h-full">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center h-[73px]">
                   <div>
                      <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>{t.prompts}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <span className="text-indigo-600 dark:text-indigo-400 font-normal">{activeScenario?.title}</span>
                      </h2>
                   </div>
                   <button 
                     onClick={handleCreatePrompt}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm shadow-indigo-200 dark:shadow-none transition-all"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     {t.newPrompt}
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6">
                    {filteredPrompts.length === 0 ? (
                       <EmptyState icon={MessageSquare} message={t.noPrompts} />
                    ) : (
                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {filteredPrompts.map(prompt => (
                            <div 
                              key={prompt.id}
                              onClick={() => handleSelectPrompt(prompt)}
                              className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group relative hover:border-indigo-200 dark:hover:border-indigo-800"
                            >
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                   <Search className="w-4 h-4" />
                                 </div>
                              </div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 pr-8 truncate">{prompt.title}</h3>
                              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mb-3 h-24 overflow-hidden relative">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">
                                  {prompt.optimizedContent || prompt.content}
                                </p>
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${prompt.optimizedContent ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                    {prompt.optimizedContent ? t.optimized : t.manual}
                                    </span>
                                    <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
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
              <div className="flex flex-col h-full bg-white dark:bg-slate-800 relative">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center h-[73px]">
                  <div className="flex items-center space-x-4 flex-1">
                     <button onClick={() => setIsEditingPrompt(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                     </button>
                     <input 
                       type="text" 
                       value={editorTitle} 
                       onChange={(e) => setEditorTitle(e.target.value)}
                       className="text-xl font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 rounded px-2 py-1 w-full max-w-md"
                       placeholder={t.modals.scenarioTitle}
                     />
                  </div>
                  <div className="flex items-center space-x-3">
                     <button 
                       onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                       className={`p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 transition-all relative ${isHistoryOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''}`}
                       title={t.versionHistory}
                     >
                        <History className="w-5 h-5" />
                        {activePrompt?.history && activePrompt.history.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                        )}
                     </button>
                     <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                     <button 
                       onClick={handleOptimize} 
                       disabled={isOptimizing || !editorContent}
                       className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${
                         isOptimizing 
                         ? 'bg-indigo-100 text-indigo-400 cursor-wait dark:bg-indigo-900/50 dark:text-indigo-300' 
                         : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/40'
                       }`}
                     >
                       {isOptimizing ? (
                         <span className="animate-pulse">{t.optimizing}</span>
                       ) : (
                         <>
                           <Wand2 className="w-4 h-4 mr-2" />
                           {t.optimize}
                         </>
                       )}
                     </button>
                     <button 
                       onClick={handleSavePrompt}
                       className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all shadow-sm active:scale-95"
                     >
                       <Save className="w-4 h-4 mr-2" />
                       {t.save} v{activePrompt ? activePrompt.version + 1 : 1}
                     </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 flex overflow-hidden relative">
                  
                  {/* Main Editors */}
                  <div className="flex-1 flex h-full">
                    {/* Left: Draft */}
                    <div className={`flex-1 p-0 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ${editorOptimized ? 'w-1/2' : 'w-full'}`}>
                        {/* Mode Toggle Bar */}
                        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 px-6 py-2 bg-slate-50/50 dark:bg-slate-800/50">
                            <button
                                onClick={() => setIsGuidedMode(false)}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all mr-2 ${!isGuidedMode ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>{t.editor.modeFree}</span>
                            </button>
                            <button
                                onClick={() => setIsGuidedMode(true)}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isGuidedMode ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <LayoutTemplate className="w-3.5 h-3.5" />
                                <span>{t.editor.modeGuided}</span>
                            </button>
                            <div className="flex-1"></div>
                            <button onClick={() => copyToClipboard(editorContent)} className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center text-xs">
                                <Copy className="w-3 h-3 mr-1" /> {t.copy}
                            </button>
                        </div>

                        <div className="flex-1 relative overflow-y-auto">
                            {isGuidedMode ? (
                                <div className="p-6 space-y-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg flex items-start">
                                        <Sparkles className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                        {t.editor.guideNote}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.editor.role}</label>
                                            <input 
                                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100"
                                                placeholder={t.editor.rolePlace}
                                                value={guidedInputs.role}
                                                onChange={(e) => handleGuidedChange('role', e.target.value)}
                                            />
                                        </div>
                                         <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.editor.tone}</label>
                                            <input 
                                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100"
                                                placeholder={t.editor.tonePlace}
                                                value={guidedInputs.tone}
                                                onChange={(e) => handleGuidedChange('tone', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.editor.context}</label>
                                        <textarea 
                                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none dark:text-slate-100"
                                            placeholder={t.editor.contextPlace}
                                            value={guidedInputs.context}
                                            onChange={(e) => handleGuidedChange('context', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.editor.task}</label>
                                        <textarea 
                                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none dark:text-slate-100"
                                            placeholder={t.editor.taskPlace}
                                            value={guidedInputs.task}
                                            onChange={(e) => handleGuidedChange('task', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.editor.constraints}</label>
                                            <textarea 
                                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none dark:text-slate-100"
                                                placeholder={t.editor.constraintsPlace}
                                                value={guidedInputs.constraints}
                                                onChange={(e) => handleGuidedChange('constraints', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.editor.format}</label>
                                            <textarea 
                                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none dark:text-slate-100"
                                                placeholder={t.editor.formatPlace}
                                                value={guidedInputs.format}
                                                onChange={(e) => handleGuidedChange('format', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Capabilities Section */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                                          <Zap className="w-3 h-3 mr-1 text-amber-500" />
                                          {t.editor.skillsLabel}
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                          {AVAILABLE_SKILLS.map(skill => {
                                            const isSelected = guidedInputs.skills?.includes(skill.id);
                                            const label = (t.editor as any)[skill.labelKey] || skill.id;
                                            return (
                                              <div 
                                                key={skill.id}
                                                onClick={() => toggleGuidedSkill(skill.id)}
                                                className={`cursor-pointer p-3 rounded-lg border text-sm transition-all flex items-center space-x-2 ${
                                                  isSelected 
                                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200' 
                                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                                                }`}
                                              >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500'}`}>
                                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="font-medium">{label}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                    </div>

                                    {/* Preview of Generated Content */}
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Preview (Generated)</label>
                                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap border border-slate-100 dark:border-slate-700">
                                            {editorContent || <span className="italic opacity-50">Start typing above...</span>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <textarea 
                                    value={editorContent}
                                    onChange={(e) => setEditorContent(e.target.value)}
                                    className="w-full h-full bg-slate-50 dark:bg-slate-900 border-none text-slate-900 dark:text-slate-100 p-6 resize-none focus:ring-0 outline-none font-mono text-sm leading-relaxed placeholder:text-slate-400"
                                    placeholder="..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Right: Optimized (Conditional) */}
                    {editorOptimized && (
                        <div className="flex-1 p-6 flex flex-col bg-indigo-50/30 dark:bg-indigo-900/10 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between mb-2 items-center">
                            <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center">
                            <Wand2 className="w-3 h-3 mr-1" /> {t.aiOptimized}
                            </label>
                            <div className="flex space-x-2 items-center">
                            <button onClick={() => setEditorContent(editorOptimized)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t.applyToDraft}</button>
                            <div className="w-px h-3 bg-indigo-200 dark:bg-indigo-800"></div>
                            <button onClick={() => copyToClipboard(editorOptimized)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30"><Copy className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <textarea 
                            readOnly
                            value={editorOptimized}
                            className="flex-1 w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 rounded-lg p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed shadow-sm"
                        />
                        </div>
                    )}
                  </div>

                  {/* History Sidebar */}
                  {isHistoryOpen && (
                      <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto p-4 flex flex-col animate-in slide-in-from-right duration-200 absolute right-0 top-0 bottom-0 z-20 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-slate-500"/> {t.versionHistory}
                            </h3>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                        {activePrompt?.history && activePrompt.history.length > 0 ? (
                            [...activePrompt.history].reverse().map((h) => (
                                <div key={h.version} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 rounded text-xs">v{h.version}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-300 mb-3 text-xs font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-600 max-h-24 overflow-hidden relative">
                                        {h.content || <span className="italic text-slate-300">Empty content</span>}
                                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white dark:from-slate-800 to-transparent"></div>
                                    </div>
                                    <button 
                                        onClick={() => handleRestoreVersion(h)}
                                        className="w-full text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 py-1.5 rounded border border-indigo-100 dark:border-indigo-800 hover:border-indigo-200 dark:hover:border-indigo-700 flex items-center justify-center transition-colors font-medium"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1.5"/> {t.restore}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 italic text-xs">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                                {t.sync.noData}
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
      
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={t.modals.createPersona}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.modals.avatar}</label>
            <input 
              type="text" 
              maxLength={2} 
              className="w-12 h-12 text-center text-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              value={newRoleEmoji}
              onChange={(e) => setNewRoleEmoji(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.modals.roleName}</label>
            <input 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              placeholder={t.modals.rolePlace}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.modals.roleDesc}</label>
            <textarea 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none placeholder:text-slate-400 leading-relaxed"
              placeholder={t.modals.roleDescPlace}
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddRole}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            {t.modals.createRoleBtn}
          </button>
        </div>
      </Modal>

      <Modal isOpen={isScenarioModalOpen} onClose={() => setIsScenarioModalOpen(false)} title={t.modals.addScenario}>
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg text-xs text-indigo-800 dark:text-indigo-200 mb-2 flex items-center border border-indigo-100 dark:border-indigo-800">
            <span className="mr-1">{t.modals.addingFor}</span>
            <strong className="font-semibold">{activeRole?.name}</strong>
          </div>
           <div className="flex justify-end">
            <button 
              onClick={handleSuggestScenarios}
              disabled={suggestingScenarios}
              className="text-xs flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium hover:underline"
            >
              {suggestingScenarios ? t.modals.thinking : t.modals.suggest}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.modals.scenarioTitle}</label>
            <input 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              placeholder={t.modals.scenarioTitlePlace}
              value={newScenarioTitle}
              onChange={(e) => setNewScenarioTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.modals.goal}</label>
            <textarea 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none placeholder:text-slate-400 leading-relaxed"
              placeholder={t.modals.goalPlace}
              value={newScenarioGoal}
              onChange={(e) => setNewScenarioGoal(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddScenario}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            {t.modals.addScenarioBtn}
          </button>
        </div>
      </Modal>

    </div>
  );
}