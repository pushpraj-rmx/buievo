import { ReactNode } from "react";

export default function WhatsAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="mb-6 pt-6">
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp Business API templates and campaigns
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
