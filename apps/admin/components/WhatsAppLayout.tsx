import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface WhatsAppLayoutProps {
  contacts: React.ReactNode;
  chat: React.ReactNode;
  info: React.ReactNode;
}

const WhatsAppLayout: React.FC<WhatsAppLayoutProps> = ({
  contacts,
  chat,
  info,
}) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full h-full rounded-lg border min-w-[900px] min-h-[500px]"
    >
      <ResizablePanel defaultSize={20} minSize={10} maxSize={30}>
        {contacts}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={55} minSize={40} maxSize={70}>
        {chat}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
        {info}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default WhatsAppLayout;
