import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar } from './components/layout/Sidebar';
import { TheoryLab } from './components/modules/TheoryLab';
import { Library } from './components/modules/Library';
import { Projects } from './components/modules/Projects';
import { SonicScapes } from './components/modules/SonicScapes';
import { TemporalView } from './components/modules/TemporalView';
import { Settings } from './components/modules/Settings';
import { useSonic } from './hooks/useSonic';
import type { EnergyState } from './components/modules/FlowDispatcher';
import type { Project, SystemSettings } from './types';

type View = 'theory' | 'library' | 'projects' | 'sonic' | 'temporal' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<View>('projects');
  const [guardianOpen, setGuardianOpen] = useState(true);

  // Lifted State
  const [energy, setEnergy] = useState<EnergyState>('high');
  const sonicState = useSonic(); // Initialize audio engine

  // System Settings
  const [settings, setSettings] = useState<SystemSettings>({
    glassBlur: 16,
    wallpaper: `radial-gradient(at 0% 0%, rgba(103, 232, 249, 0.7) 0, transparent 50%),
                radial-gradient(at 50% 100%, rgba(15, 118, 110, 1) 0, transparent 50%),
                radial-gradient(at 100% 0%, rgba(45, 212, 191, 0.6) 0, transparent 50%)`,
    theme: 'day'
  });

  // Apply Settings to CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
    root.style.setProperty('--bg-image', settings.wallpaper);

    // Theme logic can be expanded here if we want more complex theme variables
    if (settings.theme === 'night') {
      root.style.setProperty('--glass-opacity', '0.4');
      root.style.setProperty('--glass-border', '0.1');
      root.style.setProperty('--glass-rgb', '15, 23, 42');
    } else {
      root.style.setProperty('--glass-opacity', '0.2');
      root.style.setProperty('--glass-border', '0.4');
      root.style.setProperty('--glass-rgb', '255, 255, 255');
    }

  }, [settings]);

  // Initialize projects from localStorage or default
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('dreamOS_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }
    return [
      {
        id: '1',
        name: 'Dream OS Dev',
        tasks: [
          { id: '101', text: 'Implement Chess Theory PGN parser', completed: false }
        ]
      },
      {
        id: '2',
        name: 'Recursive Life',
        tasks: [
          { id: '201', text: 'Code OTCA metapixel clock logic', completed: false }
        ]
      }
    ];
  });

  // Persist projects to localStorage
  useEffect(() => {
    localStorage.setItem('dreamOS_projects', JSON.stringify(projects));
  }, [projects]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black/40">
      {/* Background - Handled in index.css */}
      <div className="absolute inset-0 z-0 bg-transparent" />

      {/* Main Layout Grid */}
      <div className="relative z-10 flex h-full p-6 gap-6">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          guardianOpen={guardianOpen}
          onToggleGuardian={() => setGuardianOpen(!guardianOpen)}
          energy={energy}
          projects={projects}
        />

        {/* Main Content Area */}
        <main className="flex-1 glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col gap-6 transition-all duration-300">
          {/* Glossy Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-32 glossy-overlay opacity-50 pointer-events-none rounded-t-3xl" />

          <div className="relative z-10 h-full overflow-hidden">
            <AnimatePresence>
              <motion.div
                key={activeView}
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {activeView === 'projects' && (
                  <Projects energy={energy} setEnergy={setEnergy} projects={projects} setProjects={setProjects} />
                )}
                {activeView === 'theory' && <TheoryLab />}
                {activeView === 'library' && <Library />}
                {activeView === 'sonic' && <SonicScapes {...sonicState} />}
                {activeView === 'temporal' && <TemporalView projects={projects} setProjects={setProjects} />}
                {activeView === 'settings' && <Settings settings={settings} onUpdateSettings={setSettings} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
