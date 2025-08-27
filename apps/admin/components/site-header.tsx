import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/logo";
import { WorkerAreaToggle } from "./worker-area-toggle";
import { ThemeToggle } from "./theme-toggle";

interface SiteHeaderProps {
  workerAreaOpen: boolean;
  onWorkerAreaToggle: () => void;
}

export function SiteHeader({
  workerAreaOpen,
  onWorkerAreaToggle,
}: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Logo size={20} className="mr-2" />
        <h1 className="text-base font-medium">Whatssuite Admin</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <WorkerAreaToggle
            isOpen={workerAreaOpen}
            onToggle={onWorkerAreaToggle}
          />
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
