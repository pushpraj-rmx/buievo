import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const messages = [
  {
    id: 1,
    user: { name: "Alice", avatar: "https://github.com/shadcn.png" },
    content: "Hey! How are you?",
  },
  {
    id: 2,
    user: { name: "Me", avatar: "https://github.com/shadcn.png" },
    content: "I'm good, thanks!",
  },
];

export default function ChatMessages() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 border-b px-4">
        <Avatar className="size-8">
          <AvatarImage src={messages[0].user.avatar} />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <div className="font-medium">Alice</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.map((message) => (
          <Card
            key={message.id}
            className="flex items-start gap-3 p-3 max-w-[80%]"
          >
            <Avatar>
              <AvatarImage src={message.user.avatar} />
              <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{message.user.name}</div>
              <div className="text-sm text-muted-foreground">
                {message.content}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Input */}
      <form className="h-16 flex items-center gap-2 border-t px-4">
        <Input placeholder="Type a message..." />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
