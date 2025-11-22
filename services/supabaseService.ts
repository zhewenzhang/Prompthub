import { createClient } from '@supabase/supabase-js';
import { AppData, AppSettings, Role, Scenario, Prompt } from '../types';

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
  tags: p.tags,
  version: p.version,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  history: p.history // jsonb is fine as is
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

// --- Real-time Granular Sync Functions ---

export const upsertRole = async (role: Role, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('roles').upsert(mapRoleToDb(role));
  if (error) throw error;
};

export const deleteRole = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  // Assuming ON DELETE CASCADE is set in SQL for Scenarios/Prompts
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw error;
};

export const upsertScenario = async (scenario: Scenario, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('scenarios').upsert(mapScenarioToDb(scenario));
  if (error) throw error;
};

export const deleteScenario = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw error;
};

export const upsertPrompt = async (prompt: Prompt, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('prompts').upsert(mapPromptToDb(prompt));
  if (error) throw error;
};

export const deletePrompt = async (id: string, settings: AppSettings) => {
  const supabase = getSupabaseClient(settings);
  if (!supabase) return;
  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw error;
};

// --- Bulk Sync Functions (Backup/Restore) ---

export const uploadBackupToSupabase = async (data: AppData, settings: AppSettings): Promise<boolean> => {
    const supabase = getSupabaseClient(settings);
    if (!supabase) throw new Error("Supabase not configured");

    // 1. Upsert Roles
    if (data.roles.length > 0) {
      const { error: rError } = await supabase
        .from('roles')
        .upsert(data.roles.map(mapRoleToDb), { onConflict: 'id' });
      if (rError) throw new Error(`Roles Sync Error: ${rError.message}`);
    }

    // 2. Upsert Scenarios
    if (data.scenarios.length > 0) {
      const { error: sError } = await supabase
        .from('scenarios')
        .upsert(data.scenarios.map(mapScenarioToDb), { onConflict: 'id' });
      if (sError) throw new Error(`Scenarios Sync Error: ${sError.message}`);
    }

    // 3. Upsert Prompts
    if (data.prompts.length > 0) {
      const { error: pError } = await supabase
        .from('prompts')
        .upsert(data.prompts.map(mapPromptToDb), { onConflict: 'id' });
      if (pError) throw new Error(`Prompts Sync Error: ${pError.message}`);
    }

    return true;
};

export const downloadBackupFromSupabase = async (settings: AppSettings): Promise<AppData | null> => {
    const supabase = getSupabaseClient(settings);
    if (!supabase) throw new Error("Supabase not configured");

    // Fetch all data in parallel
    const [rolesRes, scenariosRes, promptsRes] = await Promise.all([
      supabase.from('roles').select('*'),
      supabase.from('scenarios').select('*'),
      supabase.from('prompts').select('*')
    ]);

    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (scenariosRes.error) throw new Error(scenariosRes.error.message);
    if (promptsRes.error) throw new Error(promptsRes.error.message);

    return {
      roles: (rolesRes.data || []).map(mapRoleFromDb),
      scenarios: (scenariosRes.data || []).map(mapScenarioFromDb),
      prompts: (promptsRes.data || []).map(mapPromptFromDb)
    };
};