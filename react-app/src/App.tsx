import React from 'react'
import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { PanelProvider } from './context/PanelContext'
import { DockingProvider } from './context/DockingContext'
import { PinningProvider } from './context/PinningContext'
import { ExternalWindowProvider } from './context/ExternalWindowContext'
import { ChromaticEnergyManipulatorProvider } from './context/ChromaticEnergyManipulatorContext'
import { useSceneTransitionAnimation } from './hooks/useSceneTransitionAnimation'
import { useGlobalMidiManager } from './hooks/useGlobalMidiManager'
import { useGlobalBrowserMidi } from './hooks/useGlobalBrowserMidi'
import { MidiDmxProcessor } from './components/midi/MidiDmxProcessor'
import { OscDmxProcessor } from './components/midi/OscDmxProcessor'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  // Initialize scene transition animation
  useSceneTransitionAnimation();
  
  // Initialize global MIDI manager to persist across all pages
  useGlobalMidiManager();
  
  // Initialize global browser MIDI manager to persist across all pages
  useGlobalBrowserMidi();
  
  return (
    <ThemeProvider>
      <SocketProvider>
        <PanelProvider>
          <DockingProvider>
            <PinningProvider>
              <ExternalWindowProvider>
                <ChromaticEnergyManipulatorProvider>
                  {/* Global MIDI processor - processes MIDI messages into DMX channel updates */}
                  <MidiDmxProcessor />
                  {/* Global OSC processor - processes OSC messages into DMX channel updates */}
                  <OscDmxProcessor />
                  <Layout />
                  <ToastContainer 
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                  />
                </ChromaticEnergyManipulatorProvider>
              </ExternalWindowProvider>
            </PinningProvider>
          </DockingProvider>
        </PanelProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App