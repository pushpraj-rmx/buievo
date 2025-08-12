import { MessageCircle, Users, Phone } from "lucide-react";

export default function ChatsIndex() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="size-20 bg-green-600 rounded-full flex items-center justify-center">
            <MessageCircle className="size-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Select a chat from the left sidebar to start messaging
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center space-y-2">
            <div className="size-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Chats</div>
          </div>
          <div className="text-center space-y-2">
            <div className="size-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <MessageCircle className="size-6 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
          <div className="text-center space-y-2">
            <div className="size-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <Phone className="size-6 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Calls</div>
          </div>
        </div>
      </div>
    </div>
  );
}
