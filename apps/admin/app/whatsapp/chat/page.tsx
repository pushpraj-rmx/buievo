"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Image from "next/image";
import {
  Search,
  MessageSquare,
  Users,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  MoreVertical,
  Filter,
  Phone,
  Video,
  Info,
  X,
  File,
  Smile,
  Paperclip,
  Send,
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
  lastMessage: {
    id: string;
    content: string;
    type: "text" | "image" | "document" | "audio" | "video";
    direction: "inbound" | "outbound";
    status: "sent" | "delivered" | "read" | "failed";
    timestamp: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export default function WhatsAppChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/conversations");
      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      toast.error("Failed to fetch conversations");
      console.error("Error fetching conversations:", error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  // Poll for conversation list updates (only if not loading)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchConversations();
      }
    }, 15000); // Poll every 15 seconds to reduce flashing

    return () => clearInterval(interval);
  }, [fetchConversations, loading]);

  // Fetch conversation messages when selected
  const fetchConversationMessages = useCallback(async (contactId: string) => {
    try {
      const response = await fetch(`/api/v1/conversations/${contactId}`);
      if (!response.ok) throw new Error("Failed to fetch conversation");

      const data = await response.json();
      setSelectedMessages(data.messages);
      setSelectedContact(data.contact);
    } catch (error) {
      toast.error("Failed to fetch conversation");
      console.error("Error fetching conversation:", error);
    }
  }, []);

  // Poll for new messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {
      fetchConversationMessages(selectedConversation.contactId);
    }, 10000); // Poll every 10 seconds to reduce flashing

    return () => clearInterval(interval);
  }, [selectedConversation, fetchConversationMessages]);

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.contactId);
    setShowContactDetails(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await fetch(
        `/api/v1/conversations/${selectedConversation.contactId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message.trim(),
            type: "text",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      const newMessage = await response.json();
      setSelectedMessages((prev) => [...prev, newMessage]);
      setMessage("");
      toast.success("Message sent");

      // Update conversation list with new last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: newMessage,
                updatedAt: new Date().toISOString(),
              }
            : conv
        )
      );
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

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.contact.name.toLowerCase().includes(search.toLowerCase()) ||
      conversation.contact.phone.includes(search) ||
      conversation.contact.email?.toLowerCase().includes(search.toLowerCase())
  );

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
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
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
              <AvatarImage src="" alt={selectedContact?.name} />
              <AvatarFallback className="bg-[#00a884] text-white text-xs font-semibold">
                {getInitials(selectedContact?.name || "")}
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={`rounded-lg px-3 py-2 max-w-full ${
              isOutbound ? "bg-[#005c4b] text-white" : "bg-[#202c33] text-white"
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
              className={`flex items-center gap-1 mt-1 ${
                isOutbound ? "justify-end" : "justify-start"
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

  return (
    <div className="flex h-screen bg-[#111b21]">
      {/* Left Panel - Chat List */}
      <div className="w-1/3 flex flex-col border-r border-[#374045]">
        {/* Header */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#374045]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Chats</h1>
              <p className="text-[#8696a0] text-sm">WhatsApp Business</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#8696a0] hover:text-white"
            >
              <Filter className="w-5 h-5" />
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

        {/* Search Bar */}
        <div className="bg-[#202c33] px-4 py-2 border-b border-[#374045]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
            <Input
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#2a3942] border-[#374045] text-white placeholder:text-[#8696a0] focus:border-[#00a884] focus:ring-[#00a884]"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-[#8696a0] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-white">
                No conversations yet
              </h3>
              <p className="text-[#8696a0] mb-4">
                Start a conversation by selecting a contact
              </p>
              <Button
                asChild
                className="bg-[#00a884] hover:bg-[#008f72] text-white"
              >
                <Link href="/whatsapp/contacts">
                  <Users className="w-4 h-4 mr-2" />
                  Go to Contacts
                </Link>
              </Button>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`flex items-center gap-3 p-3 hover:bg-[#202c33] transition-colors border-b border-[#374045] cursor-pointer ${
                    selectedConversation?.id === conversation.id
                      ? "bg-[#202c33]"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 bg-[#00a884]">
                      <AvatarImage src="" alt={conversation.contact.name} />
                      <AvatarFallback className="bg-[#00a884] text-white font-semibold">
                        {getInitials(conversation.contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.contact.status === "active" && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-[#111b21]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate text-white">
                        {conversation.contact.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-[#8696a0]">
                        {getStatusIcon(conversation.lastMessage.status)}
                        <span>
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#8696a0] truncate">
                        {conversation.lastMessage.direction === "inbound" &&
                          "→ "}
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="ml-2 bg-[#00a884] text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#8696a0]">
                        {conversation.contact.phone}
                      </span>
                      {conversation.contact.segments.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[#2a3942] text-[#8696a0] border-[#374045]"
                        >
                          {conversation.contact.segments[0].name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel - Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#374045]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 bg-[#00a884]">
                      <AvatarImage src="" alt={selectedContact?.name} />
                      <AvatarFallback className="bg-[#00a884] text-white font-semibold">
                        {getInitials(selectedContact?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedContact?.status === "active" && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-[#202c33]" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-white font-semibold">
                      {selectedContact?.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8696a0] text-sm">
                        {selectedContact?.phone}
                      </span>
                      {selectedContact?.segments &&
                        selectedContact.segments.length > 0 && (
                          <Badge className="text-xs bg-[#2a3942] text-[#8696a0] border-[#374045]">
                            {selectedContact.segments[0].name}
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
                  onClick={() => setShowContactDetails(!showContactDetails)}
                >
                  <Info className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-[#0b141a] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg2MFY2MEgwVjBaIiBmaWxsPSIjMGExNDFhIi8+CjxwYXRoIGQ9Ik0wIDBIMFY2MEg2MFYwWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzFfMSkiLz4KPHBhdGggZD0iTTAgMEg2MFY2MEgwVjBaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfMV8xKSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iNjAiIHkyPSI2MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMTExYjIxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzBiMTQxYSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMV8xIiB4MT0iNjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMxMTFiMjEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMGExNDFhIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+')]">
              {selectedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2 text-white">
                    No messages yet
                  </h3>
                  <p className="text-[#8696a0]">
                    Start a conversation with {selectedContact?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 py-4">
                  {selectedMessages.map(renderMessage)}
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
                  <Input
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-[#2a3942] border-[#374045] text-white placeholder:text-[#8696a0] focus:border-[#00a884] focus:ring-[#00a884] rounded-lg"
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-[#8696a0] mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2 text-white">
                Select a conversation
              </h3>
              <p className="text-[#8696a0]">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Contact Details */}
      {showContactDetails && selectedContact && (
        <div className="w-1/4 bg-[#202c33] border-l border-[#374045]">
          <div className="p-4 border-b border-[#374045]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Contact Info</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#8696a0] hover:text-white"
                onClick={() => setShowContactDetails(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-center mb-4">
              <Avatar className="h-20 w-20 bg-[#00a884] mx-auto mb-3">
                <AvatarImage src="" alt={selectedContact.name} />
                <AvatarFallback className="bg-[#00a884] text-white text-lg font-semibold">
                  {getInitials(selectedContact.name)}
                </AvatarFallback>
              </Avatar>
              <h4 className="text-white font-semibold text-lg">
                {selectedContact.name}
              </h4>
              <p className="text-[#8696a0] text-sm">{selectedContact.phone}</p>
              {selectedContact.email && (
                <p className="text-[#8696a0] text-sm">
                  {selectedContact.email}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-[#8696a0] hover:text-white hover:bg-[#2a3942]"
              >
                <Phone className="w-4 h-4 mr-3" />
                Call
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-[#8696a0] hover:text-white hover:bg-[#2a3942]"
              >
                <Video className="w-4 h-4 mr-3" />
                Video Call
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-[#8696a0] hover:text-white hover:bg-[#2a3942]"
              >
                <Search className="w-4 h-4 mr-3" />
                Search
              </Button>
            </div>

            {selectedContact.segments &&
              selectedContact.segments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#374045]">
                  <h5 className="text-white font-medium mb-2">Segments</h5>
                  <div className="space-y-1">
                    {selectedContact.segments.map((segment) => (
                      <Badge
                        key={segment.id}
                        className="bg-[#2a3942] text-[#8696a0] border-[#374045]"
                      >
                        {segment.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
