import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
}

export const NoteModal = ({ isOpen, onClose, onSave }: NoteModalProps) => {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    await onSave(text);
    setText('');
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-neutral-900 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Quick Note</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Drop a quick note…"
          rows={3}
          className="mb-4 bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-400"
          autoFocus
        />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-neutral-700 text-gray-300 hover:bg-neutral-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!text.trim() || isSaving}
            className="flex-1 bg-white text-black hover:bg-gray-200"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};