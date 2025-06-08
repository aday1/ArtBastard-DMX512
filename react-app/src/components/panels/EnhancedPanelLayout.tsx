import React, { useState, useRef, useCallback } from 'react'
import { usePanels } from '../../context/PanelContext'
import ResizablePanel from './ResizablePanel'
import { ComponentToolbar } from './ComponentToolbar'
import { FourthPanel } from './FourthPanel'
import styles from './EnhancedPanelLayout.module.scss'

export const EnhancedPanelLayout: React.FC = () => {
  const { layout, addComponentToPanel, updateSplitterPosition } = usePanels()
  const [isDragging, setIsDragging] = useState<'horizontal' | 'vertical' | 'fourth-vertical' | null>(null)
  const [fourthPanelVisible, setFourthPanelVisible] = useState(true)
  const [fourthPanelHeight, setFourthPanelHeight] = useState(25) // percentage
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

  const handleMouseDown = useCallback((type: 'horizontal' | 'vertical' | 'fourth-vertical') => (e: React.MouseEvent) => {
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
      const availableHeight = fourthPanelVisible ? 100 - fourthPanelHeight : 100
      const newPosition = ((e.clientY - rect.top) / rect.height) * availableHeight
      updateSplitterPosition('vertical', Math.max(20, Math.min(80, newPosition)))
    } else if (isDragging === 'fourth-vertical') {
      const newHeight = ((rect.bottom - e.clientY) / rect.height) * 100
      setFourthPanelHeight(Math.max(10, Math.min(60, newHeight)))
    }
  }, [isDragging, updateSplitterPosition, fourthPanelVisible, fourthPanelHeight])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const toggleFourthPanel = () => {
    setFourthPanelVisible(!fourthPanelVisible)
  }

  const { horizontal, vertical } = layout.splitterPositions
  const mainAreaHeight = fourthPanelVisible ? 100 - fourthPanelHeight : 100

  return (
    <div className={styles.layoutContainer}>
      <ComponentToolbar />
      
      <div className={styles.panelControls}>
        <button 
          onClick={toggleFourthPanel}
          className={`${styles.panelToggle} ${fourthPanelVisible ? styles.active : ''}`}
          title={fourthPanelVisible ? 'Hide 4th Panel' : 'Show 4th Panel'}
        >
          4th Panel
        </button>
      </div>

      <div
        ref={layoutRef}
        className={styles.panelLayout}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Main Three Panel Area */}
        <div 
          className={styles.mainPanelArea}
          style={{ height: `${mainAreaHeight}%` }}
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
            />
          </div>
        </div>

        {/* Fourth Panel Section */}
        {fourthPanelVisible && (
          <>
            {/* Fourth Panel Splitter */}
            <div
              className={`${styles.splitter} ${styles.fourthPanelSplitter}`}
              onMouseDown={handleMouseDown('fourth-vertical')}
            >
              <div className={styles.splitterHandle}>
                <i className="fas fa-grip-lines"></i>
              </div>
            </div>

            {/* Fourth Panel */}
            <div 
              className={styles.fourthPanelSection}
              style={{ height: `${fourthPanelHeight}%` }}
            >
              <FourthPanel onDrop={handleDrop('fourth')} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EnhancedPanelLayout
