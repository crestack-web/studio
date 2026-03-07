import { useState, useEffect } from 'react';

export function useLiveClock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export function useShiftTimer() {
  const [time, setTime] = useState('00:00:00');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return { time, isRunning, setIsRunning };
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const hideToast = () => {
    setToast({ message: '', visible: false });
  };

  return { toast, showToast, hideToast };
}

export function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
