"use client";

import { useState, useEffect, useCallback } from "react";

export function useTypewriter(text: string, speed: number = 20) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }

    if (skipped) {
      setDisplayText(text);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayText("");
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      if (idx >= text.length) {
        setDisplayText(text);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayText(text.slice(0, idx));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, skipped]);

  const skip = useCallback(() => {
    setSkipped(true);
    setDisplayText(text);
    setIsTyping(false);
  }, [text]);

  return { displayText, isTyping, skip };
}
