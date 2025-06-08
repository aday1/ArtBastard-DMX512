import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const RouterContext = createContext(undefined);
export const RouterProvider = ({ children }) => {
    const [currentView, setCurrentView] = useState('main');
    const [navigationHistory, setNavigationHistory] = useState(['main']);
    // Listen for navigation events from navbar
    useEffect(() => {
        const handleViewChange = (event) => {
            const newView = event.detail.view;
            setCurrentView(newView);
            setNavigationHistory(prev => [...prev, newView]);
        };
        window.addEventListener('changeView', handleViewChange);
        return () => {
            window.removeEventListener('changeView', handleViewChange);
        };
    }, []);
    const handleSetCurrentView = (view) => {
        setCurrentView(view);
        setNavigationHistory(prev => [...prev, view]);
    };
    const goBack = () => {
        if (navigationHistory.length > 1) {
            const newHistory = navigationHistory.slice(0, -1);
            const previousView = newHistory[newHistory.length - 1];
            setNavigationHistory(newHistory);
            setCurrentView(previousView);
        }
    };
    const canGoBack = navigationHistory.length > 1;
    return (_jsx(RouterContext.Provider, { value: {
            currentView,
            setCurrentView: handleSetCurrentView,
            navigationHistory,
            goBack,
            canGoBack
        }, children: children }));
};
export const useRouter = () => {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter must be used within a RouterProvider');
    }
    return context;
};
