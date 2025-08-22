"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Eye, RefreshCw, Trash2, Copy } from "lucide-react";

type TemplateRow = {
  name: string;
  status?: string;
  category?: string;
};

type TemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: unknown;
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE";
    text?: string;
    url?: string;
    phone_number?: string;
  }>;
};

type TemplateContent = {
  category?: string;
  language?: string;
  components?: TemplateComponent[];
};

type TemplateDbData = {
  name: string;
  status: string;
  content?: TemplateContent;
};

export default function WhatsAppTemplatesPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<
    "MARKETING" | "UTILITY" | "AUTHENTICATION"
  >("UTILITY");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const [selected, setSelected] = useState<TemplateDbData | null>(null);

  // WhatsApp templates are always in English (en_US)
  const LANGUAGE = "en_US";

  async function createTemplate() {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!bodyText.trim()) {
      toast.error("Template body is required");
      return;
    }

    setCreating(true);
    try {
      const components: TemplateComponent[] = [];

      // Add header if provided
      if (headerText.trim()) {
        components.push({ type: "HEADER", format: "TEXT", text: headerText.trim() });
      }

      // Add body (required)
      components.push({ type: "BODY", text: bodyText.trim() });

      // Add footer if provided
      if (footerText.trim()) {
        components.push({ type: "FOOTER", text: footerText.trim() });
      }

      const body = {
        name: name.trim(),
        language: LANGUAGE,
        category,
        components,
      };

      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setRows((r) => [
          {
            name: body.name,
            status: "PENDING",
            category,
          },
          ...r,
        ]);
        toast.success("Template submitted for approval");

        // Clear form
        setName("");
        setHeaderText("");
        setBodyText("");
        setFooterText("");
      } else {
        toast.error(json.message || "Failed to create template");
      }
    } finally {
      setCreating(false);
    }
  }

  async function refresh(name: string) {
    setRefreshLoading(name);
    try {
      const res = await fetch(
        `/api/v1/templates/${encodeURIComponent(name)}/status`,
      );
      const json = await res.json();
      if (res.ok) {
        setRows((r) =>
          r.map((t) => (t.name === name ? { ...t, status: json.status } : t)),
        );
        toast.success("Template status updated");
      } else {
        toast.error("Failed to refresh template status");
      }
    } finally {
      setRefreshLoading(null);
    }
  }

  async function fetchList() {
    setListLoading(true);
    try {
      const res = await fetch("/api/v1/templates/db");
      if (!res.ok) return;
      const json: TemplateDbData[] = await res.json();
      setRows(
        json.map((x) => ({
          name: x.name,
          status: x.status,
          category: x.content?.category,
        })),
      );
    } finally {
      setListLoading(false);
    }
  }

  async function refreshFromWhatsApp() {
    setListLoading(true);
    try {
      const res = await fetch("/api/v1/templates");
      if (!res.ok) {
        toast.error("Failed to refresh from WhatsApp API");
        return;
      }
      toast.success("Templates refreshed from WhatsApp API");
      // Refetch from database after refresh
      await fetchList();
    } catch (error) {
      toast.error("Failed to refresh templates");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your WhatsApp message templates
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Template
          </CardTitle>
          <CardDescription>
            Create a new WhatsApp message template for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="welcome_message"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use lowercase with underscores (e.g., welcome_message)
              </p>
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={category}
                onValueChange={(
                  value: "MARKETING" | "UTILITY" | "AUTHENTICATION",
                ) => setCategory(value)}
              >
                <SelectTrigger id="template-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                  <SelectItem value="CAROUSEL">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template Components */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Template Components</h3>

            <div>
              <Label htmlFor="template-header">Header (Optional)</Label>
              <Input
                id="template-header"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Welcome to our service!"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Short header text (max 60 characters)
              </p>
            </div>

            <div>
              <Label htmlFor="template-body">Body *</Label>
              <Textarea
                id="template-body"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Hello {`{{1}}`}, welcome to our platform! We're excited to have you on board."
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Main message content. Use &#123;&#123;1&#125;&#125;,
                &#123;&#123;2&#125;&#125;, etc. for variables
              </p>
            </div>

            <div>
              <Label htmlFor="template-footer">Footer (Optional)</Label>
              <Input
                id="template-footer"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="Reply STOP to unsubscribe"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Footer text (max 60 characters)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={createTemplate}
              disabled={creating || !name.trim() || !bodyText.trim()}
              className="min-w-[200px]"
            >
              {creating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating Template...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Template Library ({rows.length})
              </CardTitle>
              <CardDescription>
                Manage your existing WhatsApp templates
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshFromWhatsApp}
              disabled={listLoading}
            >
              {listLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Refresh from WhatsApp</span>
            </Button>
          </div>
          {rows.length > 0 && (
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ {rows.filter(r => r.status === "APPROVED").length} Approved
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  ⏳ {rows.filter(r => r.status === "PENDING").length} Pending
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  ❌ {rows.filter(r => r.status === "REJECTED").length} Rejected
                </Badge>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first template to start sending structured messages
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-mono text-sm">
                      {r.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.category === "MARKETING" ? "default" : "secondary"
                        }
                      >
                        {r.category || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "APPROVED"
                            ? "default"
                            : r.status === "PENDING"
                              ? "secondary"
                              : r.status === "REJECTED"
                                ? "destructive"
                                : "outline"
                        }
                        className={
                          r.status === "APPROVED"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : r.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : r.status === "REJECTED"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : ""
                        }
                      >
                        {r.status === "APPROVED" && "✅ "}
                        {r.status === "PENDING" && "⏳ "}
                        {r.status === "REJECTED" && "❌ "}
                        {r.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={viewLoading === r.name}
                              onClick={async () => {
                                setViewLoading(r.name);
                                try {
                                  const res = await fetch(
                                    `/api/v1/templates/${encodeURIComponent(r.name)}/db`,
                                  );
                                  if (res.ok) {
                                    const json = await res.json();
                                    setSelected(json);
                                  } else {
                                    toast.error("Failed to load details");
                                  }
                                } finally {
                                  setViewLoading(null);
                                }
                              }}
                            >
                              {viewLoading === r.name ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="w-5 h-5" />
                              Template: {r.name}
                            </DialogTitle>
                          </DialogHeader>
                          {selected ? (
                            <div className="space-y-6">
                              <div className="bg-muted rounded-lg p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                  <Eye className="w-4 h-4" />
                                  Template Preview
                                </h4>
                                <div className="space-y-4">
                                  {selected.content?.components?.map(
                                    (comp: TemplateComponent, idx: number) => (
                                      <div
                                        key={idx}
                                        className="border-l-4 border-blue-500 pl-4 py-2"
                                      >
                                        <div className="font-medium text-blue-600 mb-1">
                                          {comp.type}
                                        </div>
                                        <div className="text-gray-700 bg-white rounded p-3">
                                          {comp.text || "No content"}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                              <div className="bg-muted rounded-lg p-4">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Copy className="w-4 h-4" />
                                  Template Data
                                </h4>
                                <div className="bg-white rounded border p-3">
                                  <pre className="text-xs overflow-auto max-h-[300px]">
                                    {JSON.stringify(selected, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center p-8">
                              <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelected(null)}>
                              Close
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={refreshLoading === r.name}
                          onClick={() => refresh(r.name)}
                        >
                          {refreshLoading === r.name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteLoading === r.name}
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete template "${r.name}"?`)) {
                              return;
                            }
                            setDeleteLoading(r.name);
                            try {
                              const res = await fetch(
                                `/api/v1/templates/${encodeURIComponent(r.name)}`,
                                { method: "DELETE" },
                              );
                              if (res.ok) {
                                toast.success("Template deleted");
                                setRows((prev) =>
                                  prev.filter((x) => x.name !== r.name),
                                );
                              } else {
                                const j = await res.json().catch(() => ({}));
                                toast.error(j.message || "Delete failed");
                              }
                            } finally {
                              setDeleteLoading(null);
                            }
                          }}
                        >
                          {deleteLoading === r.name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                                                 </Button>
                       </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {rows.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadMoreLoading}
            onClick={async () => {
              setLoadMoreLoading(true);
              try {
                const res = await fetch(
                  `/api/v1/templates/db?take=50&skip=${rows.length}`,
                );
                if (!res.ok) return;
                const json: TemplateDbData[] = await res.json();
                if (json.length === 0) {
                  toast.message("No more templates to load");
                  return;
                }
                setRows((prev) => [
                  ...prev,
                  ...json.map((x) => ({
                    name: x.name,
                    status: x.status,
                    category: x.content?.category,
                  })),
                ]);
              } finally {
                setLoadMoreLoading(false);
              }
            }}
          >
            {loadMoreLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Templates"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
