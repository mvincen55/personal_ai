import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrCreateUser();
  }, []);

  const getOrCreateUser = async () => {
    try {
      // Try to get existing user from localStorage
      let dailyCode = localStorage.getItem('daily_code');
      
      if (!dailyCode) {
        // Generate new daily code
        dailyCode = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('daily_code', dailyCode);
      }

      // Try to find existing user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('daily_code', dailyCode)
        .single();

      if (existingUser) {
        setUserId(existingUser.id);
      } else {
        // Create new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ daily_code: dailyCode })
          .select('id')
          .single();

        if (error) throw error;
        setUserId(newUser.id);
      }
    } catch (error) {
      console.error('Error getting/creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return { userId, loading };
};