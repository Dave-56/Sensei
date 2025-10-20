import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Bell, Webhook, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

// single-user MVP: no teams/members

export default function SettingsPage() {
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure API keys, integrations, and alert thresholds (single admin)
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
          <TabsTrigger value="admin" data-testid="tab-admin">
            <User className="w-4 h-4 mr-2" />
            Admin
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

        {null}

        <TabsContent value="admin">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Account</h3>
                <p className="text-sm text-muted-foreground">Profile and session details</p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">admin@example.com</p>
                  <p className="text-xs text-muted-foreground">Provider: Email (verified)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled title="Coming soon" data-testid="button-change-email">Change Email</Button>
                <Button variant="outline" disabled title="Coming soon" data-testid="button-change-password">Change Password</Button>
              </div>
              <div className="text-xs text-muted-foreground">Last login: 2 hours ago • IP 203.0.113.5</div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Security</h3>
                <p className="text-sm text-muted-foreground">Protect your account</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Off</Badge>
                  <Button size="sm" disabled title="Coming soon" data-testid="button-enable-2fa">Enable 2FA</Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recovery Codes</p>
                  <p className="text-xs text-muted-foreground">Use if you lose access to 2FA</p>
                </div>
                <Button size="sm" variant="outline" disabled title="Coming soon" data-testid="button-generate-recovery-codes">Generate</Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Connected Providers</h3>
                <p className="text-sm text-muted-foreground">OAuth connections</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaGithub className="w-4 h-4" />
                    <span className="text-sm">GitHub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Not connected</Badge>
                    <Button size="sm" disabled title="Coming soon" data-testid="button-connect-github">Connect</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FcGoogle className="w-4 h-4" />
                    <span className="text-sm">Google</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Connected</Badge>
                    <Button size="sm" variant="outline" disabled title="Coming soon" data-testid="button-disconnect-google">Disconnect</Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Active Sessions</h3>
                <p className="text-sm text-muted-foreground">Signed-in devices</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">Chrome on macOS • This device</p>
                    <p className="text-xs text-muted-foreground">Last seen just now • San Francisco</p>
                  </div>
                  <Button size="sm" variant="outline" disabled title="Coming soon" data-testid="button-revoke-session-1">Revoke</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">Safari on iPhone</p>
                    <p className="text-xs text-muted-foreground">Last seen 3 days ago • New York</p>
                  </div>
                  <Button size="sm" variant="outline" disabled title="Coming soon" data-testid="button-revoke-session-2">Revoke</Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" data-testid="signout">Sign Out</Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4 md:col-span-2">
              <div>
                <h3 className="text-lg font-semibold">Security Log</h3>
                <p className="text-sm text-muted-foreground">Recent account activity</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm">Signed in from Chrome on macOS</span>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm">Changed alert threshold</span>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm">Generated new API key</span>
                  <span className="text-xs text-muted-foreground">5d ago</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
