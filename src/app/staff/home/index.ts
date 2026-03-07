import { useState, useEffect, useCallback } from 'react';

/** Tracks shift elapsed time, returning a formatted string like "2h 34m". */
export function useShiftTimer() {
  const [startTime] = useState(() => Date.now() - 3 * 60 * 1000); // 3-min head start for demo
  const [elapsed, setElapsed] = useState('0h 00m');
  const [chipTime, setChipTime] = useState('0:00');

  useEffect(() => {
    const tick = () => {
      const ms = Date.now() - startTime;
      const totalSecs = Math.floor(ms / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setElapsed(`${h}h ${String(m).padStart(2, '0')}m`);
      setChipTime(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return { elapsed, chipTime };
}

/** Returns a live clock string (HH:MM:SS) for the current time. */
export function useLiveClock() {
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

/** Toast notification hook. */
export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const timerRef = { current: 0 as ReturnType<typeof setTimeout> };

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  return { visible, message, show };
}

/** Returns a greeting string based on the current hour. */
export function useGreeting(firstName: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `Good ${part}, ${firstName} 👋`;
}
