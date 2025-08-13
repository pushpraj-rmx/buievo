"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type TemplateRow = {
  name: string;
  status?: string;
};

export default function TemplatesPage() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  type TemplateDb = { name: string; status: string; content?: unknown };
  const [selected, setSelected] = useState<TemplateDb | null>(null);
  // track loaded count if needed later for UI

  async function createHelloWorld() {
    setCreating(true);
    try {
      const body = {
        name: name || "hello_world",
        language,
        category: "UTILITY",
        components: [
          { type: "BODY", text: "Hello {{1}}" },
          { type: "FOOTER", text: "Powered by Whatssuite" },
        ],
      };
      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setRows((r) => [{ name: body.name, status: "PENDING" }, ...r]);
        toast.success("Template submitted for approval");
      } else {
        toast.error(json.message || "Failed to create template");
      }
    } finally {
      setCreating(false);
    }
  }

  async function refresh(name: string) {
    const res = await fetch(`/api/v1/templates/${encodeURIComponent(name)}/status`);
    const json = await res.json();
    setRows((r) => r.map((t) => (t.name === name ? { ...t, status: json.status } : t)));
  }

  async function fetchList() {
    setListLoading(true);
    const res = await fetch("/api/v1/templates/db");
    if (!res.ok) return;
    const json: Array<{ name: string; status: string }>= await res.json();
    setRows(json.map((x) => ({ name: x.name, status: x.status })));
    setListLoading(false);
  }

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="hello_world" />
            </div>
            <div>
              <Label>Language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en_US" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={createHelloWorld} disabled={creating}>
                {creating ? "Creating..." : "Create sample template"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No templates yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const res = await fetch(`/api/v1/templates/${encodeURIComponent(r.name)}/db`);
                              if (res.ok) {
                                const json = await res.json();
                                setSelected(json);
                              } else {
                                toast.error("Failed to load details");
                              }
                            }}
                          >
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Template: {r.name}</DialogTitle>
                          </DialogHeader>
                          <pre className="max-h-[60vh] overflow-auto text-xs bg-muted rounded p-3">
{selected ? JSON.stringify(selected, null, 2) : "Loading..."}
                          </pre>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" onClick={() => refresh(r.name)}>
                        Refresh
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const res = await fetch(`/api/v1/templates/${encodeURIComponent(r.name)}`, { method: "DELETE" });
                          if (res.ok) {
                            toast.success("Template deleted");
                            setRows((prev) => prev.filter((x) => x.name !== r.name));
                          } else {
                            const j = await res.json().catch(() => ({}));
                            toast.error(j.message || "Delete failed");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {rows.length > 0 && (
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={async () => {
              const res = await fetch(`/api/v1/templates/db?take=50&skip=${rows.length}`);
              if (!res.ok) return;
              const json: Array<{ name: string; status: string }>= await res.json();
              if (json.length === 0) {
                toast.message("No more records");
                return;
              }
              setRows((prev) => [...prev, ...json.map((x) => ({ name: x.name, status: x.status }))]);
            }}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
