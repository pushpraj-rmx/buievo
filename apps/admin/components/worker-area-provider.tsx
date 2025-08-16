"use client";

import { useState, useEffect } from "react";
import { WorkerArea } from "./worker-area";
import { SiteHeader } from "./site-header";

interface WorkerAreaProviderProps {
  children: React.ReactNode;
}

export function WorkerAreaProvider({ children }: WorkerAreaProviderProps) {
  const [workerAreaOpen, setWorkerAreaOpen] = useState(false);

  useEffect(() => {
    const handleAutoOpen = () => {
      setWorkerAreaOpen(true);
    };

    window.addEventListener("openWorkerArea", handleAutoOpen);

    return () => {
      window.removeEventListener("openWorkerArea", handleAutoOpen);
    };
  }, []);

  // Handle body scroll locking on mobile when drawer is open
  useEffect(() => {
    if (workerAreaOpen) {
      // Store original body styles
      const originalStyle = window.getComputedStyle(document.body);
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Only lock scroll on mobile (when drawer overlays content)
      if (window.innerWidth < 768) {
        // md breakpoint
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollBarWidth}px`;

        return () => {
          document.body.style.overflow = originalStyle.overflow;
          document.body.style.paddingRight = originalStyle.paddingRight;
        };
      }
    }
  }, [workerAreaOpen]);

  return (
    <>
      <SiteHeader
        workerAreaOpen={workerAreaOpen}
        onWorkerAreaToggle={() => setWorkerAreaOpen(!workerAreaOpen)}
      />
      {children}
      <WorkerArea
        isOpen={workerAreaOpen}
        onClose={() => setWorkerAreaOpen(false)}
      />
    </>
  );
}
