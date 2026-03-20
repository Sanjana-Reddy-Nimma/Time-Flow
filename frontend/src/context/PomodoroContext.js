import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

export const POMODORO_MODES = {
  work: { label: "Focus", key: "work", defaultMinutes: 25 },
  shortBreak: { label: "Short Break", key: "shortBreak", defaultMinutes: 5 },
  longBreak: { label: "Long Break", key: "longBreak", defaultMinutes: 15 },
};

const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const { user } = useAuth();

  const getDurations = useCallback(
    () => ({
      work: (user?.preferences?.pomodoroLength ?? 25) * 60,
      shortBreak: (user?.preferences?.shortBreak ?? 5) * 60,
      longBreak: (user?.preferences?.longBreak ?? 15) * 60,
    }),
    [user?.preferences],
  );

  const [mode, setMode] = useState("work");
  const [secondsLeft, setSeconds] = useState(
    () => (user?.preferences?.pomodoroLength ?? 25) * 60,
  );
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [cycleCount, setCycle] = useState(0);
  const [selectedTask, setSelectedTask] = useState("");
  const [sessionLog, setSessionLog] = useState([]);
  const [notifOn, setNotifOn] = useState(false);

  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const roundRef = useRef(round);

  // Keep refs in sync so callbacks always see latest values
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifOn(true);
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }, []);

  const notifyUser = useCallback((title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, []);

  // Advance to next mode — uses refs so it's stable across re-renders
  const advance = useCallback(() => {
    const durations = getDurations();
    playBeep();
    const currentMode = modeRef.current;
    const currentRound = roundRef.current;

    if (currentMode === "work") {
      // Log completed session
      setSessionLog((l) => [
        { time: new Date(), duration: Math.round(durations.work / 60) },
        ...l.slice(0, 9),
      ]);

      const newRound = currentRound + 1;
      setRound(newRound);
      if (newRound % 4 === 1) {
        setCycle((c) => c + 1);
        setMode("longBreak");
        setSeconds(durations.longBreak);
        notifyUser(
          "TaskFlow — Long Break! 🎉",
          "You completed 4 pomodoros. Take 15 minutes.",
        );
      } else {
        setMode("shortBreak");
        setSeconds(durations.shortBreak);
        notifyUser(
          "TaskFlow — Short Break! ☕",
          "Focus session done. Take 5 minutes.",
        );
      }
    } else {
      setMode("work");
      setSeconds(durations.work);
      notifyUser("TaskFlow — Back to Work! 🎯", "Break over. Time to focus.");
    }
    setRunning(false);
  }, [getDurations, playBeep, notifyUser]);

  // Main interval — survives page navigation because context lives above Layout
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            advance();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, advance]);

  // Update browser tab title only when running
  useEffect(() => {
    if (running) {
      const mins = Math.floor(secondsLeft / 60)
        .toString()
        .padStart(2, "0");
      const secs = (secondsLeft % 60).toString().padStart(2, "0");
      document.title = `${mins}:${secs} — ${POMODORO_MODES[mode].label} | TaskFlow`;
    } else {
      document.title = "TaskFlow";
    }
    return () => {
      document.title = "TaskFlow";
    };
  }, [running, secondsLeft, mode]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setSeconds(getDurations()[mode]);
  };
  const skip = () => {
    setRunning(false);
    advance();
  };
  const switchMode = (newMode) => {
    setRunning(false);
    setMode(newMode);
    setSeconds(getDurations()[newMode]);
  };
  const toggleNotif = async () => {
    if (!notifOn) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") setNotifOn(true);
      return perm === "granted";
    } else {
      setNotifOn(false);
      return false;
    }
  };

  const durations = getDurations();
  const totalSeconds = durations[mode];
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const value = {
    mode,
    secondsLeft,
    running,
    round,
    cycleCount,
    progress,
    minutes,
    seconds,
    durations,
    selectedTask,
    setSelectedTask,
    sessionLog,
    setSessionLog,
    notifOn,
    toggleNotif,
    start,
    pause,
    reset,
    skip,
    switchMode,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
