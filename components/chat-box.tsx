"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatBox({
  matchId,
  currentUserId,
}: {
  matchId: string;
  currentUserId: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, match_id, sender_id, content, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) setError(error.message);
      else setMessages(data ?? []);
      setLoading(false);
    }

    loadInitial();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setError(null);

    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: currentUserId, content })
      .select("id, match_id, sender_id, content, created_at")
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
        Live Connection Chat
      </div>

      <div className="h-64 space-y-3 overflow-y-auto px-5 py-4 bg-white">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#002FA7]" />
          </div>
        ) : messages.length === 0 ? (
          <p className="pt-8 text-center text-xs font-light text-slate-400">
            Say hello and arrange your visit 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <span
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-light leading-relaxed ${
                    mine
                      ? "bg-[#002FA7] text-white"
                      : "bg-slate-50 text-slate-900 border border-slate-150"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="px-5 pb-2 text-xs text-red-600 font-light" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3 bg-white">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all font-light placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#002FA7] text-white transition-all duration-300 hover:bg-[#001e6c] disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}