import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import { SleepTile } from '@/components/dashboard/SleepTile';
import { KeystoneTile } from '@/components/dashboard/KeystoneTile';
import { CalloutTile } from '@/components/dashboard/CalloutTile';
import { NoteTile } from '@/components/dashboard/NoteTile';
import { ChatTile } from '@/components/dashboard/ChatTile';
import { NoteModal } from '@/components/NoteModal';
import { toast } from 'sonner';

interface KeystoneAction {
  id: string;
  action_text: string;
  completed_bool: boolean;
}

interface Callout {
  content: string;
  type: 'loop' | 'mask' | 'flare';
  timestamp: string;
}

const Index = () => {
  const { userId, loading } = useUser();
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [keystoneAction, setKeystoneAction] = useState<KeystoneAction | null>(null);
  const [lastCallout, setLastCallout] = useState<Callout | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;

    // Load sleep score
    const { data: sleepData } = await supabase
      .from('physio_events')
      .select('value_json')
      .eq('user_id', userId)
      .eq('type', 'sleep_score')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (sleepData?.[0]?.value_json && typeof sleepData[0].value_json === 'object') {
      setSleepScore((sleepData[0].value_json as { score?: number }).score ?? null);
    }

    // Load keystone action
    const today = dayjs().format('YYYY-MM-DD');
    const { data: keystoneData } = await supabase
      .from('keystone_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    setKeystoneAction(keystoneData);

    // Load last callout
    const { data: calloutData } = await supabase
      .from('callouts')
      .select('content, type, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (calloutData?.[0] && ['loop', 'mask', 'flare'].includes(calloutData[0].type)) {
      setLastCallout(calloutData[0] as Callout);
    }
  };

  const handleKeystoneToggle = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('keystone_actions')
      .update({ completed_bool: completed })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update keystone action');
      return;
    }

    setKeystoneAction(prev => prev ? { ...prev, completed_bool: completed } : null);
    toast.success(completed ? 'Keystone completed!' : 'Keystone unmarked');
  };

  const handleNoteSave = async (text: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('voice_transcripts')
      .insert({
        user_id: userId,
        text,
        tags: ['manual'],
        timestamp: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to save note');
      return;
    }

    toast.success('Note saved');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 grid grid-cols-2 gap-4">
      <SleepTile score={sleepScore} />
      
      <KeystoneTile 
        action={keystoneAction}
        onToggle={handleKeystoneToggle}
      />
      
      <CalloutTile callout={lastCallout} />
      
      <NoteTile onClick={() => setIsNoteModalOpen(true)} />

      <ChatTile />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleNoteSave}
      />
    </div>
  );
};

export default Index;
