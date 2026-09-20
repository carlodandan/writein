import { describe, it, expect } from 'vitest';
import { versionService } from '../services/versionService';

describe('Version History & Snapshots Client Service', () => {
  const testNodeId = 'test-node-snap';
  const testDocId = 'test-doc-snap';

  it('creates and lists document snapshots', async () => {
    const snapshot1 = await versionService.createDocumentSnapshot(
      testDocId,
      testNodeId,
      'First draft of the chapter.',
      5
    );

    expect(snapshot1).toBeDefined();
    expect(snapshot1.version_num).toBe(1);
    expect(snapshot1.snapshot_text).toBe('First draft of the chapter.');
    expect(snapshot1.word_count).toBe(5);

    const snapshot2 = await versionService.createDocumentSnapshot(
      testDocId,
      testNodeId,
      'Second revised draft of the chapter with more details.',
      9
    );

    expect(snapshot2.version_num).toBe(2);

    // List snapshots
    const list = await versionService.listDocumentVersions(testNodeId);
    expect(list.length).toBeGreaterThanOrEqual(2);
    // Newest first
    expect(list[0].version_num).toBe(2);
  });

  it('retrieves full content for a snapshot', async () => {
    const snapshot = await versionService.createDocumentSnapshot(
      testDocId,
      testNodeId,
      'A lonely beacon on the hill.',
      6
    );

    const retrieved = await versionService.getDocumentVersion(snapshot.id);
    expect(retrieved.id).toBe(snapshot.id);
    expect(retrieved.snapshot_text).toBe('A lonely beacon on the hill.');
  });

  it('restores a snapshot into the document and deletes it', async () => {
    const snapshot = await versionService.createDocumentSnapshot(
      testDocId,
      testNodeId,
      'Restored version text.',
      3
    );

    const restored = await versionService.restoreDocumentVersion(testNodeId, snapshot.id);
    expect(restored.content_text).toBe('Restored version text.');
    expect(restored.word_count).toBe(3);

    const deleted = await versionService.deleteDocumentVersion(snapshot.id);
    expect(deleted).toBe(true);
  });
});
