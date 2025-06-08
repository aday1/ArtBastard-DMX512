import React, { useState, useRef, useCallback } from 'react'
import { usePanels } from '../../context/PanelContext'
import { useExternalWindow } from '../../context/ExternalWindowContext'
import ResizablePanel from './ResizablePanel'
import { ComponentToolbar } from './ComponentToolbar'
import styles from './EnhancedPanelLayout.module.scss'

export const EnhancedPanelLayout: React.FC = () => {
  const { layout, addComponentToPanel, updateSplitterPosition } = usePanels()
  const { externalWindow, openExternalWindow, closeExternalWindow } = useExternalWindow()
  const [isDragging, setIsDragging] = useState<'horizontal' | 'vertical' | null>(null)
  const layoutRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback((panelId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      const componentId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const newComponent = {
        id: componentId,
        type: componentData.type,
        title: componentData.title,
        props: componentData.defaultProps || {},
      }

      addComponentToPanel(panelId as any, newComponent)
    } catch (error) {
      console.error('Failed to parse dropped component data:', error)
    }
  }, [addComponentToPanel])
  const handleMouseDown = useCallback((type: 'horizontal' | 'vertical') => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(type)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !layoutRef.current) return

    const rect = layoutRef.current.getBoundingClientRect()
    
    if (isDragging === 'horizontal') {
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100
      updateSplitterPosition('horizontal', Math.max(20, Math.min(80, newPosition)))
    } else if (isDragging === 'vertical') {
      const newPosition = ((e.clientY - rect.top) / rect.height) * 100
      updateSplitterPosition('vertical', Math.max(20, Math.min(80, newPosition)))
    }
  }, [isDragging, updateSplitterPosition])
  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const toggleExternalMonitor = () => {
    if (externalWindow.isOpen) {
      closeExternalWindow()
    } else {
      openExternalWindow()
    }
  }

  const { horizontal, vertical } = layout.splitterPositions

  return (
    <div className={styles.layoutContainer}>
      <ComponentToolbar />
      
      <div className={styles.panelControls}>
        <button 
          onClick={toggleExternalMonitor}
          className={`${styles.panelToggle} ${externalWindow.isOpen ? styles.active : ''}`}
          title={externalWindow.isOpen ? 'Close External Monitor' : 'Open External Monitor'}
        >
          External Monitor
        </button>
      </div>

      <div
        ref={layoutRef}
        className={styles.panelLayout}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Main Three Panel Area - Now Full Height */}
        <div 
          className={styles.mainPanelArea}
          style={{ height: '100%' }}
        >
          {/* Top Section */}
          <div 
            className={styles.topSection}
            style={{ height: `${vertical}%` }}
          >
            {/* Top Left Panel */}
            <div 
              className={styles.topLeft}
              style={{ width: `${horizontal}%` }}
            >
              <ResizablePanel
                panelId="top-left"
                title="Left Panel"
                className={styles.topLeftPanel}
                onDrop={handleDrop('top-left')}
              />
            </div>

            {/* Horizontal Splitter */}
            <div
              className={`${styles.splitter} ${styles.horizontalSplitter}`}
              onMouseDown={handleMouseDown('horizontal')}
            >
              <div className={styles.splitterHandle}>
                <i className="fas fa-grip-lines-vertical"></i>
              </div>
            </div>

            {/* Top Right Panel */}
            <div 
              className={styles.topRight}
              style={{ width: `${100 - horizontal}%` }}
            >
              <ResizablePanel
                panelId="top-right"
                title="Right Panel"
                className={styles.topRightPanel}
                onDrop={handleDrop('top-right')}
              />
            </div>
          </div>

          {/* Vertical Splitter */}
          <div
            className={`${styles.splitter} ${styles.verticalSplitter}`}
            onMouseDown={handleMouseDown('vertical')}
          >
            <div className={styles.splitterHandle}>
              <i className="fas fa-grip-lines"></i>
            </div>
          </div>

          {/* Bottom Section */}
          <div 
            className={styles.bottomSection}
            style={{ height: `${100 - vertical}%` }}
          >
            <ResizablePanel
              panelId="bottom"
              title="Bottom Panel"
              className={styles.bottomPanel}
              onDrop={handleDrop('bottom')}
            />          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedPanelLayout
