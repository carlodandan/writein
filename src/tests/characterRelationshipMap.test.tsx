import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterRelationshipMap } from '../components/story/characters/CharacterRelationshipMap';
import { Character, CharacterRelationshipWithNames } from '../types/character';

describe('CharacterRelationshipMap Component', () => {
  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      project_id: 'proj-1',
      name: 'Vance Marlowe',
      nickname: 'Vance',
      role: 'protagonist',
      age: '38',
      description: 'Private investigator',
      personality: 'Cynical',
      appearance: 'Trenchcoat',
      background: 'Ex-police',
      motivations: 'Truth',
      fears: 'Failure',
      goals: 'Solve the case',
      notes: null,
      avatar_path: null,
      tags: 'detective',
      custom_fields_json: null,
      created_at: '2026-09-01',
      updated_at: '2026-09-01',
    },
    {
      id: 'char-2',
      project_id: 'proj-1',
      name: 'Julian Blackwood',
      nickname: 'Blackwood',
      role: 'antagonist',
      age: '55',
      description: 'Corrupt industrialist',
      personality: 'Ruthless',
      appearance: 'Tailored suit',
      background: 'Rail tycoon',
      motivations: 'Power',
      fears: 'Exposure',
      goals: 'Control city council',
      notes: null,
      avatar_path: null,
      tags: 'villain',
      custom_fields_json: null,
      created_at: '2026-09-01',
      updated_at: '2026-09-01',
    },
  ];

  const mockRelationships: CharacterRelationshipWithNames[] = [
    {
      id: 'rel-1',
      project_id: 'proj-1',
      character_a_id: 'char-1',
      character_a_name: 'Vance Marlowe',
      character_b_id: 'char-2',
      character_b_name: 'Julian Blackwood',
      relation_type: 'Nemesis / Rival',
      description: 'Blood feud',
      created_at: '2026-09-01',
    },
  ];

  const defaultProps = {
    characters: mockCharacters,
    relationships: mockRelationships,
    projectId: 'proj-1',
    onSelectCharacter: vi.fn(),
    onEditRelationship: vi.fn(),
    onDeleteRelationship: vi.fn(),
    onOpenNewRelationshipModal: vi.fn(),
    onOpenNewCharacterModal: vi.fn(),
  };

  it('renders call to action when less than 2 characters exist', () => {
    render(
      <CharacterRelationshipMap
        {...defaultProps}
        characters={[mockCharacters[0]]}
      />,
    );
    expect(screen.getByText('Build Your Character Web')).toBeDefined();
    expect(screen.getByText('Create Character')).toBeDefined();
  });

  it('renders characters, links, and toolbar on the canvas', () => {
    render(<CharacterRelationshipMap {...defaultProps} />);

    expect(screen.getByText('Vance Marlowe')).toBeDefined();
    expect(screen.getByText('Julian Blackwood')).toBeDefined();
    expect(screen.getByText('Nemesis / Rival')).toBeDefined();
    expect(screen.getByText('+ Link Characters')).toBeDefined();
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('adjusts zoom level when Zoom In and Zoom Out buttons are clicked', () => {
    render(<CharacterRelationshipMap {...defaultProps} />);

    const zoomInBtn = screen.getByTitle('Zoom In');
    const zoomOutBtn = screen.getByTitle('Zoom Out');

    fireEvent.click(zoomInBtn);
    expect(screen.getByText('115%')).toBeDefined();

    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('calls onSelectCharacter when a character node is clicked', () => {
    const onSelectCharacter = vi.fn();
    render(
      <CharacterRelationshipMap
        {...defaultProps}
        onSelectCharacter={onSelectCharacter}
      />,
    );

    const charNode = screen.getByText('Vance Marlowe');
    fireEvent.click(charNode);

    expect(onSelectCharacter).toHaveBeenCalledWith(mockCharacters[0]);
  });

  it('calls onEditRelationship when relationship label is clicked', () => {
    const onEditRelationship = vi.fn();
    render(
      <CharacterRelationshipMap
        {...defaultProps}
        onEditRelationship={onEditRelationship}
      />,
    );

    const relPill = screen.getByText('Nemesis / Rival');
    fireEvent.click(relPill);

    expect(onEditRelationship).toHaveBeenCalledWith(mockRelationships[0]);
  });

  it('calls onDeleteRelationship when relationship label is right-clicked', () => {
    const onDeleteRelationship = vi.fn();
    render(
      <CharacterRelationshipMap
        {...defaultProps}
        onDeleteRelationship={onDeleteRelationship}
      />,
    );

    const relPill = screen.getByText('Nemesis / Rival');
    fireEvent.contextMenu(relPill);

    expect(onDeleteRelationship).toHaveBeenCalledWith(mockRelationships[0]);
  });

  it('renders infinite dot grid pattern in svg defs', () => {
    const { container } = render(<CharacterRelationshipMap {...defaultProps} />);
    const pattern = container.querySelector('#dot-grid');
    expect(pattern).not.toBeNull();
  });
});
