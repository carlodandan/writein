import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { InteractiveDeskDemo } from './components/InteractiveDeskDemo';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { DocxCompilerShowcase } from './components/DocxCompilerShowcase';
import { PrivacyManifesto } from './components/PrivacyManifesto';
import { ComparisonTable } from './components/ComparisonTable';
import { DownloadSection } from './components/DownloadSection';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { DeepLinkModal } from './components/DeepLinkLauncher';

export function App() {
  const [isDeepLinkModalOpen, setIsDeepLinkModalOpen] = useState(false);

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper-bg)] text-[var(--ink-primary)]">
      {/* Top Navbar */}
      <Navbar onOpenDeepLinkModal={() => setIsDeepLinkModalOpen(true)} />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero
          onOpenDeepLinkModal={() => setIsDeepLinkModalOpen(true)}
          onScrollToDemo={scrollToDemo}
        />
        <InteractiveDeskDemo />
        <FeaturesShowcase />
        <DocxCompilerShowcase />
        <ComparisonTable />
        <PrivacyManifesto />
        <DownloadSection />
        <FAQ />
      </main>

      {/* Footer */}
      <Footer onOpenDeepLinkModal={() => setIsDeepLinkModalOpen(true)} />

      {/* Deep Link Launch Test Modal */}
      <DeepLinkModal
        isOpen={isDeepLinkModalOpen}
        onClose={() => setIsDeepLinkModalOpen(false)}
      />
    </div>
  );
}

export default App;
