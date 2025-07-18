# --- BEGIN first code block ---
import os
import sys
import zipfile
import json
from datetime import datetime
from uuid import uuid4

from supabase import create_client          # pip install supabase
from openai import OpenAI                   # pip install openai
from tqdm import tqdm                       # pip install tqdm

# read creds from environment
SUPABASE_URL  = os.getenv("SUPABASE_URL")
SERVICE_KEY   = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_KEY    = os.getenv("OPENAI_API_KEY")

if not all([SUPABASE_URL, SERVICE_KEY, OPENAI_KEY]):
    sys.exit("Missing env vars: SUPABASE_URL, SERVICE_KEY, OPENAI_API_KEY")

supabase = create_client(SUPABASE_URL, SERVICE_KEY)
openai   = OpenAI(api_key=OPENAI_KEY)
# --- END first code block ---

# --- BEGIN second code block ---
CHUNK_TOKENS = 700     # ~2500 characters, safe for embeddings

def smart_chunks(text: str, max_tokens: int = CHUNK_TOKENS) -> list[str]:
    """
    Split long text into roughly max_tokens‑sized chunks,
    respecting paragraph boundaries when possible.
    """
    paragraphs = text.split("\n\n")
    buffer, chunks = "", []
    for p in paragraphs:
        if len(buffer) + len(p) < max_tokens:
            buffer += p + "\n\n"
        else:
            chunks.append(buffer.strip())
            buffer = p + "\n\n"
    if buffer:
        chunks.append(buffer.strip())
    return chunks

def embed_batch(text_chunks: list[str]) -> list[list[float]]:
    """
    Call OpenAI embeddings on a list of strings and
    return list of 1536‑dim vectors.
    """
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text_chunks
    )
    # API returns objects with 'embedding' attr
    return [d.embedding for d in response.data]
# --- END second code block ---

# --- BEGIN third code block ---
def main(zip_path: str) -> None:
    """
    Validate the .zip export path and list all conversation JSON files.
    """
    if not zip_path.endswith(".zip"):
        sys.exit("Please provide the ChatGPT export .zip file")

    if not os.path.isfile(zip_path):
        sys.exit(f"File not found: {zip_path}")

    with zipfile.ZipFile(zip_path) as z:
        # ChatGPT now ships a single conversations.json at archive root
        conv_files = [f for f in z.namelist() if f.endswith("conversations.json")]

    print(f"Found {len(conv_files)} conversations in {os.path.basename(zip_path)}")

    # --- BEGIN fifth code block ---
    # iterate over conversations and embed
    with zipfile.ZipFile(zip_path) as z:
        for conv_file in tqdm(conv_files, desc="Embedding convs"):
            raw = json.loads(z.read(conv_file))

            # Export is a list of conversation objects
            convo_objs = raw if isinstance(raw, list) else [raw]
            messages = []
            for convo in convo_objs:
                mapping = convo.get("mapping", {})
                messages.extend(
                    n["content"]["parts"][0]
                    for n in mapping.values()
                    if n and n.get("message_type") == "assistant"
                )
            full_text = "\n\n".join(messages)

            # skip empty convo
            if not full_text.strip():
                continue

            chunks     = smart_chunks(full_text)
            embeddings = embed_batch(chunks)

            for chunk, vec in zip(chunks, embeddings):
                res = supabase.table("chat_history").insert({
                    "id": str(uuid4()),
                    "user_id": None,          # add your UUID if you like
                    "chunk_text": chunk,
                    "embedding": vec,
                    "tags": ["chatgpt_export"],
                    "conv_start": datetime.utcfromtimestamp(raw["create_time"]).isoformat(),
                    "conv_end":   datetime.utcfromtimestamp(raw["update_time"]).isoformat()
                }).execute()

                if res.error:
                    print("❌  Insert failed:", res.error.message)
                else:
                    print("✅  Chunk inserted –", res.data[0]["id"])

            # 📝 optional: generate a brief summary (first 6 bullet points)
            summary_resp = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Summarize this conversation in 6 bullet points."},
                    {"role": "user",   "content": full_text[:12000]}  # safeguard against huge inputs
                ],
            )
            summary_text = summary_resp.choices[0].message.content
            summary_emb  = embed_batch([summary_text])[0]

            supabase.table("chat_history_summaries").insert({
                "id": str(uuid4()),
                "history_id": None,   # you can link to the first chunk's id later if desired
                "summary_text": summary_text,
                "embedding": summary_emb
            }).execute()
    # --- END fifth code block ---
# --- END third code block ---

# --- BEGIN fourth code block ---
if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python ingest_chatgpt.py /path/to/chatgpt_export.zip")
    main(sys.argv[1])
# --- END fourth code block ---