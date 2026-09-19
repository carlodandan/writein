import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * Checks if the current environment is running inside Tauri.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// In-memory mock store for browser development and unit testing outside Tauri
const mockStore: {
  projects: any[];
  nodes: any[];
  documents: Record<string, any>;
  characters: any[];
  relationships: any[];
  locations: any[];
  worldbuilding: any[];
  timeline: any[];
  notes: any[];
  tags: any[];
  entity_tags: any[];
  attachments: any[];
} = {
  projects: [
    {
      id: 'demo-novel-1',
      title: 'The Silent Hour',
      subtitle: 'A Noir Mystery',
      author: 'Evelyn Sterling',
      description: 'A detective investigates a string of disappearances during the long winter of 1948.',
      genre: 'Mystery / Noir',
      status: 'writing',
      target_word_count: 80000,
      current_word_count: 350,
      cover_image: null,
      project_notes: 'Key clue revealed in chapter 6.',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
  ],
  nodes: [
    {
      id: 'part-1',
      project_id: 'demo-novel-1',
      parent_id: null,
      node_type: 'part',
      title: 'Part I: Whispers in the Fog',
      synopsis: 'The introduction to the city and the initial disappearance.',
      sort_order: 1,
      status: 'draft',
      word_count: 350,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
    {
      id: 'chap-1',
      project_id: 'demo-novel-1',
      parent_id: 'part-1',
      node_type: 'chapter',
      title: 'Chapter 01: The Pier at Midnight',
      synopsis: 'Detective Vance arrives at Pier 14 amidst heavy rain.',
      sort_order: 1,
      status: 'draft',
      word_count: 350,
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
    {
      id: 'scene-1',
      project_id: 'demo-novel-1',
      parent_id: 'chap-1',
      node_type: 'scene',
      title: 'Scene 01: Footsteps in the Salt',
      synopsis: 'Finding the abandoned pocket watch near the bollard.',
      sort_order: 1,
      status: 'draft',
      word_count: 350,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
    {
      id: 'chap-2',
      project_id: 'demo-novel-1',
      parent_id: 'part-1',
      node_type: 'chapter',
      title: 'Chapter 02: Coffee & Cigarettes',
      synopsis: 'Vance returns to his office to review the missing persons file.',
      sort_order: 2,
      status: 'draft',
      word_count: 0,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
  ],
  documents: {
    'scene-1': {
      id: 'doc-scene-1',
      node_id: 'scene-1',
      content_json: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'The rain had finally stopped, leaving the pier slick as black glass. Somewhere out in the harbor, a foghorn groaned like a dying beast.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Vance struck a sulfur match against the wooden piling, cupping the flame against the salt wind. In the pale orange glow, he saw the glint of brass. A pocket watch, half-buried in wet gravel.',
              },
            ],
          },
        ],
      }),
      content_text:
        'The rain had finally stopped, leaving the pier slick as black glass. Somewhere out in the harbor, a foghorn groaned like a dying beast.\n\nVance struck a sulfur match against the wooden piling, cupping the flame against the salt wind. In the pale orange glow, he saw the glint of brass. A pocket watch, half-buried in wet gravel.',
      word_count: 59,
      character_count: 350,
      last_edited_at: new Date().toISOString(),
    },
  },
  characters: [
    {
      id: 'char-1',
      project_id: 'demo-novel-1',
      name: 'Vance Marlowe',
      nickname: 'Vance',
      role: 'protagonist',
      age: '38',
      description: 'A quiet, observant private investigator nursing a persistent grief.',
      personality: 'Methodical, brooding, stubbornly loyal once trust is earned.',
      appearance: 'Tall, angular features, permanently creased wool trench coat, steel-grey eyes.',
      background: 'Former municipal police detective who resigned after an internal cover-up.',
      motivations: 'Uncover the truth behind the pier disappearances to clear his former partner.',
      fears: 'Failing another person who placed their faith in him.',
      goals: 'Retrieve the missing ledger before the harbormaster leaves port.',
      notes: 'Carries a silver pocket flask and an engraved brass lighter.',
      avatar_path: null,
      tags: 'detective,noir,lead',
      custom_fields_json: JSON.stringify([
        { key: 'Signature Item', value: 'Engraved Zippo' },
        { key: 'Flaw', value: 'Insomnia' },
      ]),
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'char-2',
      project_id: 'demo-novel-1',
      name: 'Lord Julian Blackwood',
      nickname: 'The Iron Baron',
      role: 'antagonist',
      age: '54',
      description: 'Industrial tycoon controlling the eastern shipping docks.',
      personality: 'Ruthless, calculating, speaks with polite razor-sharp venom.',
      appearance: 'Silver-pommeled walking stick, bespoke charcoal three-piece suit, manicured goatee.',
      background: 'Built an empire on wartime contracts and coerced harbor leases.',
      motivations: 'Consolidate complete maritime monopoly across the North Bay.',
      fears: 'Exposure of the illicit offshore salvage operations.',
      goals: 'Silence anyone asking questions about Pier 14.',
      notes: 'Never meets anyone without two armed bodyguards within earshot.',
      avatar_path: null,
      tags: 'villain,shipping,wealth',
      custom_fields_json: JSON.stringify([
        { key: 'Influence', value: 'High Council Seat' },
      ]),
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'char-3',
      project_id: 'demo-novel-1',
      name: 'Dr. Clara Sutton',
      nickname: 'Doc',
      role: 'supporting',
      age: '41',
      description: 'County coroner and Vance’s closest confidante.',
      personality: 'Sharp-witted, dry humor, unflinching in the face of grim reality.',
      appearance: 'Round wire spectacles, ink-stained fingertips, dark hair pinned tightly.',
      background: 'Trained at the capital medical faculty; returned home to run the city morgue.',
      motivations: 'Give a voice to victims whose causes of death were suspiciously altered.',
      fears: 'Losing her medical license before publishing her findings.',
      goals: 'Provide Vance with accurate autopsy reports discreetly.',
      notes: 'Drinks black tea with clover honey.',
      avatar_path: null,
      tags: 'ally,medical,coroner',
      custom_fields_json: JSON.stringify([
        { key: 'Allies', value: 'City Hospital Staff' },
      ]),
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  relationships: [
    {
      id: 'rel-1',
      project_id: 'demo-novel-1',
      character_a_id: 'char-1',
      character_b_id: 'char-2',
      relation_type: 'Nemesis / Rival',
      description: 'Vance suspects Blackwood of orchestrating his partner’s demise.',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'rel-2',
      project_id: 'demo-novel-1',
      character_a_id: 'char-1',
      character_b_id: 'char-3',
      relation_type: 'Trusted Confidante',
      description: 'Clara provides Vance with unauthorized coroner reports in exchange for contraband tea.',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ],
  locations: [
    {
      id: 'loc-1',
      project_id: 'demo-novel-1',
      name: 'Pier 14 & The Fog Docks',
      location_type: 'Maritime Harbor',
      description: 'A decaying commercial pier lined with weathered wooden warehouses and creaking cranes.',
      appearance: 'Black wet timbers, low yellow lamplight cutting through dense ocean mist.',
      atmosphere: 'Cold, brine-choked wind, distant clanging buoy bell.',
      inhabitants: 'Night dockworkers, smugglers, stray sea gulls.',
      notes: 'Crime scene of the opening chapter. Tide rolls in high at 02:00.',
      map_path: null,
      tags: 'harbor,noir,crime-scene',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'loc-2',
      project_id: 'demo-novel-1',
      name: 'Marlowe Investigations (2nd Floor)',
      location_type: 'Office',
      description: 'A cramped two-room detective office above an all-night bakery.',
      appearance: 'Frosted glass door, Venetian blinds casting ribbed shadows, stacks of yellowed case files.',
      atmosphere: 'Smells of chicory coffee, tobacco smoke, and fresh morning sourdough.',
      inhabitants: 'Vance Marlowe.',
      notes: 'Safe behind the painting of the harbor contains backup cash and case notes.',
      map_path: null,
      tags: 'office,sanctuary,vance',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  worldbuilding: [
    {
      id: 'wb-1',
      project_id: 'demo-novel-1',
      category: 'History',
      title: 'The Great Harbor Strike of 1937',
      content: 'Eleven years prior to the novel, dockworkers paralyzed the city for forty days. The standoff ended when Blackwood private guards breached the barricades, cementing his hold on the municipal port authority.',
      tags: 'history,politics,strike',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wb-2',
      project_id: 'demo-novel-1',
      category: 'Factions',
      title: 'The Port Constabulary & Maritime Watch',
      content: 'Nominally responsible for harbor safety, the constabulary is deeply compromised by Blackwood shipping kickbacks. Officers look the other way when night barges unload without manifest inspections.',
      tags: 'police,factions,corruption',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wb-3',
      project_id: 'demo-novel-1',
      category: 'Lore & Rules',
      title: 'The Salt Curfew Ordinance',
      content: 'City statute enacted during the coastal fever epidemic. All private skiffs and unlicensed watercraft must be moored by 21:00 or risk immediate confiscation by the harbormaster.',
      tags: 'law,curfew,harbor',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  timeline: [
    {
      id: 'tl-1',
      project_id: 'demo-novel-1',
      title: 'The St. Jude Bell Incident',
      event_date: '1948-10-12',
      date_value: '1948.10.12',
      date_label: 'Autumn 1948 — Oct 12',
      time_value: 'Midnight',
      order_index: 1,
      description: 'The ancient belfry rings thirteen times without a ringer present in the tower.',
      location_id: 'loc-1',
      location_name: 'Pier 14 & The Fog Docks',
      importance: 'high',
      related_chapter_id: 'chap-1',
      chapter_title: 'Chapter 01: The Pier at Midnight',
      character_ids: ['char-1'],
      character_names: ['Vance Marlowe'],
      tags: 'mystery,omen',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tl-2',
      project_id: 'demo-novel-1',
      title: 'Discovery of the Brass Watch',
      event_date: '1948-10-13',
      date_value: '1948.10.13',
      date_label: 'Three days after the fog rolled in',
      time_value: '02:15 AM',
      order_index: 2,
      description: 'Vance uncovers the pocket watch on the wet pier timbers.',
      location_id: 'loc-1',
      location_name: 'Pier 14 & The Fog Docks',
      importance: 'critical',
      related_chapter_id: 'scene-1',
      chapter_title: 'Scene 01: Footsteps in the Salt',
      character_ids: ['char-1', 'char-2'],
      character_names: ['Vance Marlowe', 'Lord Julian Blackwood'],
      tags: 'clue,pier,watch',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  notes: [
    {
      id: 'note-1',
      project_id: 'demo-novel-1',
      category: 'Plot',
      title: 'The Watch Mechanism Clue',
      content: 'The pocket watch was halted at 11:42 because of seawater intrusion. Only two watchmakers in the province use beryllium balance wheels.',
      tags: 'clue,revision',
      archived_at: null,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'note-2',
      project_id: 'demo-novel-1',
      category: 'Dialogue',
      title: 'Clara’s Morgue Banter',
      content: '"You smell like harbor silt and stubbornness, Vance. Sit down before you bleed on my clean slate."',
      tags: 'dialogue,clara',
      archived_at: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  tags: [
    { id: 'tag-1', project_id: 'demo-novel-1', name: 'clue', color: '#D97706', usage_count: 2 },
    { id: 'tag-2', project_id: 'demo-novel-1', name: 'noir', color: '#4B5563', usage_count: 1 },
    { id: 'tag-3', project_id: 'demo-novel-1', name: 'dialogue', color: '#2563EB', usage_count: 1 },
  ],
  entity_tags: [
    { id: 'et-1', tag_id: 'tag-1', entity_type: 'timeline', entity_id: 'tl-2' },
    { id: 'et-2', tag_id: 'tag-1', entity_type: 'note', entity_id: 'note-1' },
    { id: 'et-3', tag_id: 'tag-3', entity_type: 'note', entity_id: 'note-2' },
  ],
  attachments: [
    {
      id: 'att-1',
      project_id: 'demo-novel-1',
      file_name: 'harbor_map_1948.png',
      file_path: 'attachments/harbor_map_1948.png',
      file_type: 'image/png',
      file_size: 245000,
      description: 'Vintage navigation chart of the eastern harbor basins and buoy channels.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
};

/**
 * Type-safe IPC invoke with browser fallback.
 */
export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    try {
      return await tauriInvoke<T>(cmd, args);
    } catch (err: any) {
      console.error(`[Tauri IPC Error] ${cmd}:`, err);
      throw new Error(typeof err === 'string' ? err : err?.message || 'IPC Command Failed');
    }
  }

  // Browser / Headless fallback simulation
  console.warn(`[Tauri IPC Simulation] Falling back for: ${cmd}`, args);
  await new Promise((resolve) => setTimeout(resolve, 30));

  switch (cmd) {
    case 'get_projects':
      return [...mockStore.projects] as unknown as T;

    case 'get_project': {
      const p = mockStore.projects.find((item) => item.id === args?.id);
      if (!p) throw new Error(`Project ${args?.id} not found`);
      return { ...p } as unknown as T;
    }

    case 'create_project': {
      const input = args?.input as any;
      const newProj = {
        id: 'proj-' + Math.random().toString(36).substring(2, 9),
        title: input.title,
        subtitle: input.subtitle || null,
        author: input.author || null,
        description: input.description || null,
        genre: input.genre || null,
        status: 'idea',
        target_word_count: input.target_word_count || 50000,
        current_word_count: 0,
        cover_image: null,
        project_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
      };
      mockStore.projects.unshift(newProj);
      return newProj as unknown as T;
    }

    case 'update_project': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.projects.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Project ${id} not found`);
      mockStore.projects[idx] = {
        ...mockStore.projects[idx],
        ...input,
        updated_at: new Date().toISOString(),
      };
      return mockStore.projects[idx] as unknown as T;
    }

    case 'delete_project': {
      const id = args?.id as string;
      mockStore.projects = mockStore.projects.filter((p) => p.id !== id);
      return undefined as unknown as T;
    }

    case 'get_project_summary': {
      const id = args?.id as string;
      const p = mockStore.projects.find((item) => item.id === id);
      if (!p) throw new Error(`Project ${id} not found`);
      const nodes = mockStore.nodes.filter((n) => n.project_id === id);
      const chapters = nodes.filter((n) => n.node_type === 'chapter').length;
      const scenes = nodes.filter((n) => n.node_type === 'scene').length;
      return {
        project: p,
        chapter_count: chapters,
        scene_count: scenes,
        character_count: 7,
        location_count: 4,
        note_count: 12,
        last_edited_chapter_title: 'Chapter 01: The Pier at Midnight',
      } as unknown as T;
    }

    case 'get_manuscript_tree': {
      const projectId = args?.project_id as string;
      const list = mockStore.nodes
        .filter((n) => n.project_id === projectId && !n.archived_at)
        .sort((a, b) => a.sort_order - b.sort_order);
      return [...list] as unknown as T;
    }

    case 'get_manuscript_node': {
      const id = args?.id as string;
      const node = mockStore.nodes.find((n) => n.id === id);
      if (!node) throw new Error(`Node ${id} not found`);
      return { ...node } as unknown as T;
    }

    case 'create_manuscript_node': {
      const input = args?.input as any;
      const siblings = mockStore.nodes.filter(
        (n) => n.project_id === input.project_id && n.parent_id === (input.parent_id || null)
      );
      const maxSort = siblings.reduce((max, n) => Math.max(max, n.sort_order || 0), 0);
      const newNode = {
        id: 'node-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        parent_id: input.parent_id || null,
        node_type: input.node_type,
        title: input.title,
        synopsis: input.synopsis || null,
        sort_order: maxSort + 1,
        status: 'draft',
        word_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
      };
      mockStore.nodes.push(newNode);
      mockStore.documents[newNode.id] = {
        id: 'doc-' + newNode.id,
        node_id: newNode.id,
        content_json: '',
        content_text: '',
        word_count: 0,
        character_count: 0,
        last_edited_at: new Date().toISOString(),
      };
      return newNode as unknown as T;
    }

    case 'update_manuscript_node': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.nodes.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error(`Node ${id} not found`);
      mockStore.nodes[idx] = {
        ...mockStore.nodes[idx],
        ...input,
        updated_at: new Date().toISOString(),
      };
      return mockStore.nodes[idx] as unknown as T;
    }

    case 'delete_manuscript_node': {
      const id = args?.id as string;
      mockStore.nodes = mockStore.nodes.filter((n) => n.id !== id && n.parent_id !== id);
      delete mockStore.documents[id];
      return undefined as unknown as T;
    }

    case 'duplicate_manuscript_node': {
      const id = args?.id as string;
      const orig = mockStore.nodes.find((n) => n.id === id);
      if (!orig) throw new Error(`Node ${id} not found`);
      const copyNode = {
        ...orig,
        id: 'node-' + Math.random().toString(36).substring(2, 9),
        title: `${orig.title} (Copy)`,
        sort_order: orig.sort_order + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.nodes.push(copyNode);
      if (mockStore.documents[id]) {
        mockStore.documents[copyNode.id] = {
          ...mockStore.documents[id],
          id: 'doc-' + copyNode.id,
          node_id: copyNode.id,
          last_edited_at: new Date().toISOString(),
        };
      }
      return copyNode as unknown as T;
    }

    case 'move_manuscript_node': {
      const input = args?.input as any;
      const idx = mockStore.nodes.findIndex((n) => n.id === input.node_id);
      if (idx === -1) throw new Error(`Node ${input.node_id} not found`);
      mockStore.nodes[idx] = {
        ...mockStore.nodes[idx],
        parent_id: input.target_parent_id || null,
        sort_order: input.target_sort_order,
        updated_at: new Date().toISOString(),
      };
      return mockStore.nodes[idx] as unknown as T;
    }

    case 'reorder_manuscript_nodes': {
      const items = args?.items as any[];
      for (const item of items) {
        const n = mockStore.nodes.find((x) => x.id === item.id);
        if (n) {
          n.sort_order = item.sort_order;
          n.parent_id = item.parent_id || null;
        }
      }
      return undefined as unknown as T;
    }

    case 'get_document': {
      const nodeId = args?.node_id as string;
      if (!mockStore.documents[nodeId]) {
        mockStore.documents[nodeId] = {
          id: 'doc-' + nodeId,
          node_id: nodeId,
          content_json: '',
          content_text: '',
          word_count: 0,
          character_count: 0,
          last_edited_at: new Date().toISOString(),
        };
      }
      return { ...mockStore.documents[nodeId] } as unknown as T;
    }

    case 'save_document': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      mockStore.documents[input.node_id] = {
        id: 'doc-' + input.node_id,
        node_id: input.node_id,
        content_json: input.content_json,
        content_text: input.content_text,
        word_count: input.word_count,
        character_count: input.character_count,
        last_edited_at: now,
      };
      const n = mockStore.nodes.find((x) => x.id === input.node_id);
      if (n) {
        n.word_count = input.word_count;
        n.updated_at = now;
      }
      // Update project current_word_count
      const totalWords = mockStore.nodes
        .filter((x) => x.project_id === (n?.project_id || 'demo-novel-1'))
        .reduce((sum, x) => sum + (x.word_count || 0), 0);
      const proj = mockStore.projects.find((p) => p.id === (n?.project_id || 'demo-novel-1'));
      if (proj) {
        proj.current_word_count = totalWords;
        proj.updated_at = now;
      }
      return { ...mockStore.documents[input.node_id] } as unknown as T;
    }

    // Characters
    case 'get_characters': {
      const projId = args?.project_id as string;
      const list = mockStore.characters.filter((c) => c.project_id === projId);
      const roleOrder: Record<string, number> = {
        protagonist: 1,
        antagonist: 2,
        supporting: 3,
        minor: 4,
      };
      list.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));
      return [...list] as unknown as T;
    }

    case 'get_character': {
      const char = mockStore.characters.find((c) => c.id === args?.id);
      if (!char) throw new Error(`Character ${args?.id} not found`);
      return { ...char } as unknown as T;
    }

    case 'create_character': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const newChar = {
        id: 'char-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        name: input.name.trim(),
        nickname: input.nickname || null,
        role: input.role || 'supporting',
        age: input.age || null,
        description: input.description || null,
        personality: input.personality || null,
        appearance: input.appearance || null,
        background: input.background || null,
        motivations: input.motivations || null,
        fears: input.fears || null,
        goals: input.goals || null,
        notes: input.notes || null,
        avatar_path: input.avatar_path || null,
        tags: input.tags || null,
        custom_fields_json: input.custom_fields_json || null,
        created_at: now,
        updated_at: now,
      };
      mockStore.characters.push(newChar);
      return { ...newChar } as unknown as T;
    }

    case 'update_character': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.characters.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`Character ${id} not found`);
      const existing = mockStore.characters[idx];
      const updated = {
        ...existing,
        ...input,
        name: input.name ? input.name.trim() : existing.name,
        updated_at: new Date().toISOString(),
      };
      mockStore.characters[idx] = updated;
      return { ...updated } as unknown as T;
    }

    case 'delete_character': {
      const id = args?.id as string;
      mockStore.characters = mockStore.characters.filter((c) => c.id !== id);
      mockStore.relationships = mockStore.relationships.filter(
        (r) => r.character_a_id !== id && r.character_b_id !== id,
      );
      return true as unknown as T;
    }

    // Character Relationships
    case 'get_character_relationships': {
      const projId = args?.project_id as string;
      const rels = mockStore.relationships
        .filter((r) => r.project_id === projId)
        .map((r) => {
          const charA = mockStore.characters.find((c) => c.id === r.character_a_id);
          const charB = mockStore.characters.find((c) => c.id === r.character_b_id);
          return {
            ...r,
            character_a_name: charA?.name || 'Unknown',
            character_b_name: charB?.name || 'Unknown',
          };
        });
      return rels as unknown as T;
    }

    case 'create_character_relationship': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const newRel = {
        id: 'rel-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        character_a_id: input.character_a_id,
        character_b_id: input.character_b_id,
        relation_type: input.relation_type,
        description: input.description || null,
        created_at: now,
      };
      mockStore.relationships.push(newRel);
      const charA = mockStore.characters.find((c) => c.id === newRel.character_a_id);
      const charB = mockStore.characters.find((c) => c.id === newRel.character_b_id);
      return {
        ...newRel,
        character_a_name: charA?.name || 'Unknown',
        character_b_name: charB?.name || 'Unknown',
      } as unknown as T;
    }

    case 'update_character_relationship': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.relationships.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`Relationship ${id} not found`);
      const existing = mockStore.relationships[idx];
      const updated = {
        ...existing,
        ...input,
      };
      mockStore.relationships[idx] = updated;
      const charA = mockStore.characters.find((c) => c.id === updated.character_a_id);
      const charB = mockStore.characters.find((c) => c.id === updated.character_b_id);
      return {
        ...updated,
        character_a_name: charA?.name || 'Unknown',
        character_b_name: charB?.name || 'Unknown',
      } as unknown as T;
    }

    case 'delete_character_relationship': {
      const id = args?.id as string;
      mockStore.relationships = mockStore.relationships.filter((r) => r.id !== id);
      return true as unknown as T;
    }

    // Locations
    case 'get_locations': {
      const projId = args?.project_id as string;
      const list = mockStore.locations.filter((l) => l.project_id === projId);
      return [...list] as unknown as T;
    }

    case 'get_location': {
      const loc = mockStore.locations.find((l) => l.id === args?.id);
      if (!loc) throw new Error(`Location ${args?.id} not found`);
      return { ...loc } as unknown as T;
    }

    case 'create_location': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const newLoc = {
        id: 'loc-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        name: input.name.trim(),
        location_type: input.location_type || null,
        description: input.description || null,
        appearance: input.appearance || null,
        atmosphere: input.atmosphere || null,
        inhabitants: input.inhabitants || null,
        notes: input.notes || null,
        map_path: input.map_path || null,
        tags: input.tags || null,
        created_at: now,
        updated_at: now,
      };
      mockStore.locations.push(newLoc);
      return { ...newLoc } as unknown as T;
    }

    case 'update_location': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.locations.findIndex((l) => l.id === id);
      if (idx === -1) throw new Error(`Location ${id} not found`);
      const existing = mockStore.locations[idx];
      const updated = {
        ...existing,
        ...input,
        name: input.name ? input.name.trim() : existing.name,
        updated_at: new Date().toISOString(),
      };
      mockStore.locations[idx] = updated;
      return { ...updated } as unknown as T;
    }

    case 'delete_location': {
      const id = args?.id as string;
      mockStore.locations = mockStore.locations.filter((l) => l.id !== id);
      return true as unknown as T;
    }

    // Worldbuilding
    case 'get_worldbuilding_entries': {
      const projId = args?.project_id as string;
      const cat = args?.category as string | undefined;
      let list = mockStore.worldbuilding.filter((w) => w.project_id === projId);
      if (cat && cat !== 'All') {
        list = list.filter((w) => w.category.toLowerCase() === cat.toLowerCase());
      }
      return [...list] as unknown as T;
    }

    case 'get_worldbuilding_entry': {
      const entry = mockStore.worldbuilding.find((w) => w.id === args?.id);
      if (!entry) throw new Error(`Worldbuilding entry ${args?.id} not found`);
      return { ...entry } as unknown as T;
    }

    case 'create_worldbuilding_entry': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const newEntry = {
        id: 'wb-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        category: input.category || 'General',
        title: input.title.trim(),
        content: input.content || '',
        tags: input.tags || null,
        created_at: now,
        updated_at: now,
      };
      mockStore.worldbuilding.push(newEntry);
      return { ...newEntry } as unknown as T;
    }

    case 'update_worldbuilding_entry': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.worldbuilding.findIndex((w) => w.id === id);
      if (idx === -1) throw new Error(`Worldbuilding entry ${id} not found`);
      const existing = mockStore.worldbuilding[idx];
      const updated = {
        ...existing,
        ...input,
        title: input.title ? input.title.trim() : existing.title,
        updated_at: new Date().toISOString(),
      };
      mockStore.worldbuilding[idx] = updated;
      return { ...updated } as unknown as T;
    }

    case 'delete_worldbuilding_entry': {
      const id = args?.id as string;
      mockStore.worldbuilding = mockStore.worldbuilding.filter((w) => w.id !== id);
      return true as unknown as T;
    }

    // Timeline
    case 'get_timeline_events': {
      const projId = args?.project_id as string;
      const filter = args?.filter as any;
      let list = mockStore.timeline.filter((e) => e.project_id === projId);

      if (filter) {
        if (filter.character_id && filter.character_id !== 'all') {
          list = list.filter((e) => e.character_ids?.includes(filter.character_id));
        }
        if (filter.location_id && filter.location_id !== 'all') {
          list = list.filter((e) => e.location_id === filter.location_id);
        }
        if (filter.related_chapter_id && filter.related_chapter_id !== 'all') {
          list = list.filter((e) => e.related_chapter_id === filter.related_chapter_id);
        }
        if (filter.importance && filter.importance !== 'all') {
          list = list.filter((e) => e.importance === filter.importance);
        }
        if (filter.tag && filter.tag !== 'all') {
          list = list.filter((e) => e.tags?.toLowerCase().includes(filter.tag.toLowerCase()));
        }
        if (filter.search_query && filter.search_query.trim() !== '') {
          const q = filter.search_query.toLowerCase();
          list = list.filter(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              (e.description && e.description.toLowerCase().includes(q)) ||
              (e.date_label && e.date_label.toLowerCase().includes(q)),
          );
        }
      }

      const isDesc = filter?.sort_direction === 'desc';
      list.sort((a, b) => {
        const valA = a.date_value || '';
        const valB = b.date_value || '';
        return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      });

      return [...list] as unknown as T;
    }

    case 'get_timeline_event': {
      const ev = mockStore.timeline.find((e) => e.id === args?.id);
      if (!ev) throw new Error(`Timeline event ${args?.id} not found`);
      return { ...ev } as unknown as T;
    }

    case 'create_timeline_event': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const loc = mockStore.locations.find((l) => l.id === input.location_id);
      const node = mockStore.nodes.find((n) => n.id === input.related_chapter_id);
      const charIds = input.character_ids || [];
      const charNames = charIds.map(
        (cid: string) => mockStore.characters.find((c) => c.id === cid)?.name || 'Unknown',
      );

      const newEvent = {
        id: 'tl-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        title: input.title.trim(),
        event_date: input.event_date || null,
        date_value: input.date_value || input.event_date || '',
        date_label: input.date_label || input.event_date || 'Undated',
        time_value: input.time_value || null,
        order_index: input.order_index || 0,
        description: input.description || null,
        location_id: input.location_id || null,
        location_name: loc?.name || null,
        importance: input.importance || 'normal',
        related_chapter_id: input.related_chapter_id || null,
        chapter_title: node?.title || null,
        character_ids: charIds,
        character_names: charNames,
        tags: input.tags || null,
        created_at: now,
        updated_at: now,
      };
      mockStore.timeline.push(newEvent);
      return { ...newEvent } as unknown as T;
    }

    case 'update_timeline_event': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.timeline.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error(`Timeline event ${id} not found`);
      const existing = mockStore.timeline[idx];

      const charIds = input.character_ids !== undefined ? input.character_ids : existing.character_ids;
      const charNames = charIds.map(
        (cid: string) => mockStore.characters.find((c) => c.id === cid)?.name || 'Unknown',
      );
      const loc = input.location_id !== undefined
        ? mockStore.locations.find((l) => l.id === input.location_id)
        : null;
      const node = input.related_chapter_id !== undefined
        ? mockStore.nodes.find((n) => n.id === input.related_chapter_id)
        : null;

      const updated = {
        ...existing,
        ...input,
        character_ids: charIds,
        character_names: charNames,
        location_name: loc ? loc.name : existing.location_name,
        chapter_title: node ? node.title : existing.chapter_title,
        updated_at: new Date().toISOString(),
      };
      mockStore.timeline[idx] = updated;
      return { ...updated } as unknown as T;
    }

    case 'delete_timeline_event': {
      const id = args?.id as string;
      mockStore.timeline = mockStore.timeline.filter((e) => e.id !== id);
      return true as unknown as T;
    }

    // Notes
    case 'get_notes': {
      const projId = args?.project_id as string;
      const cat = args?.category as string | undefined;
      const includeArchived = args?.include_archived as boolean | undefined;

      let list = mockStore.notes.filter((n) => n.project_id === projId);
      if (!includeArchived && cat !== 'Archived') {
        list = list.filter((n) => !n.archived_at);
      }
      if (cat === 'Archived') {
        list = list.filter((n) => Boolean(n.archived_at));
      } else if (cat && cat !== 'All') {
        list = list.filter((n) => n.category.toLowerCase() === cat.toLowerCase());
      }
      return [...list] as unknown as T;
    }

    case 'get_note': {
      const note = mockStore.notes.find((n) => n.id === args?.id);
      if (!note) throw new Error(`Note ${args?.id} not found`);
      return { ...note } as unknown as T;
    }

    case 'create_note': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const newNote = {
        id: 'note-' + Math.random().toString(36).substring(2, 9),
        project_id: input.project_id,
        category: input.category || 'Ideas',
        title: input.title.trim(),
        content: input.content || '',
        tags: input.tags || null,
        archived_at: null,
        created_at: now,
        updated_at: now,
      };
      mockStore.notes.push(newNote);
      return { ...newNote } as unknown as T;
    }

    case 'update_note': {
      const id = args?.id as string;
      const input = args?.input as any;
      const idx = mockStore.notes.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error(`Note ${id} not found`);
      const existing = mockStore.notes[idx];
      const now = new Date().toISOString();

      let archived_at = existing.archived_at;
      if (input.archived === true) archived_at = now;
      if (input.archived === false) archived_at = null;

      const updated = {
        ...existing,
        ...input,
        archived_at,
        updated_at: now,
      };
      mockStore.notes[idx] = updated;
      return { ...updated } as unknown as T;
    }

    case 'toggle_archive_note': {
      const id = args?.id as string;
      const idx = mockStore.notes.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error(`Note ${id} not found`);
      const existing = mockStore.notes[idx];
      const now = new Date().toISOString();
      const updated = {
        ...existing,
        archived_at: existing.archived_at ? null : now,
        updated_at: now,
      };
      mockStore.notes[idx] = updated;
      return { ...updated } as unknown as T;
    }

    case 'delete_note': {
      const id = args?.id as string;
      mockStore.notes = mockStore.notes.filter((n) => n.id !== id);
      return true as unknown as T;
    }

    // Tags
    case 'get_tags': {
      const projId = args?.project_id as string;
      const list = mockStore.tags.filter((t) => t.project_id === projId);
      return [...list] as unknown as T;
    }

    case 'create_tag': {
      const input = args?.input as any;
      const cleanName = input.name.trim().replace(/^#/, '').toLowerCase();
      let tag = mockStore.tags.find(
        (t) => t.project_id === input.project_id && t.name.toLowerCase() === cleanName,
      );
      if (!tag) {
        tag = {
          id: 'tag-' + Math.random().toString(36).substring(2, 9),
          project_id: input.project_id,
          name: cleanName,
          color: input.color || '#D97706',
          usage_count: 0,
        };
        mockStore.tags.push(tag);
      }
      return { ...tag } as unknown as T;
    }

    case 'update_tag':
    case 'rename_tag': {
      const id = args?.id as string;
      const newName = ((args?.new_name || args?.name) as string).trim().replace(/^#/, '').toLowerCase();
      const idx = mockStore.tags.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error(`Tag ${id} not found`);
      mockStore.tags[idx].name = newName;
      return { ...mockStore.tags[idx] } as unknown as T;
    }

    case 'assign_tag': {
      const projId = args?.project_id as string;
      const etype = args?.entity_type as string;
      const eid = args?.entity_id as string;
      const tagName = ((args?.tag_name as string) || '').trim().replace(/^#/, '').toLowerCase();
      let tag = mockStore.tags.find((t) => t.project_id === projId && t.name.toLowerCase() === tagName);
      if (!tag) {
        tag = {
          id: 'tag-' + Math.random().toString(36).substring(2, 9),
          project_id: projId,
          name: tagName,
          color: '#D97706',
          usage_count: 0,
        };
        mockStore.tags.push(tag);
      }
      const existingLink = mockStore.entity_tags.find(
        (et) => et.tag_id === tag!.id && et.entity_type === etype && et.entity_id === eid,
      );
      if (!existingLink) {
        tag.usage_count = (tag.usage_count || 0) + 1;
        mockStore.entity_tags.push({
          id: 'et-' + Math.random().toString(36).substring(2, 9),
          tag_id: tag.id,
          entity_type: etype,
          entity_id: eid,
        });
      }
      return tag as unknown as T;
    }

    case 'remove_tag': {
      const etype = args?.entity_type as string;
      const eid = args?.entity_id as string;
      const tagId = args?.tag_id as string;
      const beforeCount = mockStore.entity_tags.length;
      mockStore.entity_tags = mockStore.entity_tags.filter(
        (et) => !(et.tag_id === tagId && et.entity_type === etype && et.entity_id === eid),
      );
      return (mockStore.entity_tags.length < beforeCount) as unknown as T;
    }

    case 'delete_tag': {
      const id = args?.id as string;
      mockStore.tags = mockStore.tags.filter((t) => t.id !== id);
      mockStore.entity_tags = mockStore.entity_tags.filter((et) => et.tag_id !== id);
      return true as unknown as T;
    }

    case 'get_entity_tags': {
      const etype = args?.entity_type as string;
      const eid = args?.entity_id as string;
      const linkedTagIds = mockStore.entity_tags
        .filter((et) => et.entity_type === etype && et.entity_id === eid)
        .map((et) => et.tag_id);
      const tags = mockStore.tags.filter((t) => linkedTagIds.includes(t.id));
      return tags as unknown as T;
    }

    case 'set_entity_tags': {
      const input = args?.input as any;
      mockStore.entity_tags = mockStore.entity_tags.filter(
        (et) => !(et.entity_type === input.entity_type && et.entity_id === input.entity_id),
      );

      const resultTags: any[] = [];
      for (const name of input.tag_names || []) {
        const clean = name.trim().replace(/^#/, '').toLowerCase();
        if (!clean) continue;
        let tag = mockStore.tags.find(
          (t) => t.project_id === input.project_id && t.name.toLowerCase() === clean,
        );
        if (!tag) {
          tag = {
            id: 'tag-' + Math.random().toString(36).substring(2, 9),
            project_id: input.project_id,
            name: clean,
            color: '#D97706',
            usage_count: 0,
          };
          mockStore.tags.push(tag);
        }
        tag.usage_count = (tag.usage_count || 0) + 1;
        mockStore.entity_tags.push({
          id: 'et-' + Math.random().toString(36).substring(2, 9),
          tag_id: tag.id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        });
        resultTags.push(tag);
      }
      return resultTags as unknown as T;
    }

    // Global Search
    case 'search_project':
    case 'global_search': {
      const projId = args?.project_id as string;
      const query = ((args?.query as string) || '').trim().toLowerCase();
      if (!query) {
        return { query: '', items: [], total_count: 0 } as unknown as T;
      }

      const items: any[] = [];

      // Manuscript
      for (const n of mockStore.nodes.filter((x) => x.project_id === projId)) {
        if (
          n.title.toLowerCase().includes(query) ||
          (n.synopsis && n.synopsis.toLowerCase().includes(query))
        ) {
          items.push({
            id: n.id,
            entity_type: 'manuscript',
            title: n.title,
            subtitle: `Manuscript • ${n.node_type}`,
            snippet: n.synopsis || null,
            target_tab: 'manuscript',
            target_id: n.id,
          });
        }
      }

      // Characters
      for (const c of mockStore.characters.filter((x) => x.project_id === projId)) {
        if (
          c.name.toLowerCase().includes(query) ||
          (c.nickname && c.nickname.toLowerCase().includes(query)) ||
          (c.description && c.description.toLowerCase().includes(query))
        ) {
          items.push({
            id: c.id,
            entity_type: 'character',
            title: c.name,
            subtitle: `Character • ${c.role}`,
            snippet: c.description || null,
            target_tab: 'characters',
            target_id: c.id,
          });
        }
      }

      // Locations
      for (const l of mockStore.locations.filter((x) => x.project_id === projId)) {
        if (
          l.name.toLowerCase().includes(query) ||
          (l.description && l.description.toLowerCase().includes(query)) ||
          (l.atmosphere && l.atmosphere.toLowerCase().includes(query))
        ) {
          items.push({
            id: l.id,
            entity_type: 'location',
            title: l.name,
            subtitle: `Location • ${l.location_type || 'Setting'}`,
            snippet: l.atmosphere || l.description || null,
            target_tab: 'locations',
            target_id: l.id,
          });
        }
      }

      // Worldbuilding
      for (const w of mockStore.worldbuilding.filter((x) => x.project_id === projId)) {
        if (
          w.title.toLowerCase().includes(query) ||
          (w.content && w.content.toLowerCase().includes(query))
        ) {
          items.push({
            id: w.id,
            entity_type: 'worldbuilding',
            title: w.title,
            subtitle: `Worldbuilding • ${w.category}`,
            snippet: w.content ? w.content.substring(0, 100) : null,
            target_tab: 'worldbuilding',
            target_id: w.id,
          });
        }
      }

      // Timeline
      for (const t of mockStore.timeline.filter((x) => x.project_id === projId)) {
        if (
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)) ||
          (t.date_label && t.date_label.toLowerCase().includes(query))
        ) {
          items.push({
            id: t.id,
            entity_type: 'timeline',
            title: t.title,
            subtitle: `Timeline • ${t.date_label || 'Date'}`,
            snippet: t.description || null,
            target_tab: 'timeline',
            target_id: t.id,
          });
        }
      }

      // Notes
      for (const nt of mockStore.notes.filter((x) => x.project_id === projId)) {
        if (
          nt.title.toLowerCase().includes(query) ||
          (nt.content && nt.content.toLowerCase().includes(query))
        ) {
          items.push({
            id: nt.id,
            entity_type: 'note',
            title: nt.title,
            subtitle: `Note • ${nt.category}`,
            snippet: nt.content ? nt.content.substring(0, 100) : null,
            target_tab: 'notes',
            target_id: nt.id,
          });
        }
      }

      return {
        query,
        items,
        total_count: items.length,
      } as unknown as T;
    }

    // Attachments & Cross-linking
    case 'get_attachments': {
      const projId = args?.project_id as string;
      const entityType = args?.entity_type as string | undefined;
      const entityId = args?.entity_id as string | undefined;

      let list = mockStore.attachments.filter((a) => a.project_id === projId);
      if (entityType && entityId) {
        list = list.filter((a) => a.entity_type === entityType && a.entity_id === entityId);
      }
      return [...list] as unknown as T;
    }

    case 'create_attachment': {
      const input = args?.input as any;
      const now = new Date().toISOString();
      const id = 'att-' + Math.random().toString(36).substring(2, 9);
      const newAtt = {
        id,
        project_id: input.project_id,
        file_name: input.file_name.trim(),
        file_path: input.file_path.trim(),
        relative_path: input.relative_path || `attachments/${id}/${input.file_name.trim()}`,
        file_type: input.file_type || 'document',
        mime_type: input.mime_type || null,
        file_size: input.file_size || 0,
        entity_type: input.entity_type || null,
        entity_id: input.entity_id || null,
        description: input.description || null,
        created_at: now,
        updated_at: now,
      };
      mockStore.attachments.push(newAtt);
      return { ...newAtt } as unknown as T;
    }

    case 'add_attachment':
    case 'save_attachment_file': {
      const payload = args?.payload as any;
      const now = new Date().toISOString();
      const id = 'att-' + Math.random().toString(36).substring(2, 9);
      const rawName = ((payload.file_name || 'unnamed') as string).trim().replace(/\\/g, '/');
      const baseName = rawName.split('/').pop() || 'unnamed';
      const safeName = baseName.replace(/[^a-zA-Z0-9._ -]/g, '').replace(/^\.+/, '') || 'attachment.bin';
      const ext = safeName.split('.').pop()?.toLowerCase() || '';
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);

      const newAtt = {
        id,
        project_id: payload.project_id,
        file_name: safeName,
        file_path: payload.base64_data && isImg ? payload.base64_data : `C:/Users/Local/WriteIn/projects/${payload.project_id}/attachments/${id}/${safeName}`,
        relative_path: `attachments/${id}/${safeName}`,
        file_type: isImg ? 'image' : ext === 'pdf' ? 'pdf' : ['docx', 'doc', 'txt', 'md'].includes(ext) ? 'document' : ['mp3', 'wav'].includes(ext) ? 'audio' : 'other',
        mime_type: isImg ? `image/${ext}` : ext === 'pdf' ? 'application/pdf' : 'application/octet-stream',
        file_size: payload.base64_data ? Math.round(payload.base64_data.length * 0.75) : 102400,
        entity_type: payload.entity_type || null,
        entity_id: payload.entity_id || null,
        description: payload.description || null,
        created_at: now,
        updated_at: now,
      };
      mockStore.attachments.push(newAtt);
      return { ...newAtt } as unknown as T;
    }

    case 'update_attachment': {
      const id = args?.id as string;
      const input = args?.input as any;
      const att = mockStore.attachments.find((a) => a.id === id);
      if (!att) throw new Error(`Attachment ${id} not found`);

      if (input.file_name) att.file_name = input.file_name.trim();
      if (input.description !== undefined) att.description = input.description;
      if (input.entity_type !== undefined) att.entity_type = input.entity_type;
      if (input.entity_id !== undefined) att.entity_id = input.entity_id;
      att.updated_at = new Date().toISOString();

      return { ...att } as unknown as T;
    }

    case 'remove_attachment':
    case 'delete_attachment': {
      const id = args?.id as string;
      mockStore.attachments = mockStore.attachments.filter((a) => a.id !== id);
      return true as unknown as T;
    }

    case 'open_attachment':
    case 'reveal_attachment_folder': {
      return true as unknown as T;
    }

    case 'get_related_content': {
      const projId = args?.project_id as string;
      const entityType = args?.entity_type as string;
      const entityId = args?.entity_id as string;

      const chapters: any[] = [];
      const characters: any[] = [];
      const locations: any[] = [];
      const timelineEvents: any[] = [];
      const notes: any[] = [];
      const attachments: any[] = [];

      // Linked attachments
      for (const a of mockStore.attachments.filter((x) => x.project_id === projId && x.entity_type === entityType && x.entity_id === entityId)) {
        attachments.push({
          id: a.id,
          entity_type: 'attachment',
          title: a.file_name,
          subtitle: a.description || `${Math.round(a.file_size / 1024)} KB`,
          badge: a.file_type.toUpperCase(),
          target_tab: 'references',
          target_id: a.id,
        });
      }

      if (entityType === 'character') {
        // Timeline events
        for (const t of mockStore.timeline.filter((x) => x.project_id === projId && x.character_ids?.includes(entityId))) {
          timelineEvents.push({
            id: t.id,
            entity_type: 'timeline',
            title: t.title,
            subtitle: t.date_label || t.date_value,
            badge: t.importance,
            target_tab: 'timeline',
            target_id: t.id,
          });

          // Chapter from event
          if (t.related_chapter_id) {
            const ch = mockStore.nodes.find((n) => n.id === t.related_chapter_id);
            if (ch && !chapters.some((c) => c.id === ch.id)) {
              chapters.push({
                id: ch.id,
                entity_type: 'chapter',
                title: ch.title,
                subtitle: `Appears in ${ch.node_type}`,
                badge: ch.status,
                target_tab: 'manuscript',
                target_id: ch.id,
              });
            }
          }

          // Location from event
          if (t.location_id) {
            const loc = mockStore.locations.find((l) => l.id === t.location_id);
            if (loc && !locations.some((l) => l.id === loc.id)) {
              locations.push({
                id: loc.id,
                entity_type: 'location',
                title: loc.name,
                subtitle: loc.location_type,
                badge: 'Setting',
                target_tab: 'locations',
                target_id: loc.id,
              });
            }
          }
        }

        // Related characters from relationships
        for (const r of mockStore.relationships.filter((x) => x.character_a_id === entityId || x.character_b_id === entityId)) {
          const partnerId = r.character_a_id === entityId ? r.character_b_id : r.character_a_id;
          const char = mockStore.characters.find((c) => c.id === partnerId);
          if (char) {
            characters.push({
              id: char.id,
              entity_type: 'character',
              title: char.name,
              target_tab: 'characters',
              target_id: char.id,
            });
          }
        }

        // Notes mentioning character
        const charSelf = mockStore.characters.find((c) => c.id === entityId);
        if (charSelf) {
          const namesToMatch = [
            charSelf.name.toLowerCase(),
            ...charSelf.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2),
            ...(charSelf.nickname ? [charSelf.nickname.toLowerCase()] : []),
          ];
          for (const n of mockStore.notes.filter((x) => x.project_id === projId)) {
            const text = `${n.title} ${n.content}`.toLowerCase();
            if (namesToMatch.some((name) => text.includes(name))) {
              notes.push({
                id: n.id,
                entity_type: 'note',
                title: n.title,
                subtitle: `Category: ${n.category}`,
                badge: 'Note',
                target_tab: 'notes',
                target_id: n.id,
              });
            }
          }
        }
      } else if (entityType === 'location') {
        for (const t of mockStore.timeline.filter((x) => x.project_id === projId && x.location_id === entityId)) {
          timelineEvents.push({
            id: t.id,
            entity_type: 'timeline',
            title: t.title,
            subtitle: t.date_label || t.date_value,
            badge: t.importance,
            target_tab: 'timeline',
            target_id: t.id,
          });

          if (t.related_chapter_id) {
            const ch = mockStore.nodes.find((n) => n.id === t.related_chapter_id);
            if (ch && !chapters.some((c) => c.id === ch.id)) {
              chapters.push({
                id: ch.id,
                entity_type: 'chapter',
                title: ch.title,
                subtitle: `Setting in ${ch.node_type}`,
                badge: ch.status,
                target_tab: 'manuscript',
                target_id: ch.id,
              });
            }
          }

          if (t.character_ids) {
            for (const cid of t.character_ids) {
              const char = mockStore.characters.find((c) => c.id === cid);
              if (char && !characters.some((c) => c.id === char.id)) {
                characters.push({
                  id: char.id,
                  entity_type: 'character',
                  title: char.name,
                  subtitle: 'Present at location',
                  badge: char.role,
                  target_tab: 'characters',
                  target_id: char.id,
                });
              }
            }
          }
        }

        // Notes mentioning location
        const locSelf = mockStore.locations.find((l) => l.id === entityId);
        if (locSelf) {
          for (const n of mockStore.notes.filter((x) => x.project_id === projId && (x.title.toLowerCase().includes(locSelf.name.toLowerCase()) || x.content.toLowerCase().includes(locSelf.name.toLowerCase())))) {
            notes.push({
              id: n.id,
              entity_type: 'note',
              title: n.title,
              subtitle: `Category: ${n.category}`,
              badge: 'Note',
              target_tab: 'notes',
              target_id: n.id,
            });
          }
        }
      } else if (entityType === 'chapter' || entityType === 'manuscript') {
        for (const t of mockStore.timeline.filter((x) => x.project_id === projId && x.related_chapter_id === entityId)) {
          timelineEvents.push({
            id: t.id,
            entity_type: 'timeline',
            title: t.title,
            subtitle: t.date_label || t.date_value,
            badge: t.importance,
            target_tab: 'timeline',
            target_id: t.id,
          });

          if (t.location_id) {
            const loc = mockStore.locations.find((l) => l.id === t.location_id);
            if (loc && !locations.some((l) => l.id === loc.id)) {
              locations.push({
                id: loc.id,
                entity_type: 'location',
                title: loc.name,
                subtitle: loc.location_type,
                badge: 'Setting',
                target_tab: 'locations',
                target_id: loc.id,
              });
            }
          }

          if (t.character_ids) {
            for (const cid of t.character_ids) {
              const char = mockStore.characters.find((c) => c.id === cid);
              if (char && !characters.some((c) => c.id === char.id)) {
                characters.push({
                  id: char.id,
                  entity_type: 'character',
                  title: char.name,
                  subtitle: 'Appears in chapter',
                  badge: char.role,
                  target_tab: 'characters',
                  target_id: char.id,
                });
              }
            }
          }
        }

        // Notes mentioning chapter
        const chSelf = mockStore.nodes.find((n) => n.id === entityId);
        if (chSelf) {
          for (const n of mockStore.notes.filter((x) => x.project_id === projId && (x.title.toLowerCase().includes(chSelf.title.toLowerCase()) || x.content.toLowerCase().includes(chSelf.title.toLowerCase())))) {
            notes.push({
              id: n.id,
              entity_type: 'note',
              title: n.title,
              subtitle: `Category: ${n.category}`,
              badge: 'Note',
              target_tab: 'notes',
              target_id: n.id,
            });
          }
        }
      }

      return {
        entity_type: entityType,
        entity_id: entityId,
        chapters,
        characters,
        locations,
        timeline_events: timelineEvents,
        notes,
        attachments,
      } as unknown as T;
    }
    case 'close_splashscreen': {
      return undefined as unknown as T;
    }

    default:
      throw new Error(`Command ${cmd} not mocked in fallback`);
  }
}
