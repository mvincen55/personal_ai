
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Embedding user query:', query)
    
    // Generate embedding for the user's query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    })

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    console.log('Searching for similar chunks...')

    // Search for similar chunks using vector similarity
    const { data: similarChunks, error: searchError } = await supabase.rpc('match_chat_history', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    })

    if (searchError) {
      console.error('Search error:', searchError)
      // Fallback to simple query if vector search fails
      const { data: fallbackChunks } = await supabase
        .from('chat_history')
        .select('chunk_text, tags')
        .textSearch('chunk_text', query)
        .limit(3)
      
      if (fallbackChunks && fallbackChunks.length > 0) {
        return new Response(JSON.stringify({
          response: `Found ${fallbackChunks.length} related conversations from your ChatGPT history. Here's what I found:\n\n${fallbackChunks.map(chunk => chunk.chunk_text.substring(0, 200) + '...').join('\n\n')}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    let contextText = ''
    if (similarChunks && similarChunks.length > 0) {
      contextText = similarChunks.map((chunk: any) => chunk.content).join('\n\n')
      console.log(`Found ${similarChunks.length} relevant chunks`)
    }

    // Generate AI response using the context
    const systemPrompt = `You are an AI assistant that helps users explore and understand their ChatGPT conversation history. 

${contextText ? `Here's relevant context from the user's previous ChatGPT conversations:

${contextText}

Use this context to provide helpful insights, answer questions, or help the user understand patterns in their past conversations. Be specific and reference the content when relevant.` : 'No relevant context found from previous conversations.'}

Respond naturally and helpfully. If you found relevant context, reference it specifically. If not, let the user know you couldn't find related conversations.`

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const chatData = await chatResponse.json()
    const aiResponse = chatData.choices[0].message.content

    return new Response(JSON.stringify({
      response: aiResponse,
      contextFound: similarChunks?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in chat-search function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
