import { useCallback } from "react";
import { useTaskStore } from "@/lib/task-store";
import { validateFile, type MediaType } from "@/lib/utils";

interface UploadOptions {
  file: File;
  type: MediaType;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useUpload() {
  const { addTask, updateTask, removeTask } = useTaskStore();

  const uploadFile = useCallback(
    async ({ file, type, onSuccess, onError }: UploadOptions) => {
      // Validate file first
      const validation = validateFile(file, type);
      if (!validation.valid) {
        const errorMessage = validation.errors.join(", ");
        onError?.(errorMessage);
        return;
      }

      // Generate unique task ID
      const taskId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create abort controller
      const abortController = new AbortController();

      // Add task to store
      addTask({
        id: taskId,
        name: `Uploading ${file.name}`,
        status: "pending",
        progress: 0,
        abortController,
      });

      try {
        // Start upload
        updateTask(taskId, { status: "running" });

        const form = new FormData();
        form.append("file", file);

        const xhr = new XMLHttpRequest();
        let lastLoaded = 0;
        let lastTime = Date.now();

        // Progress tracking
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);

            // Calculate upload speed
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000;
            let speed = "";
            let eta = "";

            if (timeDiff > 0) {
              const loadedDiff = e.loaded - lastLoaded;
              const speedKBps = loadedDiff / 1024 / timeDiff;
              speed = `${speedKBps.toFixed(1)} KB/s`;

              // Calculate time remaining
              const remainingBytes = e.total - e.loaded;
              const timeRemainingSeconds =
                remainingBytes / (loadedDiff / timeDiff);

              if (timeRemainingSeconds > 0 && timeRemainingSeconds < 3600) {
                const minutes = Math.floor(timeRemainingSeconds / 60);
                const seconds = Math.floor(timeRemainingSeconds % 60);
                eta = `${minutes}m ${seconds}s`;
              } else if (timeRemainingSeconds >= 3600) {
                const hours = Math.floor(timeRemainingSeconds / 3600);
                const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
                eta = `${hours}h ${minutes}m`;
              } else {
                eta = "Calculating...";
              }

              lastLoaded = e.loaded;
              lastTime = currentTime;
            }

            updateTask(taskId, { progress, speed, eta });
          }
        });

        // Upload completion
        xhr.addEventListener("load", () => {
          if (xhr.status === 201) {
            try {
              const result = JSON.parse(xhr.responseText);
              updateTask(taskId, { status: "completed", progress: 100 });
              onSuccess?.(result);

              // Remove task after a delay
              setTimeout(() => removeTask(taskId), 3000);
            } catch (parseError) {
              updateTask(taskId, {
                status: "failed",
                error: "Failed to parse response",
              });
              onError?.("Failed to parse response");
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              const errorMessage =
                errorResponse.message || `Upload failed: ${xhr.status}`;
              updateTask(taskId, { status: "failed", error: errorMessage });
              onError?.(errorMessage);
            } catch {
              const errorMessage = `Upload failed: ${xhr.status}`;
              updateTask(taskId, { status: "failed", error: errorMessage });
              onError?.(errorMessage);
            }
          }
        });

        // Error handling
        xhr.addEventListener("error", () => {
          const errorMessage = "Network error during upload";
          updateTask(taskId, { status: "failed", error: errorMessage });
          onError?.(errorMessage);
        });

        // Abort handling
        xhr.addEventListener("abort", () => {
          updateTask(taskId, { status: "cancelled" });
          onError?.("Upload cancelled");
        });

        // Start upload
        xhr.open("POST", `/api/v1/media?type=${encodeURIComponent(type)}`);
        xhr.send(form);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        updateTask(taskId, { status: "failed", error: errorMessage });
        onError?.(errorMessage);
      }
    },
    [addTask, updateTask, removeTask],
  );

  return { uploadFile };
}
