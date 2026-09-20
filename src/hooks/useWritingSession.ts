import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import type { WritingSession } from '../types/phase5';

interface UseWritingSessionOptions {
  projectId?: string | null;
  nodeId?: string | null;
  currentWordCount?: number;
}

export function useWritingSession({
  projectId,
  nodeId,
  currentWordCount = 0,
}: UseWritingSessionOptions) {
  const [activeSession, setActiveSession] = useState<WritingSession | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [sessionWords, setSessionWords] = useState<number>(0);

  const initialWordCountRef = useRef<number>(currentWordCount);
  const activeSessionRef = useRef<WritingSession | null>(null);
  const durationRef = useRef<number>(0);
  const wordsWrittenRef = useRef<number>(0);

  // Keep refs updated
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    durationRef.current = sessionDuration;
  }, [sessionDuration]);

  // Track words written delta during the session
  useEffect(() => {
    if (activeSession) {
      const delta = Math.max(0, currentWordCount - initialWordCountRef.current);
      setSessionWords(delta);
      wordsWrittenRef.current = delta;
    }
  }, [currentWordCount, activeSession]);

  // Start session on mount/project/node change
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    initialWordCountRef.current = currentWordCount;
    setSessionDuration(0);
    setSessionWords(0);
    durationRef.current = 0;
    wordsWrittenRef.current = 0;

    sessionService
      .startWritingSession(projectId, nodeId || undefined)
      .then((sess) => {
        if (isMounted) {
          setActiveSession(sess);
        }
      })
      .catch((err) => {
        console.warn('Failed to start writing session:', err);
      });

    // Duration timer interval
    const timer = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
      const sess = activeSessionRef.current;
      if (sess) {
        sessionService
          .endWritingSession(sess.id, wordsWrittenRef.current, durationRef.current)
          .catch((err) => {
            console.warn('Failed to end writing session:', err);
          });
      }
    };
  }, [projectId, nodeId]);

  const endCurrentSession = useCallback(async () => {
    if (!activeSessionRef.current) return null;
    try {
      const ended = await sessionService.endWritingSession(
        activeSessionRef.current.id,
        wordsWrittenRef.current,
        durationRef.current
      );
      setActiveSession(null);
      return ended;
    } catch (err) {
      console.warn('Error ending session:', err);
      return null;
    }
  }, []);

  return {
    activeSession,
    sessionDuration,
    sessionWords,
    endCurrentSession,
  };
}
