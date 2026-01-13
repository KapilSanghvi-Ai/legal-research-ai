import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, parseISO } from "date-fns";

export type Case = Tables<"cases">;
export type CaseInsert = TablesInsert<"cases">;
export type CaseUpdate = TablesUpdate<"cases">;

export interface CaseWithMeta extends Case {
  daysUntilHearing?: number;
  issuesList: string[];
}

// Transform database case to component-friendly format
function transformCase(dbCase: Case): CaseWithMeta {
  let daysUntilHearing: number | undefined;
  
  if (dbCase.next_hearing_date) {
    const hearingDate = parseISO(dbCase.next_hearing_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    daysUntilHearing = differenceInDays(hearingDate, today);
  }

  // Parse issues from JSONB - could be array of strings or array of objects
  let issuesList: string[] = [];
  if (dbCase.issues) {
    try {
      const issues = dbCase.issues as unknown;
      if (Array.isArray(issues)) {
        issuesList = issues.map((issue) => {
          if (typeof issue === "string") return issue;
          if (typeof issue === "object" && issue !== null) {
            return (issue as { title?: string; name?: string }).title || 
                   (issue as { title?: string; name?: string }).name || 
                   JSON.stringify(issue);
          }
          return String(issue);
        });
      }
    } catch {
      issuesList = [];
    }
  }

  return {
    ...dbCase,
    daysUntilHearing,
    issuesList,
  };
}

export const casesKeys = {
  all: ["cases"] as const,
  lists: () => [...casesKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...casesKeys.lists(), filters] as const,
  details: () => [...casesKeys.all, "detail"] as const,
  detail: (id: string) => [...casesKeys.details(), id] as const,
};

export function useCases(options?: { 
  includeArchived?: boolean;
  stageFilter?: string;
  searchQuery?: string;
}) {
  const { user } = useAuth();
  const { includeArchived = false, stageFilter, searchQuery } = options || {};

  return useQuery({
    queryKey: casesKeys.list({ includeArchived, stageFilter, searchQuery, userId: user?.id }),
    queryFn: async () => {
      let query = supabase
        .from("cases")
        .select("*")
        .order("next_hearing_date", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false });

      if (!includeArchived) {
        query = query.neq("stage", "closed" as const);
      }

      if (stageFilter && stageFilter !== "all") {
        // Type-safe stage filter
        const validStages = ["assessment", "cita", "itat", "hc", "closed"] as const;
        if (validStages.includes(stageFilter as typeof validStages[number])) {
          query = query.eq("stage", stageFilter as typeof validStages[number]);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      let cases = (data || []).map(transformCase);

      // Client-side search filter
      if (searchQuery && searchQuery.trim()) {
        const search = searchQuery.toLowerCase();
        cases = cases.filter((c) => 
          c.client_name.toLowerCase().includes(search) ||
          c.issuesList.some((issue) => issue.toLowerCase().includes(search)) ||
          c.client_pan?.toLowerCase().includes(search) ||
          c.ita_number?.toLowerCase().includes(search) ||
          c.section_involved?.toLowerCase().includes(search)
        );
      }

      return cases;
    },
    enabled: !!user,
  });
}

export function useCase(caseId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: casesKeys.detail(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformCase(data);
    },
    enabled: !!user && !!caseId,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newCase: Omit<CaseInsert, "created_by" | "owner_id">) => {
      const { data, error } = await supabase
        .from("cases")
        .insert({
          ...newCase,
          created_by: user?.id,
          owner_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CaseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: casesKeys.detail(data.id) });
      }
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all });
    },
  });
}

export function useArchiveCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { data, error } = await supabase
        .from("cases")
        .update({ stage: "closed", is_archived: true })
        .eq("id", caseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all });
    },
  });
}
