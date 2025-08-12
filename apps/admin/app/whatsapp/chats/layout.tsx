import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

const chats = [
  {
    id: "1",
    name: "Alice",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Hey! How are you?",
  },
  {
    id: "2",
    name: "Bob",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Let's catch up tomorrow.",
  },
  {
    id: "3",
    name: "Charlie",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Sent the files.",
  },
];

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left: chats list */}
        <ResizablePanel
          defaultSize={24}
          minSize={18}
          maxSize={40}
          className="border-r"
        >
          <div className="h-full flex flex-col">
            <div className="p-3 font-semibold">Chats</div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {chats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/whatsapp/chats/${chat.id}/messages/`}
                  >
                    <Card className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition">
                      <Avatar>
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[12rem]">
                          {chat.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-[12rem]">
                          {chat.lastMessage}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle: chat content */}
        <ResizablePanel defaultSize={52} minSize={35}>
          <div className="h-full flex flex-col">{children}</div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: info panel */}
        <ResizablePanel
          defaultSize={24}
          minSize={18}
          maxSize={40}
          className="border-l hidden lg:block"
        >
          <div className="h-full">
            <div className="p-3 font-semibold">Info</div>
            <ScrollArea className="h-[calc(100%-48px)]">
              <div className="p-3 text-sm text-muted-foreground">
                Select a chat to see details here.
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
