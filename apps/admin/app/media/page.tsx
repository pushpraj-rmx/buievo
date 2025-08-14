"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type MediaRow = {
  id: string;
  waMediaId: string;
  type: string;
  mimeType: string;
  fileName?: string;
  size?: number;
  url?: string;
  createdAt: string;
};

export default function MediaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("document");
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  type MediaDetail = { db?: unknown; remote?: unknown };
  const [selected, setSelected] = useState<MediaDetail | null>(null);

  async function fetchList() {
    setListLoading(true);
    const res = await fetch("/api/v1/media?take=50");
    if (!res.ok) return;
    const json: Array<{
      id: string;
      waMediaId: string;
      type: string;
      mimeType: string;
      fileName?: string | null;
      size?: number | null;
      url?: string | null;
      createdAt: string;
    }> = await res.json();
    const mapped: MediaRow[] = json.map((x) => ({
      id: x.id,
      waMediaId: x.waMediaId,
      type: x.type,
      mimeType: x.mimeType,
      fileName: x.fileName ?? undefined,
      size: x.size ?? undefined,
      url: x.url ?? undefined,
      createdAt: x.createdAt,
    }));
    setRows(mapped);
    setListLoading(false);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/v1/media?type=${encodeURIComponent(type)}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (res.ok) {
        setRows((r) => [
          {
            id: json.recordId ?? json.id,
            waMediaId: json.id,
            type,
            mimeType: file.type,
            fileName: file.name,
            size: file.size,
            createdAt: new Date().toISOString(),
          },
          ...r,
        ]);
        setFile(null);
        toast.success("Uploaded successfully");
      } else {
        toast.error(json.message || "Upload failed");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Type</Label>
              <select
                className="border rounded h-10 px-3 w-full bg-background"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="image">image</option>
                <option value="video">video</option>
                <option value="audio">audio</option>
                <option value="document">document</option>
              </select>
            </div>
            <div>
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Button disabled={!file || loading} onClick={handleUpload}>
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No uploads yet.</div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DB Id</TableHead>
                <TableHead>WA Media Id</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mime</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell className="font-mono text-xs">{r.waMediaId}</TableCell>
                  <TableCell>{r.fileName}</TableCell>
                  <TableCell>{r.mimeType}</TableCell>
                  <TableCell>{r.size}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>
                    {r.mimeType?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/v1/media/${encodeURIComponent(r.id)}/file`}
                        alt={r.fileName || r.waMediaId}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <a
                        href={`/api/v1/media/${encodeURIComponent(r.id)}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-500"
                      >
                        Open
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          onClick={async () => {
                            const res = await fetch(`/api/v1/media/${r.id}`);
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
                          <DialogTitle>Media: {r.fileName || r.waMediaId}</DialogTitle>
                        </DialogHeader>
                        <pre className="max-h-[60vh] overflow-auto text-xs bg-muted rounded p-3">
{selected ? JSON.stringify(selected, null, 2) : "Loading..."}
                        </pre>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mr-2"
                      onClick={async () => {
                        const res = await fetch(`/api/v1/media/${r.id}`);
                        if (res.ok) {
                          const json = (await res.json()) as { remote?: { url?: string; sha256?: string } };
                          const remoteUrl = json?.remote?.url;
                          if (remoteUrl) {
                            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, url: remoteUrl } : x)));
                            toast.success("Info refreshed");
                          } else {
                            toast.message("No URL available yet");
                          }
                        } else {
                          toast.error("Failed to refresh info");
                        }
                      }}
                    >
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        const res = await fetch(`/api/v1/media/${r.id}`, { method: "DELETE" });
                        if (res.ok) {
                          toast.success("Deleted");
                          setRows((prev) => prev.filter((x) => x.id !== r.id));
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
              const res = await fetch(`/api/v1/media?take=50&skip=${rows.length}`);
              if (!res.ok) return;
              const json: Array<{
                id: string;
                waMediaId: string;
                type: string;
                mimeType: string;
                fileName?: string | null;
                size?: number | null;
                url?: string | null;
                createdAt: string;
              }>= await res.json();
              if (json.length === 0) {
                toast.message("No more records");
                return;
              }
              const mapped: MediaRow[] = json.map((x) => ({
                id: x.id,
                waMediaId: x.waMediaId,
                type: x.type,
                mimeType: x.mimeType,
                fileName: x.fileName ?? undefined,
                size: x.size ?? undefined,
                url: x.url ?? undefined,
                createdAt: x.createdAt,
              }));
              setRows((prev) => [...prev, ...mapped]);
            }}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
