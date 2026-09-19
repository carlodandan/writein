import { invokeCommand } from './tauriIpc';
import {
  CreateTimelineEventInput,
  TimelineEvent,
  TimelineFilter,
  UpdateTimelineEventInput,
} from '../types/timeline';

export const timelineService = {
  async getEvents(
    projectId: string,
    filter?: TimelineFilter,
  ): Promise<TimelineEvent[]> {
    return invokeCommand<TimelineEvent[]>('get_timeline_events', {
      project_id: projectId,
      filter: filter || null,
    });
  },

  async getEvent(id: string): Promise<TimelineEvent> {
    return invokeCommand<TimelineEvent>('get_timeline_event', { id });
  },

  async createEvent(input: CreateTimelineEventInput): Promise<TimelineEvent> {
    return invokeCommand<TimelineEvent>('create_timeline_event', { input });
  },

  async updateEvent(
    id: string,
    input: UpdateTimelineEventInput,
  ): Promise<TimelineEvent> {
    return invokeCommand<TimelineEvent>('update_timeline_event', { id, input });
  },

  async deleteEvent(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_timeline_event', { id });
  },
};
