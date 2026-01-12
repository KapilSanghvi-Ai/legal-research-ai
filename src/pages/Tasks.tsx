import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Filter,
  Briefcase,
} from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCases } from "@/hooks/use-litigation";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-500", textColor: "text-slate-500" },
  medium: { label: "Medium", color: "bg-blue-500", textColor: "text-blue-500" },
  high: { label: "High", color: "bg-orange-500", textColor: "text-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-500", textColor: "text-red-500" },
};

const statusConfig = {
  pending: { label: "Pending", icon: Circle, color: "text-slate-500" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-blue-500" },
  review: { label: "Review", icon: AlertCircle, color: "text-orange-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  cancelled: { label: "Cancelled", icon: Circle, color: "text-muted-foreground" },
};

const taskTypes = [
  { value: "drafting", label: "Drafting" },
  { value: "research", label: "Research" },
  { value: "filing", label: "Filing" },
  { value: "hearing_prep", label: "Hearing Prep" },
  { value: "review", label: "Review" },
  { value: "client_communication", label: "Client Communication" },
  { value: "other", label: "Other" },
];

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tasks, isLoading, error } = useTasks({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
  });
  const { data: cases } = useCases();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    case_id: "",
    task_type: "",
    due_date: "",
    priority: "medium" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        ...formData,
        case_id: formData.case_id || null,
        task_type: formData.task_type || null,
        due_date: formData.due_date || null,
      });
      toast.success("Task created successfully");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        case_id: "",
        task_type: "",
        due_date: "",
        priority: "medium",
      });
    } catch (err) {
      toast.error("Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus as any,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      });
      toast.success("Task updated");
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const filteredTasks = tasks?.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.cases?.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedTasks = {
    overdue: filteredTasks.filter(
      (t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "completed" && t.status !== "cancelled"
    ),
    today: filteredTasks.filter(
      (t) => t.due_date && isToday(new Date(t.due_date)) && t.status !== "completed" && t.status !== "cancelled"
    ),
    tomorrow: filteredTasks.filter(
      (t) => t.due_date && isTomorrow(new Date(t.due_date)) && t.status !== "completed" && t.status !== "cancelled"
    ),
    upcoming: filteredTasks.filter(
      (t) => t.due_date && new Date(t.due_date) > addDays(new Date(), 1) && t.status !== "completed" && t.status !== "cancelled"
    ),
    noDueDate: filteredTasks.filter(
      (t) => !t.due_date && t.status !== "completed" && t.status !== "cancelled"
    ),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  const TaskCard = ({ task }: { task: typeof filteredTasks[0] }) => {
    const StatusIcon = statusConfig[task.status].icon;
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

    return (
      <div
        className={cn(
          "group flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-all",
          task.status === "completed" && "opacity-60"
        )}
      >
        <Checkbox
          checked={task.status === "completed"}
          onCheckedChange={(checked) =>
            handleStatusChange(task.id, checked ? "completed" : "pending")
          }
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "font-medium",
                task.status === "completed" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant="outline"
                className={cn("text-xs", priorityConfig[task.priority].textColor)}
              >
                {priorityConfig[task.priority].label}
              </Badge>
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {task.cases && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span className="truncate max-w-[150px]">
                  {task.cases.client_name} ({task.cases.assessment_year})
                </span>
              </div>
            )}
            {task.due_date && (
              <div
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive"
                )}
              >
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), "MMM d, yyyy")}
              </div>
            )}
            {task.task_type && (
              <Badge variant="secondary" className="text-xs">
                {taskTypes.find((t) => t.value === task.task_type)?.label || task.task_type}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TaskGroup = ({
    title,
    tasks,
    icon,
    className,
  }: {
    title: string;
    tasks: typeof filteredTasks;
    icon: React.ReactNode;
    className?: string;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Tasks">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your workflow</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="case_id">Related Case</Label>
                    <Select
                      value={formData.case_id}
                      onValueChange={(value) => setFormData({ ...formData, case_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select case" />
                      </SelectTrigger>
                      <SelectContent>
                        {cases?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.client_name} ({c.assessment_year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="task_type">Task Type</Label>
                    <Select
                      value={formData.task_type}
                      onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTask.isPending}>
                    Create Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{groupedTasks.overdue.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {tasks?.filter((t) => t.status === "in_progress").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{groupedTasks.completed.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12">
            Failed to load tasks. Please try again.
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No tasks found. Create your first task to get started.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <TaskGroup
              title="Overdue"
              tasks={groupedTasks.overdue}
              icon={<AlertCircle className="w-4 h-4 text-destructive" />}
              className="border-l-2 border-destructive pl-4"
            />
            <TaskGroup
              title="Today"
              tasks={groupedTasks.today}
              icon={<Clock className="w-4 h-4 text-orange-500" />}
            />
            <TaskGroup
              title="Tomorrow"
              tasks={groupedTasks.tomorrow}
              icon={<Calendar className="w-4 h-4 text-blue-500" />}
            />
            <TaskGroup
              title="Upcoming"
              tasks={groupedTasks.upcoming}
              icon={<Calendar className="w-4 h-4" />}
            />
            <TaskGroup
              title="No Due Date"
              tasks={groupedTasks.noDueDate}
              icon={<Circle className="w-4 h-4" />}
            />
            <TaskGroup
              title="Completed"
              tasks={groupedTasks.completed}
              icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
