
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useChatStore } from '@/stores/chatStore';

interface ChatInterfaceProps {
  opportunityId?: string;
  providerId?: string;
  recipientName: string;
  recipientRole: 'client' | 'service_provider';
}

const ChatInterface = ({ opportunityId, providerId, recipientName, recipientRole }: ChatInterfaceProps) => {
  const { profile } = useAuthStore();
  const { messages, sendMessage, loadMessages, markAsRead } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = opportunityId || providerId || '';

  useEffect(() => {
    if (chatId && profile) {
      loadMessages(chatId);
      markAsRead(chatId, profile.id);
    }
  }, [chatId, profile, loadMessages, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile || isLoading) return;

    setIsLoading(true);
    try {
      await sendMessage({
        chatId,
        senderId: profile.id,
        senderName: profile.name,
        recipientId: recipientRole === 'client' ? opportunityId! : providerId!,
        message: newMessage.trim(),
        opportunityId,
        providerId
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const chatMessages = messages[chatId] || [];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {recipientName}
          <Badge variant="secondary" className="ml-auto">
            {recipientRole === 'client' ? 'Client' : 'Provider'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === profile?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[70%] ${
                    message.senderId === profile?.id ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {message.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg p-3 ${
                      message.senderId === profile?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        message.senderId === profile?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
