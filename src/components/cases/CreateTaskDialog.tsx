import { useState } from "react";
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-litigation";
import { useQueryClient } from "@tanstack/react-query";
import { caseDetailKeys, Task } from "@/hooks/use-case-details";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  task?: Task | null;
}

const taskTypes = [
  { value: "research", label: "Research" },
  { value: "drafting", label: "Drafting" },
  { value: "review", label: "Review" },
  { value: "filing", label: "Filing" },
  { value: "hearing_prep", label: "Hearing Prep" },
  { value: "client_communication", label: "Client Communication" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  caseId,
  task,
}: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const isEditing = !!task;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    task_type: task?.task_type || "",
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
    due_time: task?.due_time || "",
    estimated_hours: task?.estimated_hours?.toString() || "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      task_type: "",
      priority: "medium",
      due_date: "",
      due_time: "",
      estimated_hours: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        task_type: formData.task_type || null,
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        due_date: formData.due_date || null,
        due_time: formData.due_time || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        case_id: caseId,
      };

      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, ...taskData });
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync(taskData);
        toast.success("Task created successfully");
      }
      
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.tasks(caseId) });
      onOpenChange(false);
      if (!isEditing) resetForm();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error(isEditing ? "Failed to update task" : "Failed to create task");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    try {
      await deleteTask.mutateAsync(task.id);
      queryClient.invalidateQueries({ queryKey: caseDetailKeys.tasks(caseId) });
      toast.success("Task deleted successfully");
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;
  const isDeleting = deleteTask.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the task details below."
                : "Add a new task for this case."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high" | "urgent") => 
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_time">Due Time</Label>
                <Input
                  id="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="e.g., 2.5"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isSubmitting || isDeleting}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
