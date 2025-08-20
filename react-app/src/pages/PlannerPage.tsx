import React from 'react'
import { useTheme } from '../context/ThemeContext'
import styles from './Pages.module.scss'

const PlannerPage: React.FC = () => {
  const { theme } = useTheme()

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2>
          {theme === 'artsnob' && '🎭 Universe Planner: From Zero to Hero'}
          {theme === 'standard' && 'DMX Universe Planner'}
          {theme === 'minimal' && 'DMX Planner'}
        </h2>
        <p>
          {theme === 'artsnob' && 'Welcome to your lighting control sanctuary! Use the fixture setup and configuration tools to build your luminous empire.'}
          {theme === 'standard' && 'Comprehensive DMX fixture planning and universe configuration'}
          {theme === 'minimal' && 'Plan and configure DMX fixtures'}
        </p>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.overviewSection}>
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '2px dashed var(--border-color)' }}>
            <h3>
              {theme === 'artsnob' && '🎨 Your Luminous Empire Awaits'}
              {theme === 'standard' && 'Universe Overview'}
              {theme === 'minimal' && 'Overview'}
            </h3>
            <p>
              {theme === 'artsnob' && 'Navigate to the Fixture Setup section to configure your lighting fixtures and build your DMX universe. The 2D Canvas provides visual fixture layout tools.'}
              {theme === 'standard' && 'Use the Fixture Setup panel to configure your lighting fixtures and the 2D Canvas for visual layout planning.'}
              {theme === 'minimal' && 'Use Fixture Setup and 2D Canvas panels.'}
            </p>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', minWidth: '200px' }}>
                <h4>🔧 Fixture Setup</h4>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>Configure lighting fixtures, channels, and addresses</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', minWidth: '200px' }}>
                <h4>🎨 2D Canvas</h4>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>Visual fixture layout and positioning</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', minWidth: '200px' }}>
                <h4>🎮 Super Control</h4>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>Advanced fixture control and monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlannerPage