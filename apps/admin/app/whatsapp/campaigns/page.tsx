"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Users,
  MessageSquare,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  clickedCount: number;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    status: string;
  };
  targetSegments: Array<{
    id: string;
    name: string;
    _count: {
      contacts: number;
    };
  }>;
  _count: {
    targetSegments: number;
  };
}

interface Template {
  id: string;
  name: string;
  status: string;
  content: Record<string, unknown>;
}

interface Segment {
  id: string;
  name: string;
  _count: {
    contacts: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CampaignStats {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  totalClicked: number;
  statusBreakdown: Record<string, number>;
}

export default function WhatsAppCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);
  const [viewingAnalytics, setViewingAnalytics] = useState<{
    totalTargetContacts: number;
    deliveryRate: number;
    readRate: number;
    clickRate: number;
    campaign: {
      sentCount: number;
      deliveredCount: number;
      failedCount: number;
      readCount: number;
    };
  } | null>(null);

  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState("");
  const [startLoading, setStartLoading] = useState("");
  const [pauseLoading, setPauseLoading] = useState("");
  const [resumeLoading, setResumeLoading] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Form data
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    templateId: "",
    segmentIds: [] as string[],
    scheduledAt: "",
    status: "draft",
  });

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/v1/campaigns?${params}`);
      if (!response.ok) throw new Error("Failed to fetch campaigns");

      const data = await response.json();
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to fetch campaigns");
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      toast.error("Failed to fetch templates");
      console.error("Error fetching templates:", error);
    }
  }, []);

  // Fetch segments
  const fetchSegments = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/contacts/segments");
      if (!response.ok) throw new Error("Failed to fetch segments");

      const data = await response.json();
      setSegments(data);
    } catch (error) {
      toast.error("Failed to fetch segments");
      console.error("Error fetching segments:", error);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/campaigns/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error("Failed to fetch campaign stats");
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchSegments();
    fetchStats();
  }, [fetchCampaigns, fetchTemplates, fetchSegments, fetchStats]);

  // Create campaign
  const handleCreateCampaign = async () => {
    try {
      setCreateLoading(true);
      const response = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create campaign");
      }

      toast.success("Campaign created successfully");
      setCampaignDialogOpen(false);
      resetCampaignForm();
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Update campaign
  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;

    try {
      setUpdateLoading(true);
      const response = await fetch(`/api/v1/campaigns/${editingCampaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update campaign");
      }

      toast.success("Campaign updated successfully");
      setCampaignDialogOpen(false);
      setEditingCampaign(null);
      resetCampaignForm();
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update campaign",
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/v1/campaigns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete campaign");

      toast.success("Campaign deleted successfully");
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete campaign");
      console.error("Error deleting campaign:", error);
    } finally {
      setDeleteLoading("");
    }
  };

  // Start campaign
  const handleStartCampaign = async (id: string) => {
    try {
      setStartLoading(id);
      const response = await fetch(`/api/v1/campaigns/${id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start campaign");
      }

      const result = await response.json();
      toast.success(
        `Campaign started successfully! Targeting ${result.totalContacts} contacts.`,
      );
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start campaign",
      );
    } finally {
      setStartLoading("");
    }
  };

  // Pause campaign
  const handlePauseCampaign = async (id: string) => {
    try {
      setPauseLoading(id);
      const response = await fetch(`/api/v1/campaigns/${id}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to pause campaign");
      }

      toast.success("Campaign paused successfully");
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to pause campaign",
      );
    } finally {
      setPauseLoading("");
    }
  };

  // Resume campaign
  const handleResumeCampaign = async (id: string) => {
    try {
      setResumeLoading(id);
      const response = await fetch(`/api/v1/campaigns/${id}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resume campaign");
      }

      toast.success("Campaign resumed successfully");
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resume campaign",
      );
    } finally {
      setResumeLoading("");
    }
  };

  // Get campaign analytics
  const handleGetAnalytics = async (id: string) => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`/api/v1/campaigns/${id}/analytics`);
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setViewingAnalytics(data);
      setAnalyticsDialogOpen(true);
    } catch (error) {
      toast.error("Failed to fetch campaign analytics");
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Reset forms
  const resetCampaignForm = () => {
    setCampaignForm({
      name: "",
      templateId: "",
      segmentIds: [],
      scheduledAt: "",
      status: "draft",
    });
  };

  // Open edit dialog
  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      templateId: campaign.template.id,
      segmentIds: campaign.targetSegments.map((s) => s.id),
      scheduledAt: campaign.scheduledAt || "",
      status: campaign.status,
    });
    setCampaignDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (campaign: Campaign) => {
    setViewingCampaign(campaign);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sending":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "sending":
        return <TrendingUp className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const approvedTemplates = templates.filter(
    (template) => template.status === "APPROVED",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage WhatsApp marketing campaigns
          </p>
        </div>
        <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={campaignForm.name}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, name: e.target.value })
                  }
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="template">Template *</Label>
                <Select
                  value={campaignForm.templateId}
                  onValueChange={(value) =>
                    setCampaignForm({ ...campaignForm, templateId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Segments</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {segments.map((segment) => (
                    <label
                      key={segment.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={campaignForm.segmentIds.includes(segment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCampaignForm({
                              ...campaignForm,
                              segmentIds: [
                                ...campaignForm.segmentIds,
                                segment.id,
                              ],
                            });
                          } else {
                            setCampaignForm({
                              ...campaignForm,
                              segmentIds: campaignForm.segmentIds.filter(
                                (id) => id !== segment.id,
                              ),
                            });
                          }
                        }}
                      />
                      <span>
                        {segment.name} ({segment._count.contacts} contacts)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={campaignForm.scheduledAt}
                  onChange={(e) =>
                    setCampaignForm({
                      ...campaignForm,
                      scheduledAt: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={campaignForm.status}
                  onValueChange={(value) =>
                    setCampaignForm({ ...campaignForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCampaignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingCampaign ? handleUpdateCampaign : handleCreateCampaign
                }
                disabled={createLoading || updateLoading}
              >
                {(createLoading || updateLoading) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCampaign ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Campaigns
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDelivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRead}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Campaigns ({pagination.total})
          </CardTitle>
          <CardDescription>
            Showing {campaigns.length} of {pagination.total} campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const totalTarget = campaign.targetSegments.reduce(
                      (sum, segment) => sum + segment._count.contacts,
                      0,
                    );
                    const progress =
                      totalTarget > 0
                        ? (campaign.sentCount / totalTarget) * 100
                        : 0;

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>{campaign.template.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(campaign.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(campaign.status)}
                              {campaign.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {totalTarget} contacts
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{campaign.sentCount} sent</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDialog(campaign)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGetAnalytics(campaign.id)}
                              disabled={analyticsLoading}
                            >
                              {analyticsLoading && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            {campaign.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(campaign)}
                                disabled={updateLoading}
                              >
                                {updateLoading && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {(campaign.status === "draft" ||
                              campaign.status === "scheduled") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartCampaign(campaign.id)}
                                disabled={startLoading === campaign.id}
                              >
                                {startLoading === campaign.id && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {campaign.status === "sending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePauseCampaign(campaign.id)}
                                disabled={pauseLoading === campaign.id}
                              >
                                {pauseLoading === campaign.id && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                            {campaign.status === "paused" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleResumeCampaign(campaign.id)
                                }
                                disabled={resumeLoading === campaign.id}
                              >
                                {resumeLoading === campaign.id && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {(campaign.status === "draft" ||
                              campaign.status === "scheduled" ||
                              campaign.status === "completed" ||
                              campaign.status === "failed") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteCampaign(campaign.id)
                                }
                                disabled={deleteLoading === campaign.id}
                              >
                                {deleteLoading === campaign.id && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page - 1,
                        })
                      }
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page + 1,
                        })
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Campaign Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {viewingCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <p>{viewingCampaign.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={getStatusColor(viewingCampaign.status)}>
                    {viewingCampaign.status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Template</Label>
                  <p>{viewingCampaign.template.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Created</Label>
                  <p>{new Date(viewingCampaign.createdAt).toLocaleString()}</p>
                </div>
                {viewingCampaign.scheduledAt && (
                  <div>
                    <Label className="font-medium">Scheduled For</Label>
                    <p>
                      {new Date(viewingCampaign.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="font-medium">Target Segments</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingCampaign.targetSegments.map((segment) => (
                      <Badge key={segment.id} variant="outline">
                        {segment.name} ({segment._count.contacts})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <Label className="font-medium">Statistics</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="font-medium">{viewingCampaign.sentCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="font-medium">
                      {viewingCampaign.deliveredCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Read</p>
                    <p className="font-medium">{viewingCampaign.readCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clicked</p>
                    <p className="font-medium">
                      {viewingCampaign.clickedCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
          </DialogHeader>
          {viewingAnalytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Target</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingAnalytics.totalTargetContacts}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Delivery Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingAnalytics.deliveryRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Read Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingAnalytics.readRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Click Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingAnalytics.clickRate}%
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Detailed Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Sent Messages</Label>
                    <p className="text-2xl font-bold">
                      {viewingAnalytics.campaign.sentCount}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Delivered Messages</Label>
                    <p className="text-2xl font-bold">
                      {viewingAnalytics.campaign.deliveredCount}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Failed Messages</Label>
                    <p className="text-2xl font-bold text-red-600">
                      {viewingAnalytics.campaign.failedCount}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Read Messages</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {viewingAnalytics.campaign.readCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAnalyticsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
