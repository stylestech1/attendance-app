"use client";
import { useEffect, useRef } from "react";

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/audio/notify.mp3");
    audioRef.current.volume = 1;

    const unlock = () => {
      audioRef.current?.play().catch(() => {});
      document.removeEventListener("click", unlock);
    };

    document.addEventListener("click", unlock);
  }, []);

  const play = () => {
    audioRef.current?.play().catch(() => {});
  };

  return play;
};
