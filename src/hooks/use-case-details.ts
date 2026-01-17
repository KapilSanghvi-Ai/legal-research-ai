import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type CaseActivity = Tables<"case_activities">;
export type CaseDocument = Tables<"documents">;
export type CaseResearch = Tables<"case_research">;
export type Task = Tables<"tasks">;

export const caseDetailKeys = {
  all: ["case-details"] as const,
  activities: (caseId: string) => [...caseDetailKeys.all, "activities", caseId] as const,
  documents: (caseId: string) => [...caseDetailKeys.all, "documents", caseId] as const,
  research: (caseId: string) => [...caseDetailKeys.all, "research", caseId] as const,
  tasks: (caseId: string) => [...caseDetailKeys.all, "tasks", caseId] as const,
};

export function useCaseActivities(caseId: string) {
  return useQuery({
    queryKey: caseDetailKeys.activities(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_activities")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CaseActivity[];
    },
    enabled: !!caseId,
  });
}

export function useCaseDocuments(caseId: string) {
  return useQuery({
    queryKey: caseDetailKeys.documents(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", caseId)
        .eq("is_latest", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as CaseDocument[];
    },
    enabled: !!caseId,
  });
}

export function useCaseResearch(caseId: string) {
  return useQuery({
    queryKey: caseDetailKeys.research(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_research")
        .select(`
          *,
          sources (
            id,
            title,
            citation,
            court,
            judgment_date,
            headnote
          )
        `)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (CaseResearch & { sources: Tables<"sources"> | null })[];
    },
    enabled: !!caseId,
  });
}

export function useCaseTasks(caseId: string) {
  return useQuery({
    queryKey: caseDetailKeys.tasks(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("case_id", caseId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!caseId,
  });
}

export function useAddCaseActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Omit<CaseActivity, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("case_activities")
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.activities(data.case_id) });
    },
  });
}
