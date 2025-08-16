import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "./progress-bar";
import { useTaskStore } from "@/lib/task-store";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Activity,
  X,
  Upload,
  Mail,
  FileText,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Settings,
} from "lucide-react";

interface WorkerAreaProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkerArea({ isOpen, onClose }: WorkerAreaProps) {
  const {
    getActiveTasks,
    getTaskHistory,
    cancelTask,
    clearTaskHistory,
    autoOpenWorkerArea,
    setAutoOpenWorkerArea,
  } = useTaskStore();

  const activeTasks = getActiveTasks();
  const taskHistory = getTaskHistory();

  const getTaskIcon = (taskName: string) => {
    if (taskName.toLowerCase().includes("upload"))
      return <Upload className="h-4 w-4" />;
    if (taskName.toLowerCase().includes("campaign"))
      return <Mail className="h-4 w-4" />;
    if (taskName.toLowerCase().includes("export"))
      return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "running":
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay - only on mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-[90] md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-xl z-[100] flex flex-col animate-in slide-in-from-right duration-300"
        onWheel={(e) => {
          // Prevent scroll events from bubbling to the main content
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Prevent touch scroll events from bubbling to the main content
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Worker Area</h2>
            <Badge variant="secondary" className="ml-2">
              {activeTasks.length} active
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Active Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeTasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {getTaskIcon(task.name)}
                      <span className="font-medium truncate">{task.name}</span>
                      {getStatusIcon(task.status)}
                    </div>
                    <ProgressBar
                      task={task}
                      onCancel={() => cancelTask(task.id)}
                      showCancelButton={true}
                      className="text-xs"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Task History */}
          {taskHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-500" />
                    Task History
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTaskHistory}
                    className="h-6 px-2 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {taskHistory.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getTaskIcon(task.name)}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm truncate">{task.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.completedAt?.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      <span className="text-xs text-muted-foreground">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
                {taskHistory.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{taskHistory.length - 10} more in history
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Auto-open Worker Area</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically open when tasks start
                  </p>
                </div>
                <Switch
                  checked={autoOpenWorkerArea}
                  onCheckedChange={setAutoOpenWorkerArea}
                />
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {activeTasks.length === 0 && taskHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No background tasks running
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload files or start campaigns to see them here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            Background tasks continue running even when you navigate away
          </div>
        </div>
      </div>
    </>
  );
}
