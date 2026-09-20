import { describe, it, expect } from 'vitest';
import { sessionService } from '../services/sessionService';

describe('Writing Sessions Client Service', () => {
  const testProjectId = 'demo-novel-1';

  it('starts and ends a writing session with word and duration tracking', async () => {
    const session = await sessionService.startWritingSession(testProjectId, 'scene-1');
    expect(session).toBeDefined();
    expect(session.project_id).toBe(testProjectId);
    expect(session.node_id).toBe('scene-1');
    expect(session.ended_at).toBeNull();
    expect(session.words_written).toBe(0);

    const ended = await sessionService.endWritingSession(session.id, 250, 900);
    expect(ended.ended_at).not.toBeNull();
    expect(ended.words_written).toBe(250);
    expect(ended.duration_seconds).toBe(900);
  });

  it('lists writing sessions for a project', async () => {
    const sessions = await sessionService.listWritingSessions(testProjectId, 10);
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions[0].project_id).toBe(testProjectId);
  });

  it('retrieves aggregated session statistics', async () => {
    const stats = await sessionService.getSessionStats(testProjectId);
    expect(stats).toBeDefined();
    expect(typeof stats.today_words).toBe('number');
    expect(typeof stats.week_words).toBe('number');
    expect(typeof stats.all_time_words).toBe('number');
    expect(typeof stats.today_sessions).toBe('number');
  });
});
