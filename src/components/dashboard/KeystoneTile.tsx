import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface KeystoneAction {
  id: string;
  action_text: string;
  completed_bool: boolean;
}

interface KeystoneTileProps {
  action: KeystoneAction | null;
  onToggle: (id: string, completed: boolean) => void;
}

export const KeystoneTile = ({ action, onToggle }: KeystoneTileProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <Card className="rounded-2xl shadow-lg bg-neutral-900 border-neutral-800 flex flex-col justify-between p-4 h-40">
        {action ? (
          <>
            <div className="flex-1">
              <p className="text-sm text-white leading-relaxed mb-2">
                {action.action_text}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Today's Keystone</span>
              <Switch
                checked={action.completed_bool}
                onCheckedChange={(checked) => onToggle(action.id, checked)}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">No keystone set yet</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};