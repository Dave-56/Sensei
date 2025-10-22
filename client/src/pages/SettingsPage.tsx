import { useEffect, useMemo, useState } from "react";
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
import { useLiveDataFlag } from "@/contexts/LiveDataContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

// single-user MVP: no teams/members

export default function SettingsPage() {
  const { enabled: live } = useLiveDataFlag();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [healthThreshold, setHealthThreshold] = useState<number>(50);
  const [failureRate, setFailureRate] = useState<number>(5);
  const [newKeyName, setNewKeyName] = useState("");
  const [lastCreatedSecret, setLastCreatedSecret] = useState<string | null>(null);

  // Load settings
  const settingsQuery = useQuery<{ id: number; slack_webhook_url: string | null; alert_thresholds: any; updated_at: string | null }>(
    {
      queryKey: ["/api/v1/settings"],
      enabled: live,
    },
  );

  useEffect(() => {
    if (live && settingsQuery.data) {
      const s = settingsQuery.data;
      setWebhookUrl(s.slack_webhook_url || "");
      setSlackEnabled(!!s.slack_webhook_url);
      const t = (s.alert_thresholds || {}) as { low_health?: number; failure_rate?: number; email_alerts?: boolean };
      if (typeof t.low_health === "number") setHealthThreshold(t.low_health);
      if (typeof t.failure_rate === "number") setFailureRate(t.failure_rate);
      if (typeof t.email_alerts === "boolean") setEmailAlerts(t.email_alerts);
    }
  }, [live, settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const body = {
        slack_webhook_url: slackEnabled && webhookUrl ? webhookUrl : null,
        alert_thresholds: {
          low_health: healthThreshold,
          failure_rate: failureRate,
          email_alerts: emailAlerts,
        },
      };
      const res = await apiRequest("PUT", "/api/v1/settings", body);
      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v1/settings"] });
    },
  });

  // API keys
  type ApiKey = { id: string; name: string | null; prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null };
  const keysQuery = useQuery<ApiKey[]>({
    queryKey: ["/api/v1/api-keys"],
    enabled: live,
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/v1/api-keys", { name: newKeyName || "New Key" });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setLastCreatedSecret(data.api_key as string);
      setNewKeyName("");
      qc.invalidateQueries({ queryKey: ["/api/v1/api-keys"] });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/v1/api-keys/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v1/api-keys"] });
    },
  });

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
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">API Keys</h3>
            <p className="text-sm text-muted-foreground">Create and manage keys. Existing keys are hashed — only new keys reveal a one-time secret.</p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="new-key-name">Key Name</Label>
                <Input id="new-key-name" placeholder="e.g. Production" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} data-testid="input-new-key-name" />
              </div>
              <Button onClick={() => createKeyMutation.mutate()} disabled={!live} data-testid="button-create-key">Create Key</Button>
            </div>
            {lastCreatedSecret && (
              <div className="p-3 rounded-md border bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Copy and store this key now. You won’t be able to view it again.</div>
                <code className="text-sm font-mono break-all">{lastCreatedSecret}</code>
              </div>
            )}
            <div className="space-y-2">
              <div className="text-sm font-medium">Existing Keys</div>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Prefix</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Last Used</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(live ? keysQuery.data || [] : []).map((k) => (
                      <tr key={k.id} className="border-b last:border-b-0">
                        <td className="p-2">{k.name || "—"}</td>
                        <td className="p-2 font-mono">{k.prefix}</td>
                        <td className="p-2">{new Date(k.created_at).toLocaleString()}</td>
                        <td className="p-2">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}</td>
                        <td className="p-2">{k.revoked_at ? <Badge variant="secondary">Revoked</Badge> : <Badge>Active</Badge>}</td>
                        <td className="p-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!k.revoked_at || !live}
                            onClick={() => revokeKeyMutation.mutate(k.id)}
                            data-testid={`button-revoke-${k.id}`}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!live && (
                      <tr>
                        <td className="p-2 text-muted-foreground" colSpan={6}>Enable Live Data to view keys</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
              <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} data-testid="switch-slack-enabled" />
            </div>
            {slackEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://hooks.slack.com/services/..." className="font-mono text-sm" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} data-testid="input-webhook-url" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Input
                    id="channel"
                    placeholder="#health-alerts"
                    data-testid="input-channel"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled title="Coming soon" data-testid="button-test-connection">Test Connection</Button>
                  <Button onClick={() => saveSettingsMutation.mutate()} disabled={!live} data-testid="button-save-slack">Save</Button>
                </div>
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
                <Input id="health-threshold" type="number" value={healthThreshold} onChange={(e) => setHealthThreshold(Number(e.target.value))} min="0" max="100" data-testid="input-health-threshold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="failure-rate">
                  Failure Rate Threshold (%) (trigger alert when above)
                </Label>
                <Input id="failure-rate" type="number" value={failureRate} onChange={(e) => setFailureRate(Number(e.target.value))} min="0" max="100" step="0.1" data-testid="input-failure-rate" />
              </div>
              <Button onClick={() => saveSettingsMutation.mutate()} disabled={!live} data-testid="button-save-thresholds">Save Thresholds</Button>
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
                  <AvatarFallback>
                    {(user?.user_metadata?.full_name
                      ? user.user_metadata.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
                      : user?.email?.[0]?.toUpperCase()) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{user?.email || "—"}</p>
                  {user?.user_metadata?.full_name && (
                    <p className="text-xs text-muted-foreground">{user.user_metadata.full_name}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled title="Coming soon" data-testid="button-change-email">Change Email</Button>
                <Button variant="outline" disabled title="Coming soon" data-testid="button-change-password">Change Password</Button>
              </div>
              <div className="text-xs text-muted-foreground">Signed in via Supabase</div>
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
