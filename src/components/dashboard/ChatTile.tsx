
import { MessageSquare, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChatTile = () => {
  return (
    <Link 
      to="/chat"
      className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:bg-neutral-800 transition-colors group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <span className="text-lg font-semibold">Chat History</span>
        </div>
        <Brain className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-300 text-sm">
          Explore your ChatGPT conversations
        </p>
        <p className="text-gray-400 text-xs">
          Search through indexed chat history with AI assistance
        </p>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        Ready to explore
      </div>
    </Link>
  );
};
