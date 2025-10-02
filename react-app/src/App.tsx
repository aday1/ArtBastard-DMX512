import React from 'react'
import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { PanelProvider } from './context/PanelContext'
import { DockingProvider } from './context/DockingContext'
import { PinningProvider } from './context/PinningContext'
import { ExternalWindowProvider } from './context/ExternalWindowContext'
import { ChromaticEnergyManipulatorProvider } from './context/ChromaticEnergyManipulatorContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <PanelProvider>
          <DockingProvider>
            <PinningProvider>
              <ExternalWindowProvider>
                <ChromaticEnergyManipulatorProvider>
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