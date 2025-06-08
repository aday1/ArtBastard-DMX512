import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import styles from './BpmIndicator.module.scss'

export const BpmIndicator: React.FC = () => {
  const [isDownbeat, setIsDownbeat] = useState(false)
  const [beatCount, setBeatCount] = useState(0)
  const lastBeatTimeRef = useRef<number>(0)
  
  // Get BPM from store (you may need to adjust this based on your store structure)
  const bpm = useStore(state => state.bpm || 120) // Default to 120 BPM
  const isPlaying = useStore(state => state.isPlaying || false)

  useEffect(() => {
    if (!isPlaying || bpm <= 0) return

    const beatInterval = (60 / bpm) * 1000 // Convert BPM to milliseconds
    
    const beatTimer = setInterval(() => {
      const now = Date.now()
      lastBeatTimeRef.current = now
      
      setBeatCount(prev => {
        const newCount = (prev + 1) % 4 // 4/4 time signature
        setIsDownbeat(newCount === 0) // Downbeat is the first beat of the measure
        return newCount
      })
      
      // Flash effect duration
      setTimeout(() => setIsDownbeat(false), 100)
    }, beatInterval)

    return () => clearInterval(beatTimer)
  }, [bpm, isPlaying])

  if (!isPlaying) return null

  return (
    <div className={styles.bpmContainer}>
      <div className={`${styles.bpmIndicator} ${isDownbeat ? styles.downbeat : styles.beat}`}>
        <div className={styles.bpmDisplay}>
          <span className={styles.bpmValue}>{bpm}</span>
          <span className={styles.bpmLabel}>BPM</span>
        </div>
        <div className={styles.beatCounter}>
          {[0, 1, 2, 3].map(beat => (
            <div 
              key={beat}
              className={`${styles.beatDot} ${beatCount === beat ? styles.active : ''} ${beatCount === beat && isDownbeat ? styles.downbeatDot : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BpmIndicator
