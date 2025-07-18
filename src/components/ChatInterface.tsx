
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, MessageSquare, Brain } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  contextFound?: number;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-search', {
        body: { query: userMessage.content }
      });

      if (error) {
        throw error;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        contextFound: data.contextFound
      };

      setMessages(prev => [...prev, aiMessage]);

      if (data.contextFound > 0) {
        toast.success(`Found ${data.contextFound} relevant conversations from your ChatGPT history`);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold">Chat History Explorer</h2>
        </div>
        <div className="text-sm text-gray-500">
          Search through your ChatGPT conversations
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Start exploring your ChatGPT history</p>
            <p className="text-sm">Ask questions about your past conversations, topics, or patterns.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-3xl p-4 ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-start gap-3">
                  {message.sender === 'ai' && (
                    <Brain className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.contextFound !== undefined && message.contextFound > 0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {message.contextFound} context matches
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-3xl p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your ChatGPT conversations..."
            className="flex-1 min-h-12 max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
