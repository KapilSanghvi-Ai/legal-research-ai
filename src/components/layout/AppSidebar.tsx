import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderOpen, Search, MessageSquare, FileText, BookOpen, Settings, ChevronLeft, ChevronRight, ChevronDown, Scale, Gavel, BookMarked, History, FileEdit, Library, Calendar, CheckSquare, Archive, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface NavItem {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  href: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}
const navGroups: NavGroup[] = [{
  label: "LITIGATION",
  defaultOpen: true,
  items: [{
    icon: Briefcase,
    label: "Active Cases",
    href: "/cases"
  }, {
    icon: FolderOpen,
    label: "My Assignments",
    href: "/cases?filter=assigned"
  }, {
    icon: Archive,
    label: "Archived",
    href: "/cases?filter=archived"
  }]
}, {
  label: "RESEARCH",
  defaultOpen: true,
  items: [{
    icon: Search,
    label: "Search Case Law",
    href: "/research"
  }, {
    icon: MessageSquare,
    label: "AI Research Chat",
    href: "/chat"
  }, {
    icon: BookMarked,
    label: "Bookmarked Sources",
    href: "/research?tab=bookmarks"
  }, {
    icon: History,
    label: "Search History",
    href: "/research?tab=history"
  }]
}, {
  label: "DRAFTING",
  defaultOpen: false,
  items: [{
    icon: FileText,
    label: "Documents",
    href: "/documents"
  }, {
    icon: BookOpen,
    label: "Templates",
    href: "/templates"
  }, {
    icon: Library,
    label: "Clause Library",
    href: "/templates?tab=clauses"
  }]
}, {
  label: "WORKSPACE",
  defaultOpen: false,
  items: [{
    icon: Calendar,
    label: "Calendar",
    href: "/calendar"
  }, {
    icon: CheckSquare,
    label: "Tasks",
    href: "/tasks"
  }]
}];
const bottomNavItems = [{
  icon: Settings,
  label: "Settings",
  href: "/settings"
}];
export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(navGroups.reduce((acc, group) => ({
    ...acc,
    [group.label]: group.defaultOpen ?? false
  }), {}));
  const location = useLocation();
  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };
  const isItemActive = (href: string) => {
    const basePath = href.split("?")[0];
    return location.pathname === basePath || location.pathname === href;
  };
  return <aside className={cn("h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out", isCollapsed ? "w-[72px]" : "w-[260px]")}>
      {/* Logo Section */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && <div className="flex flex-col">
              <span className="font-heading font-semibold text-sidebar-foreground text-sm">Litigation RAG</span>
              <span className="text-[10px] text-sidebar-muted">
                Litigation Intelligence
              </span>
            </div>}
        </Link>
      </div>

      {/* Dashboard Link */}
      <nav className="pt-4 px-2">
        {(() => {
        const isActive = location.pathname === "/";
        const DashboardLink = <Link to="/" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <LayoutDashboard className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>;
        if (isCollapsed) {
          return <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{DashboardLink}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Dashboard
                </TooltipContent>
              </Tooltip>;
        }
        return DashboardLink;
      })()}
      </nav>

      {/* Grouped Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navGroups.map(group => {
        const isGroupOpen = openGroups[group.label];
        const hasActiveItem = group.items.some(item => isItemActive(item.href));
        if (isCollapsed) {
          return <div key={group.label} className="space-y-1">
                {group.items.map(item => {
              const isActive = isItemActive(item.href);
              return <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link to={item.href} className={cn("flex items-center justify-center p-2.5 rounded-lg transition-all duration-200", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50")}>
                          <item.icon className={cn("w-5 h-5", isActive && "text-sidebar-primary")} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>;
            })}
              </div>;
        }
        return <Collapsible key={group.label} open={isGroupOpen || hasActiveItem} onOpenChange={() => toggleGroup(group.label)}>
              <CollapsibleTrigger asChild>
                <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold tracking-wider transition-colors", "text-sidebar-muted hover:text-sidebar-foreground/80")}>
                  <span>{group.label}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isGroupOpen || hasActiveItem ? "rotate-0" : "-rotate-90")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {group.items.map(item => {
              const isActive = isItemActive(item.href);
              return <Link key={item.href} to={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50")}>
                      <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-sidebar-primary")} />
                      <span>{item.label}</span>
                    </Link>;
            })}
              </CollapsibleContent>
            </Collapsible>;
      })}
      </nav>

      {/* Bottom Section */}
      <div className="py-4 px-2 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map(item => {
        const isActive = location.pathname === item.href;
        const NavLink = <Link key={item.href} to={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>;
        if (isCollapsed) {
          return <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>;
        }
        return NavLink;
      })}

        {/* Collapse Toggle */}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50", isCollapsed && "justify-center px-0")}>
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>}
        </Button>
      </div>
    </aside>;
}