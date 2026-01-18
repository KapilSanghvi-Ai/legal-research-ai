import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Briefcase, User, Calendar, Scale, FileText, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useUpdateCase, CaseWithMeta } from "@/hooks/use-cases";
import { toast } from "sonner";

const caseFormSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters").max(100),
  client_pan: z.string().max(10).optional().or(z.literal("")),
  assessment_year: z.string().min(7, "Please select an assessment year"),
  financial_year: z.string().optional().or(z.literal("")),
  stage: z.enum(["assessment", "cita", "itat", "hc", "closed"]),
  status: z.enum(["drafting", "research", "hearing", "archived"]),
  section_involved: z.string().max(100).optional().or(z.literal("")),
  appeal_number: z.string().max(50).optional().or(z.literal("")),
  ita_number: z.string().max(50).optional().or(z.literal("")),
  din_number: z.string().max(50).optional().or(z.literal("")),
  ao_name: z.string().max(100).optional().or(z.literal("")),
  ao_designation: z.string().max(100).optional().or(z.literal("")),
  disputed_amount: z.coerce.number().min(0).optional().nullable(),
  demand_amount: z.coerce.number().min(0).optional().nullable(),
  original_income: z.coerce.number().min(0).optional().nullable(),
  assessed_income: z.coerce.number().min(0).optional().nullable(),
  addition_amount: z.coerce.number().min(0).optional().nullable(),
  tax_effect: z.coerce.number().min(0).optional().nullable(),
  penalty_amount: z.coerce.number().min(0).optional().nullable(),
  interest_amount: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  notice_date: z.string().optional().or(z.literal("")),
  order_date: z.string().optional().or(z.literal("")),
  appeal_due_date: z.string().optional().or(z.literal("")),
  limitation_date: z.string().optional().or(z.literal("")),
  response_due_date: z.string().optional().or(z.literal("")),
});

type CaseFormValues = z.infer<typeof caseFormSchema>;

const assessmentYears = Array.from({ length: 15 }, (_, i) => {
  const year = new Date().getFullYear() - i + 1;
  return `${year - 1}-${year.toString().slice(-2)}`;
});

const stageOptions = [
  { value: "assessment", label: "Assessment" },
  { value: "cita", label: "CIT(A)" },
  { value: "itat", label: "ITAT" },
  { value: "hc", label: "High Court" },
  { value: "closed", label: "Closed" },
];

const statusOptions = [
  { value: "research", label: "Research" },
  { value: "drafting", label: "Drafting" },
  { value: "hearing", label: "Hearing" },
  { value: "archived", label: "Archived" },
];

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: CaseWithMeta;
}

export function EditCaseDialog({ open, onOpenChange, caseData }: EditCaseDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const updateCase = useUpdateCase();

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
      din_number: "",
      ao_name: "",
      ao_designation: "",
      disputed_amount: null,
      demand_amount: null,
      original_income: null,
      assessed_income: null,
      addition_amount: null,
      tax_effect: null,
      penalty_amount: null,
      interest_amount: null,
      notes: "",
      notice_date: "",
      order_date: "",
      appeal_due_date: "",
      limitation_date: "",
      response_due_date: "",
    },
  });

  // Populate form with case data when opened
  useEffect(() => {
    if (open && caseData) {
      form.reset({
        client_name: caseData.client_name || "",
        client_pan: caseData.client_pan || "",
        assessment_year: caseData.assessment_year || "",
        financial_year: caseData.financial_year || "",
        stage: caseData.stage,
        status: caseData.status,
        section_involved: caseData.section_involved || "",
        appeal_number: caseData.appeal_number || "",
        ita_number: caseData.ita_number || "",
        din_number: caseData.din_number || "",
        ao_name: caseData.ao_name || "",
        ao_designation: caseData.ao_designation || "",
        disputed_amount: caseData.disputed_amount ?? null,
        demand_amount: caseData.demand_amount ?? null,
        original_income: caseData.original_income ?? null,
        assessed_income: caseData.assessed_income ?? null,
        addition_amount: caseData.addition_amount ?? null,
        tax_effect: caseData.tax_effect ?? null,
        penalty_amount: caseData.penalty_amount ?? null,
        interest_amount: caseData.interest_amount ?? null,
        notes: caseData.notes || "",
        notice_date: caseData.notice_date || "",
        order_date: caseData.order_date || "",
        appeal_due_date: caseData.appeal_due_date || "",
        limitation_date: caseData.limitation_date || "",
        response_due_date: caseData.response_due_date || "",
      });
    }
  }, [open, caseData, form]);

  const onSubmit = async (data: CaseFormValues) => {
    try {
      await updateCase.mutateAsync({
        id: caseData.id,
        client_name: data.client_name,
        client_pan: data.client_pan || null,
        assessment_year: data.assessment_year,
        financial_year: data.financial_year || null,
        stage: data.stage,
        status: data.status,
        section_involved: data.section_involved || null,
        appeal_number: data.appeal_number || null,
        ita_number: data.ita_number || null,
        din_number: data.din_number || null,
        ao_name: data.ao_name || null,
        ao_designation: data.ao_designation || null,
        disputed_amount: data.disputed_amount ?? null,
        demand_amount: data.demand_amount ?? null,
        original_income: data.original_income ?? null,
        assessed_income: data.assessed_income ?? null,
        addition_amount: data.addition_amount ?? null,
        tax_effect: data.tax_effect ?? null,
        penalty_amount: data.penalty_amount ?? null,
        interest_amount: data.interest_amount ?? null,
        notes: data.notes || null,
        notice_date: data.notice_date || null,
        order_date: data.order_date || null,
        appeal_due_date: data.appeal_due_date || null,
        limitation_date: data.limitation_date || null,
        response_due_date: data.response_due_date || null,
      });
      toast.success("Case updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update case:", error);
      toast.error("Failed to update case");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-primary" />
            Edit Case
          </DialogTitle>
          <DialogDescription>
            Update case details for {caseData.client_name} - AY {caseData.assessment_year}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="gap-2">
                  <User className="h-4 w-4" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="financial" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial
                </TabsTrigger>
                <TabsTrigger value="dates" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
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
                                {option.label}
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
                  name="din_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DIN Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Document Identification Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ao_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AO Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Assessing Officer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ao_designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AO Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="Officer designation" {...field} />
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
                    name="original_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Income (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assessed_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessed Income (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addition_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Addition Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disputed_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disputed Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="demand_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Demand Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax_effect"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Effect (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="penalty_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penalty Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="dates" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notice_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notice Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appeal_due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appeal Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="limitation_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limitation Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="response_due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCase.isPending}>
                {updateCase.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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
