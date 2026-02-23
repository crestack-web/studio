import React, { useState, useRef, useEffect } from "react";

type Message = {
  sender: "user" | "mo";
  text: string;
};

type ChatPanelProps = {
  onClose: () => void;
};

const initialMessages: Message[] = [
  {
    sender: "mo",
    text: "Hi! I'm MO, your business assistant. Ask me anything about your sales, profit, expenses, or stock.",
  },
];

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { sender: "user", text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        {
          sender: "mo",
          text:
            "Sorry, MO can only answer business-related questions for now. Try asking about sales, profit, expenses, or stock.",
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="chatpanel">
      <div className="chatpanel-hd">
        <div className="chatpanel-title">
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={2}>
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          Ask MO
        </div>
        <button className="chatpanel-close" onClick={onClose} title="Close chat">
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="chatpanel-body">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chatpanel-msg ${msg.sender === "user" ? "user" : "mo"}`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="chatpanel-msg mo">
            <span className="chatpanel-typing">MO is typing…</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="chatpanel-input-row">
        <input
          className="chatpanel-input"
          type="text"
          placeholder="Type your question…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={loading}
        />
        <button className="chatpanel-send" onClick={handleSend} disabled={loading || !input.trim()}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}