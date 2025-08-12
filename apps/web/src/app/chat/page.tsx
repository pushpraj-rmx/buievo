import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const messages = [
  {
    id: 1,
    user: { name: "John Doe", avatar: "https://github.com/shadcn.png" },
    status: "sent",
    content: "Hello, how are you?",
  },
  {
    id: 2,
    user: { name: "Jane Smith", avatar: "https://github.com/shadcn.png" },
    status: "delivered",
    content: "I'm good, thank you!",
  },
];

export default function Chat() {
  return (
    <>
      <ScrollArea className="h-[600px]">
        {/* Messages */}
        <div className="space-y-4 p-4">
          <ScrollArea>list of contacts</ScrollArea>

          {messages.map((message) => (
            <Card key={message.id} className="p-3">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={message.user.avatar} />
                  <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{message.user.name}</span>
                    <Badge variant="secondary">{message.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {message.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          <ScrollArea>chat info</ScrollArea>
        </div>
      </ScrollArea>
      {/* Message input */}
      <form>
        <div className="flex gap-2 p-4 border-t">
          <Input placeholder="Type a message..." />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </>
  );
}
