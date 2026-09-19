import { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { ManuscriptProvider } from './context/ManuscriptContext';
import { AppLayout } from './components/layout/AppLayout';
import { ActiveNavTab } from './components/layout/Sidebar';
import { ProjectHomeView } from './components/projects/ProjectHomeView';
import { ManuscriptWorkspace } from './components/manuscript/ManuscriptWorkspace';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { ProjectListModal } from './components/projects/ProjectListModal';
import { CharacterWorkspace } from './components/story/characters/CharacterWorkspace';
import { LocationWorkspace } from './components/story/locations/LocationWorkspace';
import { WorldbuildingWorkspace } from './components/story/worldbuilding/WorldbuildingWorkspace';
import { TimelineWorkspace } from './components/story/timeline/TimelineWorkspace';
import { NotesWorkspace } from './components/story/notes/NotesWorkspace';
import { ReferenceWorkspace } from './components/story/references/ReferenceWorkspace';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import {
  GenericPlaceholder,
  SettingsView,
} from './components/views/PlaceholderViews';
import { Trash2 } from 'lucide-react';
import './App.css';

function MainContent({
  activeTab,
  onSelectTab,
  onOpenNewProject,
  isDistractionFree,
  selectedEntityId,
}: {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab, entityId?: string) => void;
  onOpenNewProject: () => void;
  isDistractionFree: boolean;
  selectedEntityId?: string | null;
}) {
  switch (activeTab) {
    case 'overview':
      return (
        <ProjectHomeView
          onNavigateTab={onSelectTab}
          onOpenNewProject={onOpenNewProject}
        />
      );

    case 'manuscript':
      return (
        <ManuscriptWorkspace
          isDistractionFree={isDistractionFree}
          selectedChapterId={selectedEntityId}
        />
      );

    case 'characters':
      return (
        <CharacterWorkspace
          selectedCharacterId={selectedEntityId}
          onNavigateTab={onSelectTab}
        />
      );

    case 'locations':
      return (
        <LocationWorkspace
          selectedLocationId={selectedEntityId}
          onNavigateTab={onSelectTab}
        />
      );

    case 'worldbuilding':
      return <WorldbuildingWorkspace />;

    case 'timeline':
      return (
        <TimelineWorkspace
          onNavigateTab={onSelectTab}
          selectedEventId={selectedEntityId}
        />
      );

    case 'notes':
      return <NotesWorkspace selectedNoteId={selectedEntityId} />;

    case 'references':
      return <ReferenceWorkspace selectedAttachmentId={selectedEntityId} />;

    case 'trash':
      return (
        <GenericPlaceholder
          title="Trash & Recovery"
          description="Safely recover deleted chapters, characters, and notes"
          icon={Trash2}
          phase="Phase 7 Target"
        />
      );

    case 'settings':
      return <SettingsView />;

    default:
      return (
        <ProjectHomeView
          onNavigateTab={onSelectTab}
          onOpenNewProject={onOpenNewProject}
        />
      );
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const handleNavigate = (tab: ActiveNavTab, entityId?: string) => {
    setActiveTab(tab);
    if (entityId) {
      setSelectedEntityId(entityId);
    }
  };

  const handleSearchNavigate = (tab: ActiveNavTab, entityId?: string) => {
    handleNavigate(tab, entityId);
    setIsSearchOpen(false);
  };

  return (
    <ThemeProvider>
      <ProjectProvider>
        <ManuscriptProvider>
          <AppLayout
            activeTab={activeTab}
            onSelectTab={handleNavigate}
            onOpenProjectList={() => setIsListModalOpen(true)}
            onOpenNewProject={() => setIsCreateModalOpen(true)}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenSearch={() => setIsSearchOpen(true)}
            isDistractionFree={isDistractionFree}
            onSetDistractionFree={setIsDistractionFree}
          >
            <MainContent
              activeTab={activeTab}
              onSelectTab={handleNavigate}
              onOpenNewProject={() => setIsCreateModalOpen(true)}
              isDistractionFree={isDistractionFree}
              selectedEntityId={selectedEntityId}
            />

            <CreateProjectModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
            />

            <ProjectListModal
              isOpen={isListModalOpen}
              onClose={() => setIsListModalOpen(false)}
              onOpenNewProject={() => {
                setIsListModalOpen(false);
                setIsCreateModalOpen(true);
              }}
            />

            <GlobalSearchModal
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              onNavigate={handleSearchNavigate}
            />
          </AppLayout>
        </ManuscriptProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;
