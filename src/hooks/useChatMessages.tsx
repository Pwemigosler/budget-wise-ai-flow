
import { useState, useCallback } from "react";
import { Message } from "@/types/chat";
import { toast } from "sonner";
import { processActionRequest, getDefaultResponse } from "@/utils/chatBotActions";
import { useAvatar } from "@/contexts/AvatarContext";

export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your AI financial assistant. I can help you manage your finances, allocate funds to different categories, and manage your receipts. Try asking me to allocate money, view budgets, or show your receipts.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setAvatarState, speakMessage } = useAvatar();

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setAvatarState("thinking");

    try {
      // Check if message is an action request
      const actionResult = await processActionRequest(inputMessage);
      
      if (actionResult) {
        // This is a fund allocation, receipts, or other action request
        const botMessage: Message = {
          id: Date.now().toString(),
          content: actionResult.response,
          sender: "bot",
          timestamp: new Date(),
          action: actionResult.action,
          receipts: actionResult.receipts
        };
        
        setMessages((prev) => [...prev, botMessage]);
        
        // Set avatar state based on action status
        if (actionResult.action.status === "success") {
          setAvatarState("happy");
          
          // Speak the response
          speakMessage(actionResult.response);
          
          toast.success("Action completed", {
            description: actionResult.action.type === "receipts_view" 
              ? "Receipt information retrieved" 
              : actionResult.response,
          });
        } else {
          setAvatarState("confused");
          toast.error("Action failed", {
            description: actionResult.response,
          });
        }
      } else {
        // Regular conversation - use existing response logic
        const botContent = getDefaultResponse(inputMessage);

        const botMessage: Message = {
          id: Date.now().toString(),
          content: botContent,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setAvatarState("speaking");
        
        // Speak the response
        speakMessage(botContent);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response. Please try again.");
      setAvatarState("confused");
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, setAvatarState, speakMessage]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    handleSendMessage
  };
};
