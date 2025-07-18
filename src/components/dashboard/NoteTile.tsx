import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Plus, PenTool } from 'lucide-react';

interface NoteTileProps {
  onClick: () => void;
}

export const NoteTile = ({ onClick }: NoteTileProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
    >
      <Card className="rounded-2xl shadow-lg bg-neutral-900 border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer flex flex-col items-center justify-center p-4 h-40">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-2">
          <PenTool className="h-6 w-6 text-white" />
        </div>
        <span className="text-sm text-gray-300">Add Note</span>
        <Plus className="h-4 w-4 text-gray-400 mt-1" />
      </Card>
    </motion.div>
  );
};