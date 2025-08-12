import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const chats = [
  {
    id: "1",
    name: "Alice Johnson",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Hey! How are you?",
    timestamp: "2:30 PM",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "2",
    name: "Bob Smith",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Let's catch up tomorrow.",
    timestamp: "1:45 PM",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "3",
    name: "Charlie Brown",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Sent the files.",
    timestamp: "12:20 PM",
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: "4",
    name: "Diana Prince",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "Thanks for the help!",
    timestamp: "11:15 AM",
    unreadCount: 0,
    isOnline: false,
  },
];

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left: chats list */}
        <ResizablePanel
          defaultSize={30}
          minSize={25}
          maxSize={40}
          className="border-r bg-muted/30"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b bg-background">
              <h1 className="text-xl font-semibold">Chats</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {chats.length}
                </Badge>
              </div>
            </div>

            {/* Chat list */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {chats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/whatsapp/chats/${chat.id}/messages/`}
                  >
                    <Card className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-0 shadow-none">
                      <div className="relative">
                        <Avatar className="size-12">
                          <AvatarImage src={chat.avatar} />
                          <AvatarFallback className="text-sm font-medium">
                            {chat.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {chat.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">
                            {chat.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {chat.timestamp}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground truncate max-w-[10rem]">
                            {chat.lastMessage}
                          </div>
                          {chat.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="size-5 p-0 text-xs flex items-center justify-center"
                            >
                              {chat.unreadCount}
                            </Badge>
                          )}
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
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="h-full flex flex-col bg-background">{children}</div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: info panel */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={35}
          className="border-l bg-muted/30 hidden lg:block"
        >
          <div className="h-full">
            <div className="h-16 flex items-center px-4 border-b bg-background">
              <h2 className="text-lg font-semibold">Contact Info</h2>
            </div>
            <ScrollArea className="h-[calc(100%-64px)]">
              <div className="p-4 text-sm text-muted-foreground">
                <div className="text-center py-8">
                  <div className="text-lg font-medium text-foreground mb-2">
                    Select a chat
                  </div>
                  <div className="text-sm">
                    Choose a conversation from the left to see contact details
                    here.
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
