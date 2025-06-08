import React, { useState, useRef, useEffect } from 'react'
import ResizablePanel from './ResizablePanel'
import { LucideIcon } from '../ui/LucideIcon'
import styles from './FourthPanel.module.scss'

interface FourthPanelProps {
  onDrop: (e: React.DragEvent) => void
}

export const FourthPanel: React.FC<FourthPanelProps> = ({ onDrop }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFollowMode, setIsFollowMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (isFullscreen) return
    
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }

  // Handle mouse move during drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const newX = e.clientX - dragStartRef.current.x
      const newY = e.clientY - dragStartRef.current.y
      
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, position])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      setIsMinimized(false)
    }
  }

  // Toggle minimize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    if (!isMinimized) {
      setIsFullscreen(false)
    }
  }

  // Toggle follow mode (cursor following)
  const toggleFollowMode = () => {
    setIsFollowMode(!isFollowMode)
  }

  // Move to second monitor (simulated)
  const moveToSecondMonitor = () => {
    if (window.screen && window.screen.availWidth) {
      const newWindow = window.open(
        '',
        'FourthPanelWindow',
        `width=800,height=600,left=${window.screen.availWidth},top=0,resizable=yes,scrollbars=yes`
      )
      
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ArtBastard DMX - 4th Panel</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  background: #1a1a1a; 
                  color: #fff; 
                  font-family: Arial, sans-serif;
                }
                .panel-content {
                  width: 100%;
                  height: calc(100vh - 40px);
                  border: 1px solid #333;
                  border-radius: 8px;
                  padding: 20px;
                  box-sizing: border-box;
                }
              </style>
            </head>
            <body>
              <div class="panel-content">
                <h2>4th Panel - External Monitor</h2>
                <p>This panel is now running on a separate monitor/window.</p>
                <p>Components can be dragged here for extended display.</p>
              </div>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    }
  }

  // Follow mouse cursor effect
  useEffect(() => {
    if (!isFollowMode) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isFullscreen) {
        const x = e.clientX - 200 // Offset to center panel on cursor
        const y = e.clientY - 100
        setPosition({ x, y })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [isFollowMode, isDragging, isFullscreen])

  const panelClasses = [
    styles.fourthPanel,
    isFullscreen && styles.fullscreen,
    isMinimized && styles.minimized,
    isFollowMode && styles.followMode,
    isDragging && styles.dragging
  ].filter(Boolean).join(' ')

  const panelStyle = isFullscreen ? {} : {
    transform: `translate(${position.x}px, ${position.y}px)`
  }

  return (
    <div 
      ref={panelRef}
      className={panelClasses}
      style={panelStyle}
    >
      {/* Panel Header with Controls */}
      <div 
        className={styles.panelHeader}
        onMouseDown={handleDragStart}
      >
        <div className={styles.headerTitle}>
          <LucideIcon name="Monitor" />
          <span>4th Panel</span>
          {isFollowMode && <span className={styles.followIndicator}>(Following)</span>}
        </div>
        
        <div className={styles.headerControls}>
          <button
            onClick={toggleFollowMode}
            className={`${styles.controlButton} ${isFollowMode ? styles.active : ''}`}
            title="Toggle Follow Mode"
          >
            <LucideIcon name="MousePointer" />
          </button>
          
          <button
            onClick={moveToSecondMonitor}
            className={styles.controlButton}
            title="Move to Second Monitor"
          >
            <LucideIcon name="Monitor" />
          </button>
          
          <button
            onClick={toggleMinimize}
            className={`${styles.controlButton} ${isMinimized ? styles.active : ''}`}
            title="Minimize"
          >
            <LucideIcon name="Minimize2" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className={`${styles.controlButton} ${isFullscreen ? styles.active : ''}`}
            title="Fullscreen"
          >
            <LucideIcon name={isFullscreen ? "Minimize2" : "Maximize2"} />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {!isMinimized && (
        <div className={styles.panelContent}>
          <ResizablePanel
            panelId="fourth"
            title="Touchscreen Interface"
            className={styles.innerPanel}
            onDrop={onDrop}
          />
        </div>
      )}

      {/* Touch Interface Overlay for Touchscreen Mode */}
      {!isMinimized && (
        <div className={styles.touchInterface}>
          <div className={styles.touchControls}>
            <button className={styles.touchButton}>
              <LucideIcon name="Play" />
            </button>
            <button className={styles.touchButton}>
              <LucideIcon name="Pause" />
            </button>
            <button className={styles.touchButton}>
              <LucideIcon name="Square" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FourthPanel
