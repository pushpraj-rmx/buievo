"use client";

import { useEffect, useState } from "react";
import { WorkerAreaDemo } from "@/components/worker-area-demo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Send, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalContacts: number;
  totalConversations: number;
  totalMessages: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesPending: number;
  messagesFailed: number;
  activeTemplates: number;
  mediaUploads: number;
}

interface RecentActivity {
  id: string;
  type: "message_sent" | "message_received" | "template_created" | "contact_added" | "media_uploaded";
  description: string;
  timestamp: string;
  status: "success" | "pending" | "failed";
}

interface Conversation {
  id: string;
  contactId: string;
  messageCount?: number;
  messages?: Message[];
  contact?: Contact;
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  status: string;
  timestamp: string;
}

interface Contact {
  id: string;
  name?: string;
  phone: string;
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalConversations: 0,
    totalMessages: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesPending: 0,
    messagesFailed: 0,
    activeTemplates: 0,
    mediaUploads: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch conversations to get stats
      const conversations = await fetch("/api/v1/conversations").then(res => res.json());
      
      // Fetch contacts
      const contacts = await fetch("/api/v1/contacts").then(res => res.json());
      
      // Calculate stats
      const totalMessages = conversations.reduce((acc: number, conv: Conversation) => acc + (conv.messageCount || 0), 0);
      const messagesSent = conversations.reduce((acc: number, conv: Conversation) => 
        acc + (conv.messages?.filter((m: Message) => m.direction === "outbound").length || 0), 0);
      const messagesDelivered = conversations.reduce((acc: number, conv: Conversation) => 
        acc + (conv.messages?.filter((m: Message) => m.status === "delivered").length || 0), 0);
      const messagesPending = conversations.reduce((acc: number, conv: Conversation) => 
        acc + (conv.messages?.filter((m: Message) => m.status === "sent").length || 0), 0);
      const messagesFailed = conversations.reduce((acc: number, conv: Conversation) => 
        acc + (conv.messages?.filter((m: Message) => m.status === "failed").length || 0), 0);

      setStats({
        totalContacts: contacts.length,
        totalConversations: conversations.length,
        totalMessages,
        messagesSent,
        messagesDelivered,
        messagesPending,
        messagesFailed,
        activeTemplates: 5, // Placeholder - we'll implement template management later
        mediaUploads: 12, // Placeholder - we'll implement media management later
      });

      // Generate recent activity from conversations
      const activity: RecentActivity[] = [];
      conversations.forEach((conv: Conversation) => {
        if (conv.messages && conv.messages.length > 0) {
          const lastMessage = conv.messages[conv.messages.length - 1];
          activity.push({
            id: lastMessage.id,
            type: lastMessage.direction === "outbound" ? "message_sent" : "message_received",
            description: `${lastMessage.direction === "outbound" ? "Sent" : "Received"} message to ${conv.contact?.name || conv.contact?.phone}`,
            timestamp: lastMessage.timestamp,
            status: lastMessage.status === "delivered" ? "success" : 
                   lastMessage.status === "sent" ? "pending" : "failed"
          });
        }
      });

      // Sort by timestamp and take last 10
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message_sent":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "message_received":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case "template_created":
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case "contact_added":
        return <Users className="h-4 w-4 text-orange-500" />;
      case "media_uploaded":
        return <CheckCircle className="h-4 w-4 text-indigo-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* WhatsApp Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Active WhatsApp contacts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Active chat conversations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSent}</div>
            <p className="text-xs text-muted-foreground">
              Outbound messages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.messagesSent > 0 ? Math.round((stats.messagesDelivered / stats.messagesSent) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Message Status</CardTitle>
            <CardDescription>Current message delivery status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Delivered</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {stats.messagesDelivered}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {stats.messagesPending}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Failed</span>
              <Badge variant="destructive">
                {stats.messagesFailed}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <CardDescription>Message template status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Active message templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Media</CardTitle>
            <CardDescription>Uploaded media files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaUploads}</div>
            <p className="text-xs text-muted-foreground">
              Total media uploads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest WhatsApp interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  {getTypeIcon(activity.type)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {getStatusIcon(activity.status)}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Worker Area Demo */}
      <WorkerAreaDemo />
    </div>
  );
}
