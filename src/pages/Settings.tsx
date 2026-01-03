import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Palette,
  Key,
  Database,
  Shield,
} from "lucide-react";

export default function Settings() {
  return (
    <AppLayout title="Settings">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Profile</CardTitle>
            </div>
            <CardDescription>
              Your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="firm">Firm / Organization</Label>
              <Input id="firm" placeholder="Enter your firm name" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred theme
                </p>
              </div>
              <Select defaultValue="dark">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use smaller spacing and fonts
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Research Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new relevant judgments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Case Deadlines</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders for upcoming deadlines
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">API Configuration</CardTitle>
            </div>
            <CardDescription>
              Manage your external service integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indiakanoon">India Kanoon API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="indiakanoon"
                  type="password"
                  placeholder="••••••••••••••••"
                  className="flex-1"
                />
                <Button variant="outline">Update</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for accessing India Kanoon case law database
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="openai">OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="openai"
                  type="password"
                  placeholder="••••••••••••••••"
                  className="flex-1"
                />
                <Button variant="outline">Update</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for AI-powered research and document generation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Data & Privacy</CardTitle>
            </div>
            <CardDescription>
              Manage your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Save Chat History</Label>
                <p className="text-sm text-muted-foreground">
                  Store your research conversations
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the application
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="pt-2">
              <Button variant="destructive" size="sm">
                Delete All Data
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete all your data including cases, documents, and research history.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
