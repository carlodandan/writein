import { invokeCommand } from './tauriIpc';
import {
  Attachment,
  CreateAttachmentInput,
  RelatedContentResponse,
  SaveAttachmentPayload,
  UpdateAttachmentInput,
} from '../types/attachment';

export const attachmentService = {
  async getAttachments(
    projectId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<Attachment[]> {
    return invokeCommand<Attachment[]>('get_attachments', {
      project_id: projectId,
      entity_type: entityType || null,
      entity_id: entityId || null,
    });
  },

  async createAttachment(input: CreateAttachmentInput): Promise<Attachment> {
    return invokeCommand<Attachment>('create_attachment', { input });
  },

  async saveAttachmentFile(payload: SaveAttachmentPayload): Promise<Attachment> {
    return invokeCommand<Attachment>('save_attachment_file', { payload });
  },

  async updateAttachment(
    id: string,
    input: UpdateAttachmentInput,
  ): Promise<Attachment> {
    return invokeCommand<Attachment>('update_attachment', { id, input });
  },

  async deleteAttachment(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_attachment', { id });
  },

  async openAttachment(id: string): Promise<boolean> {
    return invokeCommand<boolean>('open_attachment', { id });
  },

  async revealAttachmentFolder(id: string): Promise<boolean> {
    return invokeCommand<boolean>('reveal_attachment_folder', { id });
  },

  async getRelatedContent(
    projectId: string,
    entityType: string,
    entityId: string,
  ): Promise<RelatedContentResponse> {
    return invokeCommand<RelatedContentResponse>('get_related_content', {
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
    });
  },
};
