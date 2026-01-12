import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface Client {
  id: string;
  name: string;
  pan: string | null;
  tan: string | null;
  gstin: string | null;
  client_type: "individual" | "huf" | "company" | "firm" | "trust" | "aop" | "government";
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  alt_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  nature_of_business: string | null;
  incorporation_date: string | null;
  gdrive_folder_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  client_id: string | null;
  client_name: string;
  client_pan: string | null;
  opposing_party: string | null;
  ao_name: string | null;
  ao_designation: string | null;
  assessment_year: string;
  financial_year: string | null;
  section_involved: string | null;
  ita_number: string | null;
  appeal_number: string | null;
  din_number: string | null;
  stage: "assessment" | "cita" | "itat" | "hc" | "closed";
  status: "research" | "drafting" | "review" | "filed" | "hearing" | "decided" | "archived";
  issues: any[];
  original_income: number | null;
  assessed_income: number | null;
  addition_amount: number | null;
  disputed_amount: number | null;
  demand_amount: number | null;
  tax_effect: number | null;
  penalty_amount: number | null;
  interest_amount: number | null;
  payment_status: "nil" | "partial" | "full" | "refund_pending" | "refund_received";
  notice_date: string | null;
  response_due_date: string | null;
  order_date: string | null;
  appeal_due_date: string | null;
  limitation_date: string | null;
  next_hearing_date: string | null;
  owner_id: string | null;
  team_ids: string[] | null;
  gdrive_folder_id: string | null;
  outcome: string | null;
  outcome_summary: string | null;
  relief_amount: number | null;
  tags: string[] | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  case_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  task_type: string | null;
  due_date: string | null;
  due_time: string | null;
  reminder_date: string | null;
  reminder_time: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "review" | "completed" | "cancelled";
  assigned_to: string | null;
  assigned_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  is_recurring: boolean;
  recurrence_pattern: any;
  created_at: string;
  updated_at: string;
  case?: Case;
}

export interface Hearing {
  id: string;
  case_id: string;
  hearing_date: string;
  hearing_time: string | null;
  forum: string;
  bench: string | null;
  court_room: string | null;
  cause_list_number: string | null;
  item_number: number | null;
  status: "scheduled" | "adjourned" | "part_heard" | "heard" | "decided" | "withdrawn";
  outcome: string | null;
  order_date: string | null;
  order_summary: string | null;
  next_date: string | null;
  adjournment_reason: string | null;
  appearing_counsel: string | null;
  preparation_notes: string | null;
  arguments_summary: string | null;
  documents_filed: string[] | null;
  created_at: string;
  updated_at: string;
  case?: Case;
}

// Query Keys
export const litigationKeys = {
  clients: ["clients"] as const,
  client: (id: string) => ["clients", id] as const,
  cases: ["cases"] as const,
  case: (id: string) => ["cases", id] as const,
  tasks: ["tasks"] as const,
  task: (id: string) => ["tasks", id] as const,
  hearings: ["hearings"] as const,
  hearing: (id: string) => ["hearings", id] as const,
  upcomingDeadlines: ["upcoming-deadlines"] as const,
};

// =====================================================
// CLIENTS HOOKS
// =====================================================

export function useClients(activeOnly = true) {
  return useQuery({
    queryKey: [...litigationKeys.clients, { activeOnly }],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("name");
      
      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: litigationKeys.client(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (client: Omit<Partial<Client>, 'id' | 'created_at' | 'updated_at'> & { name: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .insert(client as any)
        .select()
        .single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.clients });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.clients });
      queryClient.invalidateQueries({ queryKey: litigationKeys.client(data.id) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.clients });
    },
  });
}

// =====================================================
// CASES HOOKS
// =====================================================

