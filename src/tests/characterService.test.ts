import { describe, it, expect } from 'vitest';
import { characterService } from '../services/characterService';

describe('Character Service Client Operations', () => {
  it('loads characters list for project with role sorting', async () => {
    const chars = await characterService.getCharacters('demo-novel-1');
    expect(chars.length).toBeGreaterThanOrEqual(3);
    expect(chars[0].role).toBe('protagonist');
    expect(chars[1].role).toBe('antagonist');
    expect(chars[2].role).toBe('supporting');
  });

  it('creates, reads, updates, and deletes a character', async () => {
    const newChar = await characterService.createCharacter({
      project_id: 'demo-novel-1',
      name: 'Inspector Thomas Finch',
      nickname: 'Finch',
      role: 'supporting',
      age: '45',
      description: 'Senior municipal inspector with tired eyes.',
      personality: 'Gruff, thorough, law-abiding.',
      tags: 'police,investigator',
      custom_fields_json: JSON.stringify([{ key: 'Badge No', value: '4481' }]),
    });

    expect(newChar.id).toBeDefined();
    expect(newChar.name).toBe('Inspector Thomas Finch');
    expect(newChar.role).toBe('supporting');

    const fetched = await characterService.getCharacter(newChar.id);
    expect(fetched.name).toBe('Inspector Thomas Finch');
    expect(fetched.description).toContain('Senior municipal inspector');

    const updated = await characterService.updateCharacter(newChar.id, {
      name: 'Chief Inspector Thomas Finch',
      age: '46',
    });
    expect(updated.name).toBe('Chief Inspector Thomas Finch');
    expect(updated.age).toBe('46');

    const deleted = await characterService.deleteCharacter(newChar.id);
    expect(deleted).toBe(true);

    const afterList = await characterService.getCharacters('demo-novel-1');
    expect(afterList.some((c) => c.id === newChar.id)).toBe(false);
  });

  it('creates and manages relationships with character names', async () => {
    const rels = await characterService.getRelationships('demo-novel-1');
    expect(rels.length).toBeGreaterThanOrEqual(2);
    expect(rels[0].character_a_name).toBeDefined();
    expect(rels[0].character_b_name).toBeDefined();

    const created = await characterService.createRelationship({
      project_id: 'demo-novel-1',
      character_a_id: 'char-2',
      character_b_id: 'char-3',
      relation_type: 'Distrustful Acquaintance',
      description: 'Clara refused to sign Blackwood’s falsified casualty manifest.',
    });

    expect(created.id).toBeDefined();
    expect(created.relation_type).toBe('Distrustful Acquaintance');
    expect(created.character_a_name).toBe('Lord Julian Blackwood');
    expect(created.character_b_name).toBe('Dr. Clara Sutton');

    const updatedRel = await characterService.updateRelationship(created.id, {
      relation_type: 'Open Hostility',
    });
    expect(updatedRel.relation_type).toBe('Open Hostility');

    const deleted = await characterService.deleteRelationship(created.id);
    expect(deleted).toBe(true);
  });
});
