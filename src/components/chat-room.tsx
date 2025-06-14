"use client"

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "./message-bubble";
import FileUpload from "./file-upload";

interface Message {
  _id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date | string;
  type: "text" | "image";
}

interface ChatRoomProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  currentRoom: string;
}

export default function ChatRoom({ messages, onSendMessage, onTyping, typingUsers, currentRoom }: ChatRoomProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log("Sending message:", message);
      onSendMessage(message);
      setMessage("");
      onTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", currentRoom);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("File uploaded:", data.fileUrl);
        onSendMessage(data.fileUrl);
        setShowFileUpload(false);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={{ ...msg, timestamp: new Date(msg.timestamp) }}
              isOwn={msg.userId === user?.id}
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-500 italic">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={!user}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={message}
            onChange={handleInputChange}
            placeholder={`Message #${currentRoom}`}
            className="flex-1"
            maxLength={1000}
            disabled={!user}
          />
          <Button type="submit" disabled={!message.trim() || !user}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {showFileUpload && <FileUpload onFileUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      </div>
    </div>
  );
}
