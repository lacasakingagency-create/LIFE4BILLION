/**
 * Life4Billion MCP Permissions System
 * Maps user-configurable permissions to the 24 official MCP tools.
 * Provides fine-grained read/write security enforcement.
 */

export interface McpPermissions {
  // Read permissions (default: true)
  finances: boolean;          // get_financial_summary, get_income, get_expenses, get_monthly_expenses
  budget: boolean;            // get_budget
  upcoming_bills: boolean;    // get_upcoming_bills
  emergency_reserve: boolean; // get_emergency_reserve
  net_worth: boolean;         // get_net_worth
  goals: boolean;             // get_goals
  habits: boolean;            // get_habits, get_habit_progress
  calendar: boolean;          // get_calendar_events
  studies: boolean;           // get_study_progress, get_study_sessions
  family_budget: boolean;     // get_family_budget, get_family_expenses
  crm: boolean;               // get_crm_summary
  leads: boolean;             // get_leads
  customers: boolean;         // get_customers

  // Write permissions (default: false - require explicit user authorization)
  create_goal: boolean;           // create_goal
  update_goal: boolean;           // update_goal
  create_habit: boolean;          // create_habit
  update_habit: boolean;          // update_habit
  create_calendar_event: boolean; // create_calendar_event
}

export const DEFAULT_MCP_PERMISSIONS: McpPermissions = {
  // Leitura (habilitada por padrão)
  finances: true,
  budget: true,
  upcoming_bills: true,
  emergency_reserve: true,
  net_worth: true,
  goals: true,
  habits: true,
  calendar: true,
  studies: true,
  family_budget: true,
  crm: true,
  leads: true,
  customers: true,

  // Escrita (exige autorização explícita)
  create_goal: false,
  update_goal: false,
  create_habit: false,
  update_habit: false,
  create_calendar_event: false
};

// Maps tool name to its required permission key
export const TOOL_PERMISSION_MAP: Record<string, keyof McpPermissions> = {
  get_financial_summary: "finances",
  get_income: "finances",
  get_expenses: "finances",
  get_monthly_expenses: "finances",
  get_budget: "budget",
  get_upcoming_bills: "upcoming_bills",
  get_emergency_reserve: "emergency_reserve",
  get_net_worth: "net_worth",
  get_goals: "goals",
  get_habits: "habits",
  get_habit_progress: "habits",
  get_calendar_events: "calendar",
  get_study_progress: "studies",
  get_study_sessions: "studies",
  get_family_budget: "family_budget",
  get_family_expenses: "family_budget",
  get_crm_summary: "crm",
  get_leads: "leads",
  get_customers: "customers",
  create_goal: "create_goal",
  update_goal: "update_goal",
  create_habit: "create_habit",
  update_habit: "update_habit",
  create_calendar_event: "create_calendar_event"
};

/**
 * Normalizes input permissions with secure defaults.
 */
export function normalizePermissions(input?: any): McpPermissions {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_MCP_PERMISSIONS };
  }

  const result: McpPermissions = { ...DEFAULT_MCP_PERMISSIONS };

  for (const key of Object.keys(DEFAULT_MCP_PERMISSIONS) as Array<keyof McpPermissions>) {
    if (typeof input[key] === "boolean") {
      result[key] = input[key];
    }
  }

  return result;
}

/**
 * Checks if a tool is permitted under the given permission set.
 */
export function isToolAllowed(toolName: string, permissions?: Partial<McpPermissions>): boolean {
  const permKey = TOOL_PERMISSION_MAP[toolName];
  if (!permKey) {
    // If tool is not mapped, allow by default if it's a known tool
    return true;
  }

  const effective = permissions ? normalizePermissions(permissions) : DEFAULT_MCP_PERMISSIONS;
  return effective[permKey] === true;
}
