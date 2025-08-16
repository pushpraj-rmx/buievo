"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTaskStore } from "@/lib/task-store";
import { Upload, Mail, FileText, Activity } from "lucide-react";

export function WorkerAreaDemo() {
  const { addTask, updateTask } = useTaskStore();

  const createDemoTask = (type: "upload" | "campaign" | "export") => {
    const taskId = `demo-${type}-${Date.now()}`;
    const taskName =
      type === "upload"
        ? "Uploading demo files"
        : type === "campaign"
          ? "Sending campaign messages"
          : "Exporting data";

    addTask({
      id: taskId,
      name: taskName,
      status: "pending",
      progress: 0,
    });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        updateTask(taskId, { status: "completed", progress });
        clearInterval(interval);
      } else {
        updateTask(taskId, {
          status: "running",
          progress,
          speed: `${Math.round(Math.random() * 1000 + 500)} KB/s`,
          eta: `${Math.round(Math.random() * 30 + 10)}s`,
        });
      }
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Worker Area Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Click the buttons below to create demo background tasks. Open the
          Worker Area from the header to see them in action.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => createDemoTask("upload")}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Demo Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createDemoTask("campaign")}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Demo Campaign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createDemoTask("export")}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Demo Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

