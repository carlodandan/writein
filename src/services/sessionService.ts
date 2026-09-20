import { invokeCommand } from './tauriIpc';
import type { SessionStats, WritingSession } from '../types/phase5';

export const sessionService = {
  async startWritingSession(
    projectId: string,
    nodeId?: string
  ): Promise<WritingSession> {
    return invokeCommand<WritingSession>('start_writing_session', {
      projectId,
      nodeId,
    });
  },

  async endWritingSession(
    sessionId: string,
    wordsWritten: number,
    durationSeconds: number
  ): Promise<WritingSession> {
    return invokeCommand<WritingSession>('end_writing_session', {
      sessionId,
      wordsWritten,
      durationSeconds,
    });
  },

  async listWritingSessions(
    projectId: string,
    limit?: number
  ): Promise<WritingSession[]> {
    return invokeCommand<WritingSession[]>('list_writing_sessions', {
      projectId,
      limit,
    });
  },

  async getSessionStats(projectId: string): Promise<SessionStats> {
    return invokeCommand<SessionStats>('get_session_stats', {
      projectId,
    });
  },
};
