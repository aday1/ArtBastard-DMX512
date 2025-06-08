import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Sparkles.module.scss';
import { useStore } from '../../store';
const MAX_SPARKLES = 50; // Increased limit for more sparkles on screen
const SPARKLE_LIFESPAN = 1500; // ms, updated to match animation duration
const DMX_CHANGE_COOLDOWN = 50; // ms, reduced cooldown for more responsive sparkles
export const Sparkles = () => {
    const [sparkles, setSparkles] = useState([]);
    const dmxChannels = useStore(state => state.dmxChannels);
    const lastDmxActivityTimeRef = useRef(0);
    const prevDmxChannelsRef = useRef(dmxChannels);
    const addSparkle = useCallback(() => {
        setSparkles(currentSparkles => {
            const now = Date.now();
            // Remove oldest sparkles if limit is reached
            const filteredSparkles = currentSparkles.length >= MAX_SPARKLES
                ? currentSparkles.slice(currentSparkles.length - MAX_SPARKLES + 1)
                : currentSparkles;
            const newSparkle = {
                id: `sparkle-${now}-${Math.random()}`,
                x: Math.random() * 100,
                y: Math.random() * 100,
                key: Math.random(), // Force re-render for animation
            };
            return [...filteredSparkles, newSparkle];
        });
    }, []);
    // Manual test feature - add sparkle every 2 seconds for testing
    useEffect(() => {
        const testInterval = setInterval(() => {
            addSparkle();
            console.log('Test sparkle added for visual verification');
        }, 2000);
        // Clean up after 30 seconds
        const cleanupTimeout = setTimeout(() => {
            clearInterval(testInterval);
            console.log('Sparkle test mode disabled');
        }, 30000);
        return () => {
            clearInterval(testInterval);
            clearTimeout(cleanupTimeout);
        };
    }, [addSparkle]);
    useEffect(() => {
        // Effect to add sparkle on DMX channel change
        const dmxChanged = prevDmxChannelsRef.current.some((val, i) => val !== dmxChannels[i]);
        if (dmxChanged) {
            const now = Date.now();
            if (now - lastDmxActivityTimeRef.current > DMX_CHANGE_COOLDOWN) {
                addSparkle();
                console.log('DMX activity detected - sparkle triggered!');
                lastDmxActivityTimeRef.current = now;
            }
        }
        prevDmxChannelsRef.current = [...dmxChannels]; // Store current DMX state for next comparison
    }, [dmxChannels, addSparkle]);
    useEffect(() => {
        // Periodically remove old sparkles based on their creation time (embedded in id)
        const intervalId = setInterval(() => {
            const now = Date.now();
            setSparkles(currentSparkles => currentSparkles.filter(s => now - parseInt(s.id.split('-')[1]) < SPARKLE_LIFESPAN));
        }, SPARKLE_LIFESPAN / 2); // Check more frequently than lifespan
        return () => clearInterval(intervalId);
    }, []);
    return (_jsx("div", { className: styles.sparkleContainer, children: sparkles.map(sparkle => (_jsx("div", { className: styles.sparkle, style: {
                top: `${sparkle.y}%`,
                left: `${sparkle.x}%`,
            } }, sparkle.key))) }));
};
