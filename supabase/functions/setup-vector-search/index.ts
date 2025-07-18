
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create the vector search function
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION match_chat_history(
          query_embedding vector(1536),
          match_threshold float,
          match_count int
        )
        RETURNS TABLE (
          id uuid,
          content text,
          similarity float
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            chat_history.id,
            chat_history.chunk_text as content,
            1 - (chat_history.embedding <=> query_embedding) as similarity
          FROM chat_history
          WHERE 1 - (chat_history.embedding <=> query_embedding) > match_threshold
          ORDER BY chat_history.embedding <=> query_embedding
          LIMIT match_count;
        END;
        $$;
      `
    })

    if (error) {
      console.error('SQL execution error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error setting up vector search:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
