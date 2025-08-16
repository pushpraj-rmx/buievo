import { useTaskStore } from "@/lib/task-store";
import { ProgressBar } from "./progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TaskManager() {
  const { getActiveTasks, cancelTask, clearCompletedTasks } = useTaskStore();
  const activeTasks = getActiveTasks();

  if (activeTasks.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Active Uploads</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompletedTasks}
          >
            Clear Completed
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTasks.map((task) => (
          <ProgressBar
            key={task.id}
            task={task}
            onCancel={() => cancelTask(task.id)}
            showCancelButton={true}
          />
        ))}
      </CardContent>
    </Card>
  );
}
