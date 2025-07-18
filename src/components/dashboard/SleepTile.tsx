import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface SleepTileProps {
  score: number | null;
}

export const SleepTile = ({ score }: SleepTileProps) => {
  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRingColor = (score: number | null) => {
    if (!score) return 'border-gray-700';
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <Card className="rounded-2xl shadow-lg bg-neutral-900 border-neutral-800 flex flex-col items-center justify-center p-4 h-40">
        <div className={`relative w-20 h-20 rounded-full border-4 ${getRingColor(score)} flex items-center justify-center mb-2`}>
          <span className={`text-2xl font-medium ${getScoreColor(score)}`}>
            {score ?? '—'}
          </span>
        </div>
        <span className="text-sm text-gray-400">Sleep Score</span>
      </Card>
    </motion.div>
  );
};