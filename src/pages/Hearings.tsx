import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Users,
  Gavel,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useHearings, useCreateHearing, useUpdateHearing, useCases } from "@/hooks/use-litigation";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

const hearingStatusConfig = {
  scheduled: { label: "Scheduled", color: "bg-blue-500", textColor: "text-blue-500" },
  adjourned: { label: "Adjourned", color: "bg-orange-500", textColor: "text-orange-500" },
  part_heard: { label: "Part Heard", color: "bg-purple-500", textColor: "text-purple-500" },
  heard: { label: "Heard", color: "bg-green-500", textColor: "text-green-500" },
  decided: { label: "Decided", color: "bg-emerald-600", textColor: "text-emerald-600" },
  withdrawn: { label: "Withdrawn", color: "bg-slate-500", textColor: "text-slate-500" },
};

const forums = [
  "ITAT Mumbai",
  "ITAT Delhi",
  "ITAT Bangalore",
  "ITAT Chennai",
  "ITAT Kolkata",
  "ITAT Ahmedabad",
  "ITAT Pune",
  "ITAT Hyderabad",
  "CIT(A) Mumbai",
  "CIT(A) Delhi",
  "High Court Bombay",
  "High Court Delhi",
  "Supreme Court",
];

export default function Hearings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: hearings, isLoading, error } = useHearings({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: cases } = useCases();
  const createHearing = useCreateHearing();
  const updateHearing = useUpdateHearing();

  const [formData, setFormData] = useState({
    case_id: "",
    hearing_date: "",
    hearing_time: "",
    forum: "",
    bench: "",
    court_room: "",
    appearing_counsel: "",
    preparation_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHearing.mutateAsync({
        ...formData,
        hearing_time: formData.hearing_time || null,
        bench: formData.bench || null,
        court_room: formData.court_room || null,
        appearing_counsel: formData.appearing_counsel || null,
        preparation_notes: formData.preparation_notes || null,
      });
      toast.success("Hearing scheduled successfully");
      setIsDialogOpen(false);
      setFormData({
        case_id: "",
        hearing_date: "",
        hearing_time: "",
        forum: "",
        bench: "",
        court_room: "",
        appearing_counsel: "",
        preparation_notes: "",
      });
    } catch (err) {
      toast.error("Failed to schedule hearing");
    }
  };

  const handleStatusChange = async (hearingId: string, newStatus: string) => {
    try {
      await updateHearing.mutateAsync({
        id: hearingId,
        status: newStatus as any,
      });
      toast.success("Hearing status updated");
    } catch (err) {
      toast.error("Failed to update hearing");
    }
  };

  const filteredHearings = hearings?.filter(
    (h) =>
      h.forum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.cases?.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.cases?.ita_number?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const groupedHearings = {
    today: filteredHearings.filter(
      (h) => isToday(new Date(h.hearing_date)) && h.status === "scheduled"
    ),
    tomorrow: filteredHearings.filter(
      (h) => isTomorrow(new Date(h.hearing_date)) && h.status === "scheduled"
    ),
    thisWeek: filteredHearings.filter(
      (h) =>
        isWithinInterval(new Date(h.hearing_date), { start: thisWeekStart, end: thisWeekEnd }) &&
        !isToday(new Date(h.hearing_date)) &&
        !isTomorrow(new Date(h.hearing_date)) &&
        h.status === "scheduled"
    ),
    upcoming: filteredHearings.filter(
      (h) =>
        new Date(h.hearing_date) > thisWeekEnd &&
        h.status === "scheduled"
    ),
    past: filteredHearings.filter(
      (h) => isPast(new Date(h.hearing_date)) && !isToday(new Date(h.hearing_date))
    ),
  };

  const HearingCard = ({ hearing }: { hearing: typeof filteredHearings[0] }) => {
    const isUpcoming = !isPast(new Date(hearing.hearing_date)) || isToday(new Date(hearing.hearing_date));

    return (
      <Card className={cn("hover:shadow-md transition-all", !isUpcoming && "opacity-75")}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-xs", hearingStatusConfig[hearing.status].color)}>
                  {hearingStatusConfig[hearing.status].label}
                </Badge>
                {isToday(new Date(hearing.hearing_date)) && (
                  <Badge variant="destructive" className="text-xs">Today</Badge>
                )}
                {isTomorrow(new Date(hearing.hearing_date)) && (
                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">Tomorrow</Badge>
                )}
              </div>
              <h4 className="font-medium mb-1">
                {hearing.cases?.client_name || "Unknown Client"}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {hearing.cases?.ita_number || hearing.cases?.assessment_year}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(hearing.hearing_date), "EEE, MMM d, yyyy")}
                </div>
                {hearing.hearing_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {hearing.hearing_time}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {hearing.forum}
                  {hearing.court_room && ` - ${hearing.court_room}`}
                </div>
              </div>
              {hearing.bench && (
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate">{hearing.bench}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {isUpcoming && hearing.status === "scheduled" && (
                <Select
                  value={hearing.status}
                  onValueChange={(value) => handleStatusChange(hearing.id, value)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(hearingStatusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="sm" className="text-xs">
                View Details
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const HearingGroup = ({
    title,
    hearings,
    emptyMessage,
  }: {
    title: string;
    hearings: typeof filteredHearings;
    emptyMessage?: string;
  }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        {title}
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{hearings.length}</span>
      </h3>
      {hearings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{emptyMessage || "No hearings"}</p>
      ) : (
        <div className="space-y-3">
          {hearings.map((hearing) => (
            <HearingCard key={hearing.id} hearing={hearing} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AppLayout title="Hearings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search hearings by case, client, or forum..."
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
                {Object.entries(hearingStatusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Hearing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule New Hearing</DialogTitle>
                <DialogDescription>Add a hearing date for a case</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="case_id">Case *</Label>
                  <Select
                    value={formData.case_id}
                    onValueChange={(value) => setFormData({ ...formData, case_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases?.filter((c) => c.stage !== "closed").map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.client_name} ({c.assessment_year}) - {c.ita_number || c.stage.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hearing_date">Hearing Date *</Label>
                    <Input
                      id="hearing_date"
                      type="date"
                      value={formData.hearing_date}
                      onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hearing_time">Time</Label>
                    <Input
                      id="hearing_time"
                      type="time"
                      value={formData.hearing_time}
                      onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="forum">Forum *</Label>
                    <Select
                      value={formData.forum}
                      onValueChange={(value) => setFormData({ ...formData, forum: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select forum" />
                      </SelectTrigger>
                      <SelectContent>
                        {forums.map((forum) => (
                          <SelectItem key={forum} value={forum}>{forum}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="court_room">Court Room</Label>
                    <Input
                      id="court_room"
                      value={formData.court_room}
                      onChange={(e) => setFormData({ ...formData, court_room: e.target.value })}
                      placeholder="e.g., Court No. 5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bench">Bench</Label>
                  <Input
                    id="bench"
                    value={formData.bench}
                    onChange={(e) => setFormData({ ...formData, bench: e.target.value })}
                    placeholder="e.g., Shri ABC, JM and Shri XYZ, AM"
                  />
                </div>
                <div>
                  <Label htmlFor="appearing_counsel">Appearing Counsel</Label>
                  <Input
                    id="appearing_counsel"
                    value={formData.appearing_counsel}
                    onChange={(e) => setFormData({ ...formData, appearing_counsel: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="preparation_notes">Preparation Notes</Label>
                  <Textarea
                    id="preparation_notes"
                    value={formData.preparation_notes}
                    onChange={(e) => setFormData({ ...formData, preparation_notes: e.target.value })}
                    rows={3}
                    placeholder="Key points, documents to carry, arguments..."
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createHearing.isPending}>
                    Schedule Hearing
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{groupedHearings.today.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tomorrow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{groupedHearings.tomorrow.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{groupedHearings.thisWeek.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hearings?.filter((h) => h.status === "scheduled").length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Hearings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12">
            Failed to load hearings. Please try again.
          </div>
        ) : filteredHearings.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No hearings scheduled. Schedule your first hearing to get started.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedHearings.today.length > 0 && (
              <HearingGroup title="Today" hearings={groupedHearings.today} />
            )}
            {groupedHearings.tomorrow.length > 0 && (
              <HearingGroup title="Tomorrow" hearings={groupedHearings.tomorrow} />
            )}
            {groupedHearings.thisWeek.length > 0 && (
              <HearingGroup title="This Week" hearings={groupedHearings.thisWeek} />
            )}
            {groupedHearings.upcoming.length > 0 && (
              <HearingGroup title="Upcoming" hearings={groupedHearings.upcoming} />
            )}
            {groupedHearings.past.length > 0 && (
              <HearingGroup title="Past Hearings" hearings={groupedHearings.past} />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
