
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  opportunityId?: string;
  providerId?: string;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  sendMessage: (messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  loadMessages: (chatId: string) => void;
  markAsRead: (chatId: string, userId: string) => void;
  getUnreadCount: (userId: string) => number;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      unreadCounts: {},

      sendMessage: async (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          isRead: false
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [messageData.chatId]: [
              ...(state.messages[messageData.chatId] || []),
              message
            ]
          },
          unreadCounts: {
            ...state.unreadCounts,
            [messageData.recipientId]: (state.unreadCounts[messageData.recipientId] || 0) + 1
          }
        }));

        // Simulate real-time delivery (in a real app, this would be handled by WebSocket/Supabase Realtime)
        console.log('Message sent:', message);
      },

      loadMessages: (chatId: string) => {
        // Messages are already loaded from localStorage via persist middleware
        // In a real app, this would fetch from the server
        console.log('Loading messages for chat:', chatId);
      },

      markAsRead: (chatId: string, userId: string) => {
        const { messages } = get();
        const chatMessages = messages[chatId] || [];
        
        const updatedMessages = chatMessages.map(msg => 
          msg.recipientId === userId ? { ...msg, isRead: true } : msg
        );

        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: updatedMessages
          },
          unreadCounts: {
            ...state.unreadCounts,
            [userId]: 0
          }
        }));
      },

      getUnreadCount: (userId: string) => {
        const { unreadCounts } = get();
        return unreadCounts[userId] || 0;
      }
    }),
    {
      name: 'skillzone-chat',
      partialize: (state) => ({
        messages: state.messages,
        unreadCounts: state.unreadCounts
      })
    }
  )
);
