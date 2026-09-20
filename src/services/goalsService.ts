import { invokeCommand } from './tauriIpc';
import type {
  CreateWritingGoalInput,
  UpdateWritingGoalInput,
  WritingGoal,
} from '../types/phase5';

export const goalsService = {
  async getWritingGoals(projectId: string): Promise<WritingGoal[]> {
    return invokeCommand<WritingGoal[]>('get_writing_goals', {
      project_id: projectId,
    });
  },

  async createWritingGoal(input: CreateWritingGoalInput): Promise<WritingGoal> {
    return invokeCommand<WritingGoal>('create_writing_goal', { input });
  },

  async updateWritingGoal(
    id: string,
    input: UpdateWritingGoalInput
  ): Promise<WritingGoal> {
    return invokeCommand<WritingGoal>('update_writing_goal', { id, input });
  },

  async deleteWritingGoal(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_writing_goal', { id });
  },
};