export function useCases(filters?: { stage?: string; status?: string; archived?: boolean }) {
  return useQuery({
    queryKey: [...litigationKeys.cases, filters],
    queryFn: async () => {
      let query = supabase
        .from("cases")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (filters?.stage && filters.stage !== "all") {
        query = query.eq("stage", filters.stage as any);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.archived !== undefined) {
        query = query.eq("is_archived", filters.archived);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Case[];
    },
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: litigationKeys.case(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Case;
    },
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (caseData: Omit<Partial<Case>, 'id' | 'created_at' | 'updated_at'> & { client_name: string; assessment_year: string }) => {
      const { data, error } = await supabase
        .from("cases")
        .insert(caseData as any)
        .select()
        .single();
      if (error) throw error;
      return data as Case;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.cases });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Case> & { id: string }) => {
      const { data, error } = await supabase
        .from("cases")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Case;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.cases });
      queryClient.invalidateQueries({ queryKey: litigationKeys.case(data.id) });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.cases });
    },
  });
}

// =====================================================
// TASKS HOOKS
// =====================================================

export function useTasks(filters?: { status?: string; priority?: string; caseId?: string }) {
  return useQuery({
    queryKey: [...litigationKeys.tasks, filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, cases(client_name, assessment_year)")
        .order("due_date", { ascending: true, nullsFirst: false });
      
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority as any);
      }
      if (filters?.caseId) {
        query = query.eq("case_id", filters.caseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (Task & { cases: { client_name: string; assessment_year: string } | null })[];
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: litigationKeys.task(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, cases(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Task & { cases: Case | null };
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Omit<Partial<Task>, 'id' | 'created_at' | 'updated_at'> & { title: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task as any)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.tasks });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.tasks });
      queryClient.invalidateQueries({ queryKey: litigationKeys.task(data.id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.tasks });
    },
  });
}

// =====================================================
// HEARINGS HOOKS
// =====================================================

export function useHearings(filters?: { status?: string; caseId?: string; upcoming?: boolean }) {
  return useQuery({
    queryKey: [...litigationKeys.hearings, filters],
    queryFn: async () => {
      let query = supabase
        .from("hearings")
        .select("*, cases(client_name, assessment_year, ita_number)")
        .order("hearing_date", { ascending: true });
      
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.caseId) {
        query = query.eq("case_id", filters.caseId);
      }
      if (filters?.upcoming) {
        query = query.gte("hearing_date", new Date().toISOString().split("T")[0]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (Hearing & { cases: { client_name: string; assessment_year: string; ita_number: string | null } | null })[];
    },
  });
}

export function useHearing(id: string) {
  return useQuery({
    queryKey: litigationKeys.hearing(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hearings")
        .select("*, cases(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Hearing & { cases: Case | null };
    },
    enabled: !!id,
  });
}

export function useCreateHearing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (hearing: Omit<Partial<Hearing>, 'id' | 'created_at' | 'updated_at'> & { case_id: string; hearing_date: string; forum: string }) => {
      const { data, error } = await supabase
        .from("hearings")
        .insert(hearing as any)
        .select()
        .single();
      if (error) throw error;
      return data as Hearing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.hearings });
    },
  });
}

export function useUpdateHearing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Hearing> & { id: string }) => {
      const { data, error } = await supabase
        .from("hearings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Hearing;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.hearings });
      queryClient.invalidateQueries({ queryKey: litigationKeys.hearing(data.id) });
    },
  });
}

export function useDeleteHearing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hearings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: litigationKeys.hearings });
    },
  });
}

// =====================================================
// UTILITY HOOKS
// =====================================================

export function useUpcomingDeadlines(daysAhead = 14) {
  return useQuery({
    queryKey: [...litigationKeys.upcomingDeadlines, daysAhead],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_upcoming_deadlines", {
        days_ahead: daysAhead,
      });
      if (error) throw error;
      return data as Array<{
        type: string;
        case_id: string;
        client_name: string;
        assessment_year: string;
        deadline_date: string;
        description: string;
        days_until: number;
      }>;
    },
  });
}
