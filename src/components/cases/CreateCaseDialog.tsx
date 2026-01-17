import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Briefcase, User, Calendar, Scale, FileText, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateCase } from "@/hooks/use-cases";

const caseFormSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters").max(100),
  client_pan: z.string().max(10).optional().or(z.literal("")),
  assessment_year: z.string().min(7, "Please select an assessment year"),
  financial_year: z.string().optional(),
  stage: z.enum(["assessment", "cita", "itat", "hc", "closed"]),
  status: z.enum(["drafting", "research", "hearing", "archived"]),
  section_involved: z.string().max(100).optional(),
  appeal_number: z.string().max(50).optional(),
  ita_number: z.string().max(50).optional(),
  disputed_amount: z.coerce.number().min(0).optional(),
  demand_amount: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

type CaseFormValues = z.infer<typeof caseFormSchema>;

const assessmentYears = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return `${year - 1}-${year.toString().slice(-2)}`;
});

const stageOptions = [
  { value: "assessment", label: "Assessment", description: "Initial assessment phase" },
  { value: "cita", label: "CIT(A)", description: "Commissioner of Income Tax (Appeals)" },
  { value: "itat", label: "ITAT", description: "Income Tax Appellate Tribunal" },
  { value: "hc", label: "High Court", description: "High Court proceedings" },
  { value: "closed", label: "Closed", description: "Case concluded" },
];

const statusOptions = [
  { value: "research", label: "Research", description: "Gathering information" },
  { value: "drafting", label: "Drafting", description: "Preparing documents" },
  { value: "hearing", label: "Hearing", description: "Scheduled for hearing" },
  { value: "archived", label: "Archived", description: "No longer active" },
];

interface CreateCaseDialogProps {
  children?: React.ReactNode;
}

export function CreateCaseDialog({ children }: CreateCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const createCase = useCreateCase();

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      client_name: "",
      client_pan: "",
      assessment_year: "",
      financial_year: "",
      stage: "assessment",
      status: "research",
      section_involved: "",
      appeal_number: "",
      ita_number: "",
      disputed_amount: undefined,
      demand_amount: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: CaseFormValues) => {
    try {
      await createCase.mutateAsync({
        client_name: data.client_name,
        client_pan: data.client_pan || null,
        assessment_year: data.assessment_year,
        financial_year: data.financial_year || null,
        stage: data.stage,
        status: data.status,
        section_involved: data.section_involved || null,
        appeal_number: data.appeal_number || null,
        ita_number: data.ita_number || null,
        disputed_amount: data.disputed_amount || null,
        demand_amount: data.demand_amount || null,
        notes: data.notes || null,
      });
      form.reset();
      setOpen(false);
      setActiveTab("basic");
    } catch (error) {
      console.error("Failed to create case:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-primary" />
            Create New Case
          </DialogTitle>
          <DialogDescription>
            Enter the case details below. Required fields are marked with an asterisk.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="gap-2">
                  <User className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Case Details
                </TabsTrigger>
                <TabsTrigger value="financial" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Client Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_pan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AAAAA0000A" maxLength={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assessment_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Assessment Year <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assessmentYears.map((year) => (
                              <SelectItem key={year} value={year}>
                                AY {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="financial_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Year</FormLabel>
                        <FormControl>
                          <Input placeholder="2023-24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Stage <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stageOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Status <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="section_involved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        Section Involved
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Section 68, 69A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appeal_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appeal Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Appeal reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ita_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ITA Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ITA reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any relevant notes about this case..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="disputed_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Disputed Amount (₹)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="demand_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Demand Amount (₹)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">
                    Additional financial fields like tax effect, penalty, and interest can be added after case creation.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCase.isPending}>
                {createCase.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}