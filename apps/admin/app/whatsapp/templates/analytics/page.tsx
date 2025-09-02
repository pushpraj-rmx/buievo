"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BarChart3, TrendingUp, Users, MessageSquare, Calendar } from "lucide-react";

type TemplateAnalytics = {
  name: string;
  status: string;
  category: string;
  usageCount: number;
  lastUsed?: string;
  approvalRate: number;
  averageResponseTime: number;
  totalMessages: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
};

export default function TemplateAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, category]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockData: TemplateAnalytics[] = [
        {
          name: "welcome_message",
          status: "APPROVED",
          category: "UTILITY",
          usageCount: 1250,
          lastUsed: "2024-01-15T10:30:00Z",
          approvalRate: 98.5,
          averageResponseTime: 2.3,
          totalMessages: 1250,
          deliveredCount: 1230,
          readCount: 980,
          failedCount: 20,
        },
        {
          name: "meeting_reminder",
          status: "APPROVED",
          category: "UTILITY",
          usageCount: 890,
          lastUsed: "2024-01-14T15:45:00Z",
          approvalRate: 99.2,
          averageResponseTime: 1.8,
          totalMessages: 890,
          deliveredCount: 885,
          readCount: 720,
          failedCount: 5,
        },
        {
          name: "referral_request",
          status: "PENDING",
          category: "MARKETING",
          usageCount: 0,
          approvalRate: 0,
          averageResponseTime: 0,
          totalMessages: 0,
          deliveredCount: 0,
          readCount: 0,
          failedCount: 0,
        },
        {
          name: "event_invitation",
          status: "APPROVED",
          category: "MARKETING",
          usageCount: 450,
          lastUsed: "2024-01-13T09:15:00Z",
          approvalRate: 95.8,
          averageResponseTime: 3.1,
          totalMessages: 450,
          deliveredCount: 430,
          readCount: 320,
          failedCount: 20,
        },
      ];

      setAnalytics(mockData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAnalytics = analytics.filter(item => 
    category === "all" || item.category === category
  );

  const totalUsage = filteredAnalytics.reduce((sum, item) => sum + item.usageCount, 0);
  const totalMessages = filteredAnalytics.reduce((sum, item) => sum + item.totalMessages, 0);
  const totalDelivered = filteredAnalytics.reduce((sum, item) => sum + item.deliveredCount, 0);
  const totalRead = filteredAnalytics.reduce((sum, item) => sum + item.readCount, 0);
  const averageApprovalRate = filteredAnalytics.length > 0 
    ? filteredAnalytics.reduce((sum, item) => sum + item.approvalRate, 0) / filteredAnalytics.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and usage of your WhatsApp templates
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Template instances used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total messages delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Messages read by recipients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageApprovalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average template approval rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Template Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Template Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredAnalytics.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No analytics data</h3>
              <p className="text-muted-foreground">
                Start using templates to see performance metrics
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnalytics.map((item) => (
                <div
                  key={item.name}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium font-mono">{item.name}</h3>
                      <Badge
                        variant={
                          item.status === "APPROVED"
                            ? "default"
                            : item.status === "PENDING"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          item.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : item.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {item.status}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.lastUsed && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.lastUsed).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{item.usageCount}</div>
                      <div className="text-gray-500">Usage Count</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.approvalRate}%</div>
                      <div className="text-gray-500">Approval Rate</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.totalMessages > 0 ? Math.round((item.readCount / item.totalMessages) * 100) : 0}%
                      </div>
                      <div className="text-gray-500">Read Rate</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.averageResponseTime}s</div>
                      <div className="text-gray-500">Avg Response</div>
                    </div>
                  </div>

                  {item.totalMessages > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Message Delivery:</span>
                        <span>
                          {item.deliveredCount} delivered, {item.readCount} read, {item.failedCount} failed
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        <div 
                          className="h-2 bg-green-500 rounded-l" 
                          style={{ width: `${(item.deliveredCount / item.totalMessages) * 100}%` }}
                        />
                        <div 
                          className="h-2 bg-blue-500" 
                          style={{ width: `${(item.readCount / item.totalMessages) * 100}%` }}
                        />
                        <div 
                          className="h-2 bg-red-500 rounded-r" 
                          style={{ width: `${(item.failedCount / item.totalMessages) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
