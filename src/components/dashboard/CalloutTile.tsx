import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Callout {
  content: string;
  type: 'loop' | 'mask' | 'flare';
  timestamp: string;
}

interface CalloutTileProps {
  callout: Callout | null;
}

export const CalloutTile = ({ callout }: CalloutTileProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'loop':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'mask':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'flare':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const truncateContent = (content: string, maxLength = 140) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <Card className="rounded-2xl shadow-lg bg-neutral-900 border-neutral-800 flex flex-col justify-between p-4 h-40">
        {callout ? (
          <>
            <div className="flex-1">
              <p className="text-sm text-white leading-relaxed mb-2">
                {truncateContent(callout.content)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Last Callout</span>
              <Badge className={`${getTypeColor(callout.type)} text-white border-none`}>
                {callout.type}
              </Badge>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">No callouts yet</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};