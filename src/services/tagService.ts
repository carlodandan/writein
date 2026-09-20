import { invokeCommand } from './tauriIpc';
import { CreateTagInput, SetEntityTagsInput, Tag, TagWithUsageCount } from '../types/tag';

export const tagService = {
  async getTags(projectId: string): Promise<TagWithUsageCount[]> {
    return invokeCommand<TagWithUsageCount[]>('get_tags', { projectId });
  },

  async createTag(input: CreateTagInput): Promise<Tag> {
    return invokeCommand<Tag>('create_tag', { input });
  },

  async renameTag(id: string, newName: string): Promise<Tag> {
    return invokeCommand<Tag>('rename_tag', { id, newName });
  },

  async deleteTag(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_tag', { id });
  },

  async getEntityTags(
    entityType: string,
    entityId: string,
  ): Promise<Tag[]> {
    return invokeCommand<Tag[]>('get_entity_tags', {
      entityType,
      entityId,
    });
  },

  async updateTag(id: string, newName: string): Promise<Tag> {
    return invokeCommand<Tag>('update_tag', { id, newName });
  },

  async assignTag(
    projectId: string,
    entityType: string,
    entityId: string,
    tagName: string,
  ): Promise<Tag> {
    return invokeCommand<Tag>('assign_tag', {
      projectId,
      entityType,
      entityId,
      tagName,
    });
  },

  async removeTag(
    entityType: string,
    entityId: string,
    tagId: string,
  ): Promise<boolean> {
    return invokeCommand<boolean>('remove_tag', {
      entityType,
      entityId,
      tagId,
    });
  },

  async setEntityTags(input: SetEntityTagsInput): Promise<Tag[]> {
    return invokeCommand<Tag[]>('set_entity_tags', { input });
  },
};
