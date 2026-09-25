import { useState } from "react";
import { useListUsers, useSendSingleEmail, useSendBulkEmail, useSendTestEmail } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Mail, Users, Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminEmail() {
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { toast } = useToast();

  // Single email state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [singleSubject, setSingleSubject] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [singleSearch, setSingleSearch] = useState("");

  // Bulk email state
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");
  const [sendToAll, setSendToAll] = useState(true);

  const sendSingleEmail = useSendSingleEmail();
  const sendBulkEmail = useSendBulkEmail();
  const sendTestEmail = useSendTestEmail();

  const [testEmailTo, setTestEmailTo] = useState("");

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(singleSearch.toLowerCase()) || 
    u.firstName.toLowerCase().includes(singleSearch.toLowerCase()) || 
    u.lastName.toLowerCase().includes(singleSearch.toLowerCase())
  ) || [];

  const bulkFilteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(bulkSearch.toLowerCase()) || 
    u.firstName.toLowerCase().includes(bulkSearch.toLowerCase()) || 
    u.lastName.toLowerCase().includes(bulkSearch.toLowerCase())
  ) || [];

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId === selectedUserId ? "" : userId);
    setSingleSearch("");
  };

  const handleToggleBulkUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllBulk = () => {
    if (sendToAll) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(bulkFilteredUsers.map(u => u.id));
    }
    setSendToAll(!sendToAll);
  };

  const handleSendSingleEmail = () => {
    if (!selectedUserId || !singleSubject.trim() || !singleMessage.trim()) {
      toast({
        title: "Missing fields",
        description: "Please select a user and fill in subject and message.",
        variant: "destructive",
      });
      return;
    }

    sendSingleEmail.mutate(
      { userId: selectedUserId, subject: singleSubject.trim(), message: singleMessage.trim() },
      {
        onSuccess: () => {
          toast({
            title: "Email Sent",
            description: `Email sent successfully to the selected user.`,
          });
          setSingleSubject("");
          setSingleMessage("");
          setSelectedUserId("");
        },
        onError: (err: any) => {
          toast({
            title: "Failed to send",
            description: err?.data?.message || err?.message || "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSendBulkEmail = () => {
    if (!bulkSubject.trim() || !bulkMessage.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in subject and message.",
        variant: "destructive",
      });
      return;
    }

    if (!sendToAll && selectedUserIds.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select users or choose to send to all users.",
        variant: "destructive",
      });
      return;
    }

    const userIds = sendToAll ? undefined : selectedUserIds;

    sendBulkEmail.mutate(
      { subject: bulkSubject.trim(), message: bulkMessage.trim(), userIds },
      {
        onSuccess: (result: { sent: number; failed: number; total: number }) => {
          toast({
            title: "Bulk Email Complete",
            description: `Sent to ${result.sent} recipients. ${result.failed > 0 ? `${result.failed} failed.` : ""}`,
          });
          setBulkSubject("");
          setBulkMessage("");
          setSelectedUserIds([]);
          setSendToAll(true);
        },
        onError: (err: any) => {
          toast({
            title: "Failed to send",
            description: err?.data?.message || err?.message || "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSendTestEmail = () => {
    sendTestEmail.mutate(
      testEmailTo.trim() ? { to: testEmailTo.trim() } : {},
      {
        onSuccess: (res: { sent: number; to: string; id?: string }) => {
          toast({
            title: "Test email sent ✓",
            description: `Delivered to ${res.to}${res.id ? ` (id: ${res.id.slice(0, 8)}…)` : ""}.`,
          });
          setTestEmailTo("");
        },
        onError: (err: any) => {
          toast({
            title: "Test email failed",
            description: err?.data?.message || err?.message || "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const selectedUser = users?.find(u => u.id === selectedUserId);

  if (usersLoading) {
    return <AppLayout><LoadingSpinner /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 text-white">Email Center</h1>
          <p className="text-muted-foreground">Send single or bulk emails to platform users.</p>
        </div>

        {/* Email service test */}
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-emerald-400" />
              Email Service Test
            </CardTitle>
            <CardDescription>Verify the Resend integration is working before sending to members.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-2">
                <Label className="text-white text-sm">Recipient email (optional — defaults to your admin email)</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
              <Button
                onClick={handleSendTestEmail}
                disabled={sendTestEmail.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {sendTestEmail.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send Test Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Compose Email
                </CardTitle>
                <CardDescription>Choose between single recipient or bulk messaging</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20">
                    <TabsTrigger value="single" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Mail className="h-4 w-4 mr-2" />
                      Single Email
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Users className="h-4 w-4 mr-2" />
                      Bulk Email
                    </TabsTrigger>
                  </TabsList>

                  {/* Single Email Tab */}
                  <TabsContent value="single" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-white">Select Recipient</Label>
                      <div className="relative">
                        <Input
                          placeholder="Search users by name or email..."
                          value={singleSearch}
                          onChange={e => setSingleSearch(e.target.value)}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                      {selectedUser && (
                        <div className="mt-2 p-3 rounded-md bg-primary/10 border border-primary/30">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-white font-medium">
                              {selectedUser.firstName} {selectedUser.lastName}
                            </span>
                            <span className="text-muted-foreground text-sm">({selectedUser.email})</span>
                          </div>
                        </div>
                      )}
                      {singleSearch && !selectedUserId && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-white/10 bg-card">
                          {filteredUsers.slice(0, 10).map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectUser(user.id)}
                              className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <div className="text-white text-sm">{user.firstName} {user.lastName}</div>
                                <div className="text-muted-foreground text-xs">{user.email}</div>
                              </div>
                            </button>
                          ))}
                          {filteredUsers.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Subject</Label>
                      <Input
                        placeholder="Enter email subject..."
                        value={singleSubject}
                        onChange={e => setSingleSubject(e.target.value)}
                        className="bg-black/20 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Message</Label>
                      <Textarea
                        placeholder="Enter your message..."
                        value={singleMessage}
                        onChange={e => setSingleMessage(e.target.value)}
                        className="min-h-[150px] bg-black/20 border-white/10 text-white resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSendSingleEmail}
                      disabled={sendSingleEmail.isPending || !selectedUserId}
                      className="w-full bg-primary hover:bg-primary/90 text-white signal-glow"
                    >
                      {sendSingleEmail.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  {/* Bulk Email Tab */}
                  <TabsContent value="bulk" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Recipients</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAllBulk}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {sendToAll ? "Select specific users" : "Select all filtered users"}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sendToAll 
                          ? `Email will be sent to all ${users?.length || 0} users` 
                          : `Email will be sent to ${selectedUserIds.length} selected user(s)`}
                      </p>
                    </div>

                    {!sendToAll && (
                      <>
                        <div className="relative">
                          <Input
                            placeholder="Search users to add..."
                            value={bulkSearch}
                            onChange={e => setBulkSearch(e.target.value)}
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto rounded-md border border-white/10 bg-card">
                          {bulkFilteredUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleToggleBulkUser(user.id)}
                              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                            >
                              <div className={cn(
                                "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                selectedUserIds.includes(user.id)
                                  ? "bg-primary border-primary"
                                  : "border-white/30"
                              )}>
                                {selectedUserIds.includes(user.id) && (
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="text-white text-sm">{user.firstName} {user.lastName}</div>
                                <div className="text-muted-foreground text-xs">{user.email}</div>
                              </div>
                            </button>
                          ))}
                          {bulkFilteredUsers.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label className="text-white">Subject</Label>
                      <Input
                        placeholder="Enter email subject..."
                        value={bulkSubject}
                        onChange={e => setBulkSubject(e.target.value)}
                        className="bg-black/20 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Message</Label>
                      <Textarea
                        placeholder="Enter your message..."
                        value={bulkMessage}
                        onChange={e => setBulkMessage(e.target.value)}
                        className="min-h-[150px] bg-black/20 border-white/10 text-white resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSendBulkEmail}
                      disabled={sendBulkEmail.isPending || (!sendToAll && selectedUserIds.length === 0)}
                      className="w-full bg-primary hover:bg-primary/90 text-white signal-glow"
                    >
                      {sendBulkEmail.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending to {sendToAll ? "all users" : `${selectedUserIds.length} recipients`}...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Bulk Email
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with user count info */}
          <div className="space-y-6">
            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-black/20">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-white text-sm">Total Users</span>
                  </div>
                  <span className="text-white font-mono font-semibold">{users?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-black/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-white text-sm">Active Users</span>
                  </div>
                  <span className="text-white font-mono font-semibold">
                    {users?.filter(u => u.status === "active").length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-black/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-white text-sm">Pending Users</span>
                  </div>
                  <span className="text-white font-mono font-semibold">
                    {users?.filter(u => u.status === "pending").length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Use single email for personalized messages to specific users.</p>
                <p>• Use bulk email to reach multiple users at once.</p>
                <p>• Toggle "Select all filtered users" to choose specific recipients.</p>
                <p>• Leave recipients empty in bulk to send to all users.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
