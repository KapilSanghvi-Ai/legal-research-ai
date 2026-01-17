import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCase } from "@/hooks/use-cases";
import { useHearings } from "@/hooks/use-litigation";
import { useCaseActivities, useCaseDocuments, useCaseTasks, useCaseResearch } from "@/hooks/use-case-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Gavel,
  BookOpen,
  CheckSquare,
  Activity,
  Edit,
  MoreHorizontal,
  ExternalLink,
  AlertTriangle,
  DollarSign,
  User,
  Building,
  Scale,
  Plus,
  FolderOpen,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const stageConfig = {
  assessment: { label: "Assessment", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  cita: { label: "CIT(A)", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  itat: { label: "ITAT", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  hc: { label: "High Court", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-muted" },
};

const statusConfig = {
  drafting: { label: "Drafting", color: "bg-info/10 text-info border-info/20" },
  research: { label: "Research", color: "bg-warning/10 text-warning border-warning/20" },
  hearing: { label: "Hearing", color: "bg-success/10 text-success border-success/20" },
  archived: { label: "Archived", color: "bg-muted text-muted-foreground border-muted" },
};

const activityIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-4 w-4" />,
  stage_change: <Scale className="h-4 w-4" />,
  status_change: <Activity className="h-4 w-4" />,
  document_added: <FileText className="h-4 w-4" />,
  hearing_scheduled: <Gavel className="h-4 w-4" />,
  note_added: <Edit className="h-4 w-4" />,
  default: <Clock className="h-4 w-4" />,
};

const priorityConfig = {
  low: { color: "text-muted-foreground", bg: "bg-muted" },
  medium: { color: "text-info", bg: "bg-info/10" },
  high: { color: "text-warning", bg: "bg-warning/10" },
  urgent: { color: "text-destructive", bg: "bg-destructive/10" },
};

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const { data: caseData, isLoading: caseLoading, error: caseError } = useCase(caseId || "");
  const { data: activities = [], isLoading: activitiesLoading } = useCaseActivities(caseId || "");
  const { data: documents = [], isLoading: documentsLoading } = useCaseDocuments(caseId || "");
  const { data: tasks = [], isLoading: tasksLoading } = useCaseTasks(caseId || "");
  const { data: research = [], isLoading: researchLoading } = useCaseResearch(caseId || "");
  const { data: hearings = [], isLoading: hearingsLoading } = useHearings({ caseId });

  if (caseLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (caseError || !caseData) {
    return (
      <AppLayout title="Case Not Found">
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Briefcase className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Case not found</h2>
          <p className="text-muted-foreground">The case you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate("/cases")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </AppLayout>
    );
  }

  const stageInfo = stageConfig[caseData.stage] || stageConfig.assessment;
  const statusInfo = statusConfig[caseData.status] || statusConfig.research;
  
  const upcomingHearing = hearings.find(h => 
    h.case_id === caseId && 
    h.status === "scheduled" && 
    parseISO(h.hearing_date) >= new Date()
  );

  const daysUntilHearing = upcomingHearing 
    ? differenceInDays(parseISO(upcomingHearing.hearing_date), new Date())
    : null;

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const taskProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout title={`${caseData.client_name} - AY ${caseData.assessment_year}`}>
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
          <div className="flex items-start gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/cases")}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-heading font-semibold text-foreground">
                  {caseData.client_name}
                </h1>
                <Badge variant="outline" className={cn("font-medium", stageInfo.color)}>
                  {stageInfo.label}
                </Badge>
                <Badge variant="outline" className={cn("font-medium", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  AY {caseData.assessment_year}
                </span>
                {caseData.client_pan && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {caseData.client_pan}
                  </span>
                )}
                {caseData.ita_number && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    {caseData.ita_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Open in Drive
            </Button>
          </div>
        </div>

        {/* Urgent Alert */}
        {daysUntilHearing !== null && daysUntilHearing <= 7 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-warning">Upcoming Hearing</p>
                <p className="text-sm text-muted-foreground">
                  Hearing scheduled in {daysUntilHearing} day{daysUntilHearing !== 1 ? "s" : ""} at {upcomingHearing?.forum}
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-warning/50 text-warning hover:bg-warning/10">
                View Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview Card */}
            <Card className="border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Case Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Issues */}
                {caseData.issuesList.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Issues</h4>
                    <div className="flex flex-wrap gap-2">
                      {caseData.issuesList.map((issue, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Involved */}
                {caseData.section_involved && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Sections Involved</h4>
                    <p className="text-foreground">{caseData.section_involved}</p>
                  </div>
                )}

                <Separator />

                {/* Financial Summary */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Disputed</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.disputed_amount)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Demand</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.demand_amount)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Addition</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.addition_amount)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Tax Effect</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.tax_effect)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {caseData.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                      <p className="text-foreground text-sm whitespace-pre-wrap">{caseData.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Documents, Research, Hearings */}
            <Card className="border-border/40">
              <Tabs defaultValue="documents" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-4">
                    <TabsTrigger 
                      value="documents"
                      className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-medium"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Documents ({documents.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="research"
                      className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-medium"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Research ({research.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="hearings"
                      className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-medium"
                    >
                      <Gavel className="h-4 w-4 mr-2" />
                      Hearings ({hearings.length})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <TabsContent value="documents" className="mt-0">
                    {documentsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type?.toUpperCase()} • v{doc.version} • {doc.status}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(doc.updated_at), { addSuffix: true })}
                            </div>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySection
                        icon={<FileText className="h-8 w-8" />}
                        title="No documents yet"
                        description="Documents related to this case will appear here"
                        actionLabel="Add Document"
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="research" className="mt-0">
                    {researchLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-20" />
                        ))}
                      </div>
                    ) : research.length > 0 ? (
                      <div className="space-y-3">
                        {research.map((item) => (
                          <div 
                            key={item.id}
                            className="p-4 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{item.sources?.title || "Unknown source"}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.sources?.citation} • {item.sources?.court}
                                </p>
                                {item.excerpt && (
                                  <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{item.excerpt}</p>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "shrink-0",
                                  item.purpose === "support" && "bg-success/10 text-success border-success/20",
                                  item.purpose === "distinguish" && "bg-warning/10 text-warning border-warning/20",
                                  item.purpose === "reference" && "bg-info/10 text-info border-info/20"
                                )}
                              >
                                {item.purpose}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySection
                        icon={<BookOpen className="h-8 w-8" />}
                        title="No research linked"
                        description="Link case law and research materials to this case"
                        actionLabel="Add Research"
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="hearings" className="mt-0">
                    {hearingsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-20" />
                        ))}
                      </div>
                    ) : hearings.length > 0 ? (
                      <div className="space-y-3">
                        {hearings.map((hearing) => {
                          const isPast = parseISO(hearing.hearing_date) < new Date();
                          return (
                            <div 
                              key={hearing.id}
                              className={cn(
                                "p-4 rounded-lg border transition-colors",
                                isPast 
                                  ? "border-border/40 bg-muted/30" 
                                  : "border-primary/30 bg-primary/5"
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isPast ? "bg-muted" : "bg-primary/10"
                                  )}>
                                    <Gavel className={cn(
                                      "h-4 w-4",
                                      isPast ? "text-muted-foreground" : "text-primary"
                                    )} />
                                  </div>
                                  <div>
                                    <p className="font-medium">{hearing.forum}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(parseISO(hearing.hearing_date), "MMMM d, yyyy")}
                                      {hearing.hearing_time && ` at ${hearing.hearing_time}`}
                                    </p>
                                    {hearing.bench && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Bench: {hearing.bench}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    hearing.status === "scheduled" && "bg-info/10 text-info border-info/20",
                                    hearing.status === "heard" && "bg-success/10 text-success border-success/20",
                                    hearing.status === "adjourned" && "bg-warning/10 text-warning border-warning/20",
                                    hearing.status === "decided" && "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                  )}
                                >
                                  {hearing.status}
                                </Badge>
                              </div>
                              {hearing.outcome && (
                                <p className="text-sm mt-3 text-foreground/80">{hearing.outcome}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptySection
                        icon={<Gavel className="h-8 w-8" />}
                        title="No hearings scheduled"
                        description="Schedule hearings for this case"
                        actionLabel="Schedule Hearing"
                      />
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Tasks Card */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    Tasks
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tasks.length > 0 && (
                  <div className="flex items-center gap-3 mt-2">
                    <Progress value={taskProgress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {completedTasks.length}/{tasks.length}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : pendingTasks.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-4">
                      {pendingTasks.slice(0, 5).map((task) => {
                        const priority = task.priority || "medium";
                        const config = priorityConfig[priority];
                        return (
                          <div 
                            key={task.id}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className={cn("w-1.5 h-1.5 rounded-full mt-2", config.bg, config.color)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              {task.due_date && (
                                <p className="text-xs text-muted-foreground">
                                  Due {format(parseISO(task.due_date), "MMM d")}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending tasks
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="relative pr-4">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-4">
                        {activities.slice(0, 10).map((activity, index) => (
                          <div key={activity.id} className="relative pl-8">
                            <div className="absolute left-0 p-1.5 rounded-full bg-background border border-border">
                              {activityIcons[activity.activity_type] || activityIcons.default}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.title}</p>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {activity.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Key Dates Card */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {caseData.notice_date && (
                  <DateRow label="Notice Date" date={caseData.notice_date} />
                )}
                {caseData.order_date && (
                  <DateRow label="Order Date" date={caseData.order_date} />
                )}
                {caseData.appeal_due_date && (
                  <DateRow label="Appeal Due" date={caseData.appeal_due_date} isUrgent />
                )}
                {caseData.limitation_date && (
                  <DateRow label="Limitation" date={caseData.limitation_date} isUrgent />
                )}
                {caseData.response_due_date && (
                  <DateRow label="Response Due" date={caseData.response_due_date} />
                )}
                {!caseData.notice_date && !caseData.order_date && !caseData.appeal_due_date && !caseData.limitation_date && !caseData.response_due_date && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No key dates set
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function DateRow({ label, date, isUrgent }: { label: string; date: string; isUrgent?: boolean }) {
  const parsedDate = parseISO(date);
  const daysUntil = differenceInDays(parsedDate, new Date());
  const isPast = daysUntil < 0;
  const isNear = !isPast && daysUntil <= 7;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-sm font-medium",
          isUrgent && isNear && "text-warning",
          isUrgent && isPast && "text-destructive"
        )}>
          {format(parsedDate, "MMM d, yyyy")}
        </span>
        {isUrgent && isNear && !isPast && (
          <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
            {daysUntil}d
          </Badge>
        )}
      </div>
    </div>
  );
}

function EmptySection({ 
  icon, 
  title, 
  description, 
  actionLabel 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-muted/50 text-muted-foreground mb-3">
        {icon}
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <Button variant="outline" size="sm" className="mt-4">
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    </div>
  );
}
