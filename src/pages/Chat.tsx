
import { ChatInterface } from '@/components/ChatInterface';

const Chat = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="h-screen flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chat;
