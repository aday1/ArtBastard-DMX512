import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store'
import styles from './ScenePanel.module.scss'

interface ScenePanelProps {
  isDocked?: boolean
  onToggleDocked?: () => void
  position?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
}

export const ScenePanel: React.FC<ScenePanelProps> = ({
  isDocked = true,
  onToggleDocked,
  position = { x: 100, y: 100 },
  onPositionChange
}) => {
  const {
    scenes,
    saveScene,
    loadScene,
    deleteScene,
    addNotification
  } = useStore()

  const [sceneNameInput, setSceneNameInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const handleSaveScene = () => {
    if (sceneNameInput.trim()) {
      const oscAddress = `/scene/${sceneNameInput.trim().toLowerCase().replace(/\s+/g, '_')}`
      saveScene(sceneNameInput.trim(), oscAddress)
      addNotification({
        message: `Scene "${sceneNameInput.trim()}" saved successfully`,
        type: 'success'
      })
      setSceneNameInput('')
    }
  }

  const handleLoadScene = (sceneName: string) => {
    const scene = scenes.find(s => s.name === sceneName)
    if (scene) {
      loadScene(sceneName)
      addNotification({
        message: `Scene "${scene.name}" loaded`,
        type: 'success'
      })
    }
  }

  const handleDeleteScene = (sceneName: string) => {
    const scene = scenes.find(s => s.name === sceneName)
    if (scene && confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(sceneName)
      addNotification({
        message: `Scene "${scene.name}" deleted`,
        type: 'info'
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveScene()
    }
  }

  // Dragging functionality for floating mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDocked || !panelRef.current) return
    
    const rect = panelRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging || isDocked) return

    const handleMouseMove = (e: MouseEvent) => {
      if (onPositionChange) {
        onPositionChange({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isDocked, dragOffset, onPositionChange])

  const panelStyle = isDocked ? {} : {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    zIndex: 1000
  }

  return (
    <div
      ref={panelRef}
      className={`${styles.scenePanel} ${isDocked ? styles.docked : styles.floating} ${isExpanded ? styles.expanded : ''}`}
      style={panelStyle}
    >
      <div 
        className={styles.header}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDocked ? 'default' : 'move' }}
      >
        <h3 className={styles.title}>Scene Management</h3>
        <div className={styles.controls}>
          <button
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          {onToggleDocked && (
            <button
              className={styles.dockButton}
              onClick={onToggleDocked}
              title={isDocked ? 'Undock Panel' : 'Dock Panel'}
            >
              {isDocked ? '📌' : '🔓'}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.saveSection}>
            <input
              type="text"
              placeholder="Scene name..."
              value={sceneNameInput}
              onChange={(e) => setSceneNameInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.sceneInput}
            />
            <button
              onClick={handleSaveScene}
              disabled={!sceneNameInput.trim()}
              className={styles.saveButton}
            >
              Save Scene
            </button>
          </div>

          <div className={styles.sceneList}>
            <h4>Saved Scenes ({scenes.length})</h4>
            {scenes.length === 0 ? (
              <p className={styles.noScenes}>No scenes saved</p>
            ) : (
              <div className={styles.scenes}>
                {scenes.map((scene) => {
                  // Count active automation modules in this scene
                  const hasModularAutomation = scene.modularAutomation;
                  const activeModules = hasModularAutomation ? 
                    Object.values(scene.modularAutomation).filter(module => 
                      typeof module === 'object' && module.enabled
                    ).length : 0;
                  
                  return (
                    <div key={scene.name} className={styles.sceneItem}>
                      <div className={styles.sceneInfo}>
                        <span className={styles.sceneName}>{scene.name}</span>
                        {hasModularAutomation && activeModules > 0 && (
                          <div className={styles.automationBadge} title={`${activeModules} automation modules active`}>
                            <span className={styles.automationIcon}>⚡</span>
                            <span className={styles.automationCount}>{activeModules}</span>
                          </div>
                        )}
                        {scene.autopilots && Object.keys(scene.autopilots).length > 0 && (
                          <div className={styles.legacyAutopilotBadge} title="Legacy autopilots active">
                            <span className={styles.legacyIcon}>🔄</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.sceneButtons}>
                        <button
                          onClick={() => handleLoadScene(scene.name)}
                          className={styles.loadButton}
                          title={`Load Scene${hasModularAutomation && activeModules > 0 ? ` (${activeModules} automation modules)` : ''}`}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteScene(scene.name)}
                          className={styles.deleteButton}
                          title="Delete Scene"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScenePanel
