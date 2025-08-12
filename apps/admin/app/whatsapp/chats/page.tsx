import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
];

export default function ChatsIndex() {
  return (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
      Select a chat from the left.
    </div>
  );
}
