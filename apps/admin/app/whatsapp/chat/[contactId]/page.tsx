"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Paperclip,
  File,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Phone,
  Video,
  Smile,
} from "lucide-react";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: string;
  segments: Array<{ id: string; name: string }>;
}

interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "document" | "audio" | "video";
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface Conversation {
  id: string;
  contactId: string;
  contact: Contact;
  messages: Message[];
  unreadCount: number;
}

export default function IndividualChatPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  // Use React's use() hook to unwrap the params Promise
  const { contactId } = use(params);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversation and messages
  const fetchConversation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/conversations/${contactId}`);
      if (!response.ok) throw new Error("Failed to fetch conversation");

      const data = await response.json();
      setConversation(data);
    } catch (error) {
      toast.error("Failed to fetch conversation");
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (contactId) {
      fetchConversation();
    }
  }, [fetchConversation, contactId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !conversation) return;

    try {
      setSending(true);
      const response = await fetch(
        `/api/v1/conversations/${contactId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message.trim(),
            type: "text",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to send message");

      const newMessage = await response.json();
      setConversation((prev) =>
        prev
          ? {
            ...prev,
            messages: [...prev.messages, newMessage],
          }
          : null,
      );
      setMessage("");
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-600" />;
      case "failed":
        return <Check className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMessage = (msg: Message) => {
    const isOutbound = msg.direction === "outbound";

    return (
      <div
        key={msg.id}
        className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-2 px-4`}
      >
        <div
          className={`flex items-end gap-2 max-w-[65%] ${isOutbound ? "flex-row-reverse" : "flex-row"}`}
        >
          {!isOutbound && (
            <Avatar className="h-8 w-8 bg-[#00a884]">
              <AvatarImage src="" alt={conversation?.contact.name} />
              <AvatarFallback className="bg-[#00a884] text-white text-xs font-semibold">
                {getInitials(conversation?.contact.name || "")}
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={`rounded-lg px-3 py-2 max-w-full ${isOutbound ? "bg-[#005c4b] text-white" : "bg-[#202c33] text-white"
              }`}
          >
            {msg.type === "text" && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            )}
            {msg.type === "image" && (
              <div className="space-y-2">
                <Image
                  src={msg.mediaUrl || ""}
                  alt="Image"
                  width={200}
                  height={200}
                  className="rounded max-w-full max-h-48 object-cover"
                />
                {msg.content && <p className="text-sm">{msg.content}</p>}
              </div>
            )}
            {msg.type === "document" && (
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">{msg.fileName}</p>
                  <p className="text-xs opacity-70">{msg.fileSize} bytes</p>
                </div>
              </div>
            )}

            <div
              className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"
                }`}
            >
              <span className="text-xs opacity-70">
                {formatTime(msg.timestamp)}
              </span>
              {isOutbound && getStatusIcon(msg.status)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#111b21]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a884]" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-8 bg-[#111b21] text-white">
        <h3 className="text-lg font-medium mb-2">Contact not found</h3>
        <p className="text-[#8696a0] mb-4">
          The contact you&apos;re looking for doesn&apos;t exist
        </p>
        <Button asChild className="bg-[#00a884] hover:bg-[#008f72] text-white">
          <Link href="/whatsapp/chat">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b141a]">
      {/* WhatsApp Chat Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#374045]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-[#8696a0] hover:text-white"
          >
            <Link href="/whatsapp/chat">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 bg-[#00a884]">
                <AvatarImage src="" alt={conversation.contact.name} />
                <AvatarFallback className="bg-[#00a884] text-white font-semibold">
                  {getInitials(conversation.contact.name)}
                </AvatarFallback>
              </Avatar>
              {conversation.contact.status === "active" && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-[#202c33]" />
              )}
            </div>

            <div>
              <h2 className="text-white font-semibold">
                {conversation.contact.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[#8696a0] text-sm">
                  {conversation.contact.phone}
                </span>
                {conversation.contact.segments.length > 0 && (
                  <Badge className="text-xs bg-[#2a3942] text-[#8696a0] border-[#374045]">
                    {conversation.contact.segments[0].name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-white"
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-white"
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-white"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[#0b141a] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg2MFY2MEgwVjBaIiBmaWxsPSIjMGExNDFhIi8+CjxwYXRoIGQ9Ik0wIDBIMFY2MEg2MFYwWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzFfMSkiLz4KPHBhdGggZD0iTTAgMEg2MFY2MEgwVjBaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfMV8xKSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iNjAiIHkyPSI2MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMTExYjIxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzBiMTQxYSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMV8xIiB4MT0iNjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMxMTFiMjEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMGExNDFhIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')]">
        {conversation.messages.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2 text-white">
              No messages yet
            </h3>
            <p className="text-[#8696a0]">
              Start a conversation with {conversation.contact.name}
            </p>
          </div>
        ) : (
          <div className="space-y-1 py-4">
            {conversation.messages.map(renderMessage)}
            {isTyping && (
              <div className="flex justify-start mb-2 px-4">
                <div className="flex items-end gap-2">
                  <Avatar className="h-8 w-8 bg-[#00a884]">
                    <AvatarImage src="" alt={conversation.contact.name} />
                    <AvatarFallback className="bg-[#00a884] text-white text-xs font-semibold">
                      {getInitials(conversation.contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-[#202c33] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-[#202c33] px-4 py-3 border-t border-[#374045]">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-white"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-white"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] max-h-32 resize-none bg-[#2a3942] border-[#374045] text-white placeholder:text-[#8696a0] focus:border-[#00a884] focus:ring-[#00a884] rounded-lg"
              rows={1}
            />
          </div>

          <Button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            size="sm"
            className="bg-[#00a884] hover:bg-[#008f72] text-white rounded-full w-10 h-10 p-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
