import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MoreVertical, Phone, Video } from "lucide-react";

const messages = [
  {
    id: 1,
    user: { name: "Alice Johnson", avatar: "https://github.com/shadcn.png" },
    content: "Hey! How are you?",
    timestamp: "2:30 PM",
    isOwn: false,
  },
  {
    id: 2,
    user: { name: "Me", avatar: "https://github.com/shadcn.png" },
    content: "I'm good, thanks! How about you?",
    timestamp: "2:31 PM",
    isOwn: true,
  },
  {
    id: 3,
    user: { name: "Alice Johnson", avatar: "https://github.com/shadcn.png" },
    content: "Doing great! Just finished the project we discussed.",
    timestamp: "2:32 PM",
    isOwn: false,
  },
  {
    id: 4,
    user: { name: "Me", avatar: "https://github.com/shadcn.png" },
    content: "That's awesome! Can you share the details?",
    timestamp: "2:33 PM",
    isOwn: true,
  },
];

export default function ChatMessages() {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={messages[0].user.avatar} />
            <AvatarFallback className="text-sm font-medium">AJ</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{messages[0].user.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="size-8 p-0">
            <Video className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="size-8 p-0">
            <Phone className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="size-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex gap-2 max-w-[70%] ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}
            >
              {!message.isOwn && (
                <Avatar className="size-8 mt-1">
                  <AvatarImage src={message.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {message.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`${message.isOwn ? "bg-green-600 text-white" : "bg-white"} rounded-lg px-3 py-2 shadow-sm`}
              >
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${message.isOwn ? "text-green-100" : "text-muted-foreground"} text-right`}
                >
                  {message.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="h-16 flex items-center gap-2 border-t px-4 bg-background">
        <Input placeholder="Type a message..." className="flex-1" />
        <Button type="submit" size="sm" className="size-10 p-0">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
