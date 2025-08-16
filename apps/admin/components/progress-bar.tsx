import { Button } from "@/components/ui/button";
import { Task } from "@/lib/task-store";

interface ProgressBarProps {
  task: Task;
  onCancel?: () => void;
  showCancelButton?: boolean;
  className?: string;
}

export function ProgressBar({
  task,
  onCancel,
  showCancelButton = true,
  className = "",
}: ProgressBarProps) {
  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-primary";
    }
  };

  const getStatusText = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return "Preparing...";
      case "running":
        return "Uploading...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  return (
    <div
      className={`w-full space-y-3 p-4 bg-muted rounded-lg border ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium truncate">{task.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-primary font-semibold">{task.progress}%</span>
          <span className="text-muted-foreground text-xs">
            {getStatusText(task.status)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-background rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-300 ease-out ${getStatusColor(task.status)}`}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* Upload Stats */}
      {(task.speed || task.eta) && (
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          {task.speed && (
            <div className="flex items-center gap-2">
              <span>Speed:</span>
              <span className="font-mono">{task.speed}</span>
            </div>
          )}
          {task.eta && (
            <div className="flex items-center gap-2">
              <span>ETA:</span>
              <span className="font-mono">{task.eta}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {task.error && (
        <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
          {task.error}
        </div>
      )}

      {/* Cancel Button */}
      {showCancelButton && onCancel && task.status === "running" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="w-full"
        >
          Cancel Upload
        </Button>
      )}
    </div>
  );
}
