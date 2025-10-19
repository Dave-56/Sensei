import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Key, Bell, Users, Webhook } from "lucide-react";

//todo: remove mock functionality
const mockTeamMembers = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Member" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "Member" },
];

export default function SettingsPage() {
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure integrations, alerts, and team access
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="slack" data-testid="tab-slack">
            <Webhook className="w-4 h-4 mr-2" />
            Slack
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">API Keys</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="production-key">Production Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="production-key"
                    type="password"
                    value="sk_prod_••••••••••••••••"
                    readOnly
                    className="font-mono"
                    data-testid="input-production-key"
                  />
                  <Button variant="outline" data-testid="button-reveal-key">Reveal</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-key">Test Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-key"
                    type="password"
                    value="sk_test_••••••••••••••••"
                    readOnly
                    className="font-mono"
                    data-testid="input-test-key"
                  />
                  <Button variant="outline" data-testid="button-regenerate-key">Regenerate</Button>
                </div>
              </div>
              <Button data-testid="button-create-key">Create New Key</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="slack">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Slack Integration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send alerts to your Slack workspace
                </p>
              </div>
              <Switch
                checked={slackEnabled}
                onCheckedChange={setSlackEnabled}
                data-testid="switch-slack-enabled"
              />
            </div>
            {slackEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://hooks.slack.com/services/..."
                    className="font-mono text-sm"
                    data-testid="input-webhook-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Input
                    id="channel"
                    placeholder="#health-alerts"
                    data-testid="input-channel"
                  />
                </div>
                <Button data-testid="button-test-connection">Test Connection</Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for critical failures
                  </p>
                </div>
                <Switch
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                  data-testid="switch-email-alerts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health-threshold">
                  Health Score Threshold (trigger alert when below)
                </Label>
                <Input
                  id="health-threshold"
                  type="number"
                  defaultValue="50"
                  min="0"
                  max="100"
                  data-testid="input-health-threshold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="failure-rate">
                  Failure Rate Threshold (%) (trigger alert when above)
                </Label>
                <Input
                  id="failure-rate"
                  type="number"
                  defaultValue="5"
                  min="0"
                  max="100"
                  step="0.1"
                  data-testid="input-failure-rate"
                />
              </div>
              <Button data-testid="button-save-thresholds">Save Thresholds</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <Button data-testid="button-invite-member">Invite Member</Button>
            </div>
            <div className="space-y-3">
              {mockTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                  data-testid={`team-member-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === "Admin" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
