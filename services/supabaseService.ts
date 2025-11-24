import { createClient } from '@supabase/supabase-js';
import { AppData, AppSettings, Role, Scenario, Prompt, Article } from '../types';

export const getSupabaseClient = (settings: AppSettings) => {
  if (!settings.supabase.url || !settings.supabase.anonKey) {
    return null;
  }
  return createClient(settings.supabase.url, settings.supabase.anonKey);
};

export const checkSupabaseConnection = async (settings: AppSettings): Promise<boolean> => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return false;
  return !!supabase;
};

// --- Auth Functions ---

export const signUpUser = async (settings: AppSettings, email: string, password: string, username: string) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) throw new Error("Supabase not configured");
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      },
    },
  });

  if (error) throw new Error(error.message);
  return data;
};

export const signInUser = async (settings: AppSettings, email: string, password: string) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
};

export const signOutUser = async (settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getSession = async (settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// --- Mappers (Frontend CamelCase <-> DB SnakeCase) ---

const mapRoleToDb = (r: Role) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  icon: r.icon,
  color: r.color,
  created_at: r.createdAt
});

const mapScenarioToDb = (s: Scenario) => ({
  id: s.id,
  role_id: s.roleId,
  title: s.title,
  goal: s.goal,
  created_at: s.createdAt
});

const mapPromptToDb = (p: Prompt) => ({
  id: p.id,
  scenario_id: p.scenarioId,
  title: p.title,
  content: p.content,
  optimized_content: p.optimizedContent,
  tags: p.tags || [],
  version: p.version,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  history: p.history || []
});

const mapArticleToDb = (a: Article) => ({
  id: a.id,
  title: a.title,
  content: a.content,
  created_at: a.createdAt,
  updated_at: a.updatedAt
});

const mapRoleFromDb = (r: any): Role => ({
  id: r.id,
  name: r.name,
  description: r.description,
  icon: r.icon,
  color: r.color,
  createdAt: r.created_at
});

const mapScenarioFromDb = (s: any): Scenario => ({
  id: s.id,
  roleId: s.role_id,
  title: s.title,
  goal: s.goal,
  createdAt: s.created_at
});

const mapPromptFromDb = (p: any): Prompt => ({
  id: p.id,
  scenarioId: p.scenario_id,
  title: p.title,
  content: p.content,
  optimizedContent: p.optimized_content,
  tags: p.tags || [],
  version: p.version,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  history: p.history || []
});

const mapArticleFromDb = (a: any): Article => ({
  id: a.id,
  title: a.title,
  content: a.content,
  createdAt: a.created_at,
  updatedAt: a.updated_at
});

// --- Real-time Granular Sync Functions ---

export const upsertRole = async (role: Role, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Include user_id in the payload
  const payload = {
    ...mapRoleToDb(role),
    user_id: user.id
  };

  const { error } = await supabase.from('roles').upsert(payload, { onConflict: 'id' });
  if (error) {
      console.error("Upsert Role Error:", error);
      throw new Error(`Role Save Failed: ${error.message}`);
  }
};

export const deleteRole = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  // RLS will ensure we only delete if it belongs to the user
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const upsertScenario = async (scenario: Scenario, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const payload = {
    ...mapScenarioToDb(scenario),
    user_id: user.id
  };

  const { error } = await supabase.from('scenarios').upsert(payload, { onConflict: 'id' });
  if (error) {
      console.error("Upsert Scenario Error:", error);
      throw new Error(`Scenario Save Failed: ${error.message}`);
  }
};

export const deleteScenario = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const upsertPrompt = async (prompt: Prompt, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const payload = {
    ...mapPromptToDb(prompt),
    user_id: user.id
  };

  const { error } = await supabase.from('prompts').upsert(payload, { onConflict: 'id' });
  if (error) {
      console.error("Upsert Prompt Error:", error);
      throw new Error(`Prompt Save Failed: ${error.message}`);
  }
};

export const deletePrompt = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const upsertArticle = async (article: Article, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const payload = {
    ...mapArticleToDb(article),
    user_id: user.id
  };

  const { error } = await supabase.from('articles').upsert(payload, { onConflict: 'id' });
  if (error) {
      console.error("Upsert Article Error:", error);
      throw new Error(`Article Save Failed: ${error.message}`);
  }
};

export const deleteArticle = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Bulk Sync Functions (Backup/Restore) ---

export const uploadBackupToSupabase = async (data: AppData, settings: AppSettings): Promise<boolean> => {
    const supabase = getSupabaseClient(settings);
    if (!supabase) throw new Error("Supabase not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Upsert Roles
    if (data.roles.length > 0) {
      const rolesPayload = data.roles.map(r => ({
        ...mapRoleToDb(r),
        user_id: user.id
      }));
      
      const { error: rError } = await supabase
        .from('roles')
        .upsert(rolesPayload, { onConflict: 'id' });
      if (rError) throw new Error(`Roles Sync Error: ${rError.message}`);
    }

    // 2. Upsert Scenarios
    if (data.scenarios.length > 0) {
      const scenariosPayload = data.scenarios.map(s => ({
        ...mapScenarioToDb(s),
        user_id: user.id
      }));

      const { error: sError } = await supabase
        .from('scenarios')
        .upsert(scenariosPayload, { onConflict: 'id' });
      if (sError) throw new Error(`Scenarios Sync Error: ${sError.message}`);
    }

    // 3. Upsert Prompts
    if (data.prompts.length > 0) {
      const promptsPayload = data.prompts.map(p => ({
        ...mapPromptToDb(p),
        user_id: user.id
      }));

      const { error: pError } = await supabase
        .from('prompts')
        .upsert(promptsPayload, { onConflict: 'id' });
      if (pError) throw new Error(`Prompts Sync Error: ${pError.message}`);
    }

    // 4. Upsert Articles
    if (data.articles.length > 0) {
      const articlesPayload = data.articles.map(a => ({
        ...mapArticleToDb(a),
        user_id: user.id
      }));

      const { error: aError } = await supabase
        .from('articles')
        .upsert(articlesPayload, { onConflict: 'id' });
      if (aError) throw new Error(`Articles Sync Error: ${aError.message}`);
    }

    return true;
};

export const downloadBackupFromSupabase = async (settings: AppSettings): Promise<AppData | null> => {
    const supabase = getSupabaseClient(settings);
    if (!supabase) throw new Error("Supabase not configured");

    // RLS will ensure we only select rows where user_id = auth.uid()
    const [rolesRes, scenariosRes, promptsRes, articlesRes] = await Promise.all([
      supabase.from('roles').select('*'),
      supabase.from('scenarios').select('*'),
      supabase.from('prompts').select('*'),
      supabase.from('articles').select('*')
    ]);

    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (scenariosRes.error) throw new Error(scenariosRes.error.message);
    if (promptsRes.error) throw new Error(promptsRes.error.message);
    // articlesRes might fail if table doesn't exist yet, handle gracefully if needed, 
    // but better to assume schema exists
    if (articlesRes.error) {
       console.warn("Could not fetch articles, maybe table missing?", articlesRes.error);
    }

    return {
      roles: (rolesRes.data || []).map(mapRoleFromDb),
      scenarios: (scenariosRes.data || []).map(mapScenarioFromDb),
      prompts: (promptsRes.data || []).map(mapPromptFromDb),
      articles: (articlesRes.data || []).map(mapArticleFromDb)
    };
};