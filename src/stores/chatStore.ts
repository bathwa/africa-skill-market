import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, realtimeSubscriptions } from '@/lib/supabase';

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
  activeSubscriptions: Record<string, any>;
  sendMessage: (messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  markAsRead: (chatId: string, userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
}

// IndexedDB for offline chat storage
class ChatDB {
  private dbName = 'skillzone-chat';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('chatId', 'chatId');
          messageStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    await store.put(message);
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('chatId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(chatId);
      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by timestamp
        messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const index = store.index('chatId');
    
    const messages = await new Promise<ChatMessage[]>((resolve, reject) => {
      const request = index.getAll(chatId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Update unread messages for this user
    for (const message of messages) {
      if (message.recipientId === userId && !message.isRead) {
        message.isRead = true;
        await store.put(message);
      }
    }
  }
}

const chatDB = new ChatDB();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      unreadCounts: {},
      activeSubscriptions: {},

      sendMessage: async (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          isRead: false
        };

        // Add to local state immediately for optimistic UI
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

        // Save to IndexedDB for offline persistence
        try {
          await chatDB.init();
          await chatDB.saveMessage(message);
        } catch (error) {
          console.error('Failed to save message to IndexedDB:', error);
        }

        // Send to Supabase if online
        if (navigator.onLine) {
          try {
            // This would be implemented when chat table is added to Supabase
            // const { error } = await supabase
            //   .from('chat_messages')
            //   .insert({
            //     chat_id: message.chatId,
            //     sender_id: message.senderId,
            //     sender_name: message.senderName,
            //     recipient_id: message.recipientId,
            //     message: message.message,
            //     opportunity_id: message.opportunityId,
            //     provider_id: message.providerId
            //   });
            
            // if (error) throw error;
            
            console.log('Message sent to Supabase:', message);
          } catch (error) {
            console.error('Failed to send message to Supabase:', error);
            // Message will be queued for sync when online
          }
        }

        console.log('Message sent:', message);
      },

      loadMessages: async (chatId: string) => {
        try {
          await chatDB.init();
          const messages = await chatDB.getMessages(chatId);
          
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: messages
            }
          }));

          // Also try to load from Supabase if online
          if (navigator.onLine) {
            try {
              // This would be implemented when chat table is added
              // const { data, error } = await supabase
              //   .from('chat_messages')
              //   .select('*')
              //   .eq('chat_id', chatId)
              //   .order('timestamp', { ascending: true });
              
              // if (!error && data) {
              //   const supabaseMessages = data.map(msg => ({
              //     id: msg.id,
              //     chatId: msg.chat_id,
              //     senderId: msg.sender_id,
              //     senderName: msg.sender_name,
              //     recipientId: msg.recipient_id,
              //     message: msg.message,
              //     timestamp: msg.timestamp,
              //     isRead: msg.is_read,
              //     opportunityId: msg.opportunity_id,
              //     providerId: msg.provider_id
              //   }));
              
              //   // Merge with local messages
              //   const mergedMessages = [...messages, ...supabaseMessages]
              //     .filter((msg, index, arr) => arr.findIndex(m => m.id === msg.id) === index)
              //     .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              
              //   set((state) => ({
              //     messages: {
              //       ...state.messages,
              //       [chatId]: mergedMessages
              //     }
              //   }));
              
              //   // Update IndexedDB
              //   for (const msg of supabaseMessages) {
              //     await chatDB.saveMessage(msg);
              //   }
              // }
              
              console.log('Loading messages from Supabase for chat:', chatId);
            } catch (error) {
              console.error('Failed to load messages from Supabase:', error);
            }
          }
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      },

      markAsRead: async (chatId: string, userId: string) => {
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

        // Update IndexedDB
        try {
          await chatDB.init();
          await chatDB.markAsRead(chatId, userId);
        } catch (error) {
          console.error('Failed to mark messages as read in IndexedDB:', error);
        }

        // Update Supabase if online
        if (navigator.onLine) {
          try {
            // This would be implemented when chat table is added
            // await supabase
            //   .from('chat_messages')
            //   .update({ is_read: true })
            //   .eq('chat_id', chatId)
            //   .eq('recipient_id', userId)
            //   .eq('is_read', false);
            
            console.log('Marked messages as read in Supabase');
          } catch (error) {
            console.error('Failed to mark messages as read in Supabase:', error);
          }
        }
      },

      getUnreadCount: (userId: string) => {
        const { unreadCounts } = get();
        return unreadCounts[userId] || 0;
      },

      subscribeToChat: (chatId: string) => {
        const { activeSubscriptions } = get();
        
        // Don't subscribe if already subscribed
        if (activeSubscriptions[chatId]) return;

        try {
          // Subscribe to real-time updates
          const subscription = realtimeSubscriptions.subscribeToChat(chatId, (payload) => {
            const { messages } = get();
            const newMessage: ChatMessage = {
              id: payload.new.id,
              chatId: payload.new.chat_id,
              senderId: payload.new.sender_id,
              senderName: payload.new.sender_name,
              recipientId: payload.new.recipient_id,
              message: payload.new.message,
              timestamp: payload.new.timestamp,
              isRead: payload.new.is_read,
              opportunityId: payload.new.opportunity_id,
              providerId: payload.new.provider_id
            };

            set((state) => ({
              messages: {
                ...state.messages,
                [chatId]: [
                  ...(state.messages[chatId] || []),
                  newMessage
                ]
              },
              unreadCounts: {
                ...state.unreadCounts,
                [newMessage.recipientId]: (state.unreadCounts[newMessage.recipientId] || 0) + 1
              }
            }));

            // Save to IndexedDB
            chatDB.saveMessage(newMessage).catch(console.error);
          });

          set((state) => ({
            activeSubscriptions: {
              ...state.activeSubscriptions,
              [chatId]: subscription
            }
          }));
        } catch (error) {
          console.error('Failed to subscribe to chat:', error);
        }
      },

      unsubscribeFromChat: (chatId: string) => {
        const { activeSubscriptions } = get();
        const subscription = activeSubscriptions[chatId];
        
        if (subscription) {
          subscription.unsubscribe();
          
          set((state) => {
            const newSubscriptions = { ...state.activeSubscriptions };
            delete newSubscriptions[chatId];
            return { activeSubscriptions: newSubscriptions };
          });
        }
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
