import { invokeCommand } from './tauriIpc';
import type { SessionStats, WritingSession } from '../types/phase5';

export const sessionService = {
  async startWritingSession(
    projectId: string,
    nodeId?: string
  ): Promise<WritingSession> {
    return invokeCommand<WritingSession>('start_writing_session', {
      project_id: projectId,
      node_id: nodeId,
    });
  },

  async endWritingSession(
    sessionId: string,
    wordsWritten: number,
    durationSeconds: number
  ): Promise<WritingSession> {
    return invokeCommand<WritingSession>('end_writing_session', {
      session_id: sessionId,
      words_written: wordsWritten,
      duration_seconds: durationSeconds,
    });
  },

  async listWritingSessions(
    projectId: string,
    limit?: number
  ): Promise<WritingSession[]> {
    return invokeCommand<WritingSession[]>('list_writing_sessions', {
      project_id: projectId,
      limit,
    });
  },

  async getSessionStats(projectId: string): Promise<SessionStats> {
    return invokeCommand<SessionStats>('get_session_stats', {
      project_id: projectId,
    });
  },
};
