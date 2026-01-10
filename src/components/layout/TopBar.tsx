import { Search, Bell, User, Command, ChevronRight, Plus, Gavel } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  title?: string;
  caseContext?: {
    name: string;
    assessmentYear?: string;
    stage?: "Assessment" | "CIT(A)" | "ITAT" | "Closed";
  };
}

// Breadcrumb configuration based on routes
const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/" }
  ];

  if (segments.length === 0) return crumbs;

  const routeLabels: Record<string, string> = {
    cases: "Cases",
    research: "Research",
    chat: "AI Chat",
    documents: "Documents",
    templates: "Templates",
    settings: "Settings",
    calendar: "Calendar",
    tasks: "Tasks",
  };

  let currentPath = "";
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment;
    crumbs.push({ label, href: currentPath });
  });

  return crumbs;
};

const stageColors: Record<string, string> = {
  Assessment: "bg-info/15 text-info border-info/30",
  "CIT(A)": "bg-warning/15 text-warning border-warning/30",
  ITAT: "bg-accent/15 text-accent border-accent/30",
  Closed: "bg-success/15 text-success border-success/30",
};

export function TopBar({ title, caseContext }: TopBarProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left: Breadcrumbs + Case Context */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground truncate max-w-[150px]">
                  {title || crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[100px]"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Case Context Pill */}
        {caseContext && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-2 px-2.5 bg-secondary/50 border-border/50 hover:bg-secondary"
              >
                <Gavel className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium truncate max-w-[180px]">
                  {caseContext.name}
                </span>
                {caseContext.assessmentYear && (
                  <span className="text-[10px] text-muted-foreground">
                    AY {caseContext.assessmentYear}
                  </span>
                )}
                {caseContext.stage && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${stageColors[caseContext.stage]}`}
                  >
                    {caseContext.stage}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Case
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Reliance Industries v. DCIT</DropdownMenuItem>
              <DropdownMenuItem>TCS Ltd v. ACIT</DropdownMenuItem>
              <DropdownMenuItem>Infosys Ltd v. CIT</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cases, judgments, documents..."
            className="pl-10 pr-12 bg-secondary/50 border-transparent focus:border-primary/30 focus:bg-background transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Quick Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Gavel className="w-4 h-4 mr-2" />
              New Case
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Search className="w-4 h-4 mr-2" />
              Start Research
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  MC
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">Maharishi &amp; Co</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Team Settings</DropdownMenuItem>
            <DropdownMenuItem>Audit Log</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
