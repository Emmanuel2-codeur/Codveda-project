'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, FormEvent, Dispatch, SetStateAction } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Props = {
  token: string | null;
  user: { id: number; email: string; role: string } | null;
  setProducts: Dispatch<SetStateAction<any[]>>;
};

type ChatMsg = { email: string; text: string; at: number };

export default function LivePanel({ token, user, setProducts }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [online, setOnline] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('product:created', (p: any) =>
      setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))
    );
    socket.on('product:updated', (p: any) =>
      setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)))
    );
    socket.on('product:deleted', ({ id }: { id: number }) =>
      setProducts((prev) => prev.filter((x) => x.id !== id))
    );
    socket.on('notification', (n: { message: string }) => {
      setToasts((prev) => [...prev, n.message]);
      setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    });
    socket.on('chat:message', (m: ChatMsg) => setChat((prev) => [...prev.slice(-49), m]));
    socket.on('online:count', (n: number) => setOnline(n));

    return () => {
      socket.disconnect();
    };
  }, [token, setProducts]);

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current?.emit('chat:send', text);
    setText('');
  }

  return (
    <>
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((t, i) => (
          <div key={i} className="bg-green-600 text-white text-sm px-4 py-2 rounded shadow">
            {t}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-4">🟢 {online} utilisateur(s) en ligne</p>

      {/* Chat (connectés uniquement) */}
      {user && (
        <div className="border rounded-lg p-4 mb-8">
          <h2 className="font-semibold mb-2 text-sm">Chat en direct</h2>
          <div className="h-32 overflow-y-auto text-sm space-y-1 mb-2">
            {chat.length === 0 && <p className="text-gray-400">Aucun message pour le moment.</p>}
            {chat.map((m, i) => (
              <p key={i}>
                <strong>{m.email.split('@')[0]}</strong> : {m.text}
              </p>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              className="border rounded px-3 py-1 flex-1 text-sm"
              placeholder="Écrire un message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Envoyer</button>
          </form>
        </div>
      )}
    </>
  );
}