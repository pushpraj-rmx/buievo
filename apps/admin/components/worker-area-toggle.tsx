import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useTaskStore } from "@/lib/task-store";

interface WorkerAreaToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function WorkerAreaToggle({ isOpen, onToggle }: WorkerAreaToggleProps) {
  const { getActiveTasks } = useTaskStore();
  const activeTasks = getActiveTasks();
  const activeCount = activeTasks.length;

  return (
    <Button
      variant={isOpen ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className="relative"
    >
      <Activity className="h-4 w-4 mr-2" />
      Worker Area
      {activeCount > 0 && (
        <Badge 
          variant="secondary" 
          className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
        >
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}


