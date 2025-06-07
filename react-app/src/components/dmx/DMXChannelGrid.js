import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { DockableComponent } from '../ui/DockableComponent';
import { useStore } from '../../store';
import styles from './DMXChannelGrid.module.scss';
export const DMXChannelGrid = ({ onChannelSelect, selectedChannels = [], maxChannels = 512, isMinimized = false, onMinimizedChange, isDockable = true }) => {
    const [localSelectedChannels, setLocalSelectedChannels] = useState(new Set(selectedChannels));
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [channelsPerRow, setChannelsPerRow] = useState(16);
    const { dmxChannels, fixtures } = useStore(state => ({
        dmxChannels: state.dmxChannels,
        fixtures: state.fixtures,
    }));
    const handleChannelClick = useCallback((channel) => {
        const newSelected = new Set(localSelectedChannels);
        if (isMultiSelect) {
            if (newSelected.has(channel)) {
                newSelected.delete(channel);
            }
            else {
                newSelected.add(channel);
            }
        }
        else {
            newSelected.clear();
            newSelected.add(channel);
        }
        setLocalSelectedChannels(newSelected);
        onChannelSelect?.(channel);
    }, [isMultiSelect, localSelectedChannels, onChannelSelect]);
    const getChannelInfo = useCallback((channel) => {
        // Find which fixture this channel belongs to
        const fixture = fixtures?.find(f => {
            const startAddr = f.startAddress - 1; // Convert to 0-indexed
            const endAddr = startAddr + f.channels.length - 1;
            return channel >= startAddr && channel <= endAddr;
        });
        if (fixture) {
            const channelIndex = channel - (fixture.startAddress - 1);
            const channelDef = fixture.channels[channelIndex];
            return {
                fixtureName: fixture.name,
                channelName: channelDef?.name || `Ch ${channelIndex + 1}`,
                channelType: channelDef?.type || 'unknown',
                value: dmxChannels[channel] || 0
            };
        }
        return {
            fixtureName: 'Unassigned',
            channelName: `Channel ${channel + 1}`,
            channelType: 'dimmer',
            value: dmxChannels[channel] || 0
        };
    }, [fixtures, dmxChannels]);
    const filteredChannels = React.useMemo(() => {
        const channels = Array.from({ length: maxChannels }, (_, i) => i);
        if (!searchTerm)
            return channels;
        return channels.filter(channel => {
            const info = getChannelInfo(channel);
            return (info.fixtureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                info.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (channel + 1).toString().includes(searchTerm));
        });
    }, [maxChannels, searchTerm, getChannelInfo]);
    const renderChannel = useCallback((channel) => {
        const info = getChannelInfo(channel);
        const isSelected = localSelectedChannels.has(channel);
        const hasValue = info.value > 0;
        return (_jsxs("div", { className: `${styles.channelItem} ${isSelected ? styles.selected : ''} ${hasValue ? styles.hasValue : ''}`, onClick: () => handleChannelClick(channel), title: `${info.fixtureName} - ${info.channelName} (${info.value})`, children: [_jsx("div", { className: styles.channelNumber, children: channel + 1 }), _jsx("div", { className: styles.channelValue, children: info.value }), _jsx("div", { className: styles.channelName, children: info.channelName }), hasValue && (_jsx("div", { className: styles.valueBar, style: { width: `${(info.value / 255) * 100}%` } }))] }, channel));
    }, [getChannelInfo, localSelectedChannels, handleChannelClick]);
    const content = (_jsxs("div", { className: styles.dmxChannelGrid, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.title, children: [_jsx("span", { className: styles.icon, children: "\uD83C\uDF9B\uFE0F" }), _jsx("h3", { children: "DMX Channels" })] }), onMinimizedChange && (_jsx("button", { className: styles.minimizeButton, onClick: () => onMinimizedChange(!isMinimized), title: isMinimized ? 'Expand' : 'Minimize', children: isMinimized ? '📈' : '📉' }))] }), !isMinimized && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.controls, children: [_jsx("div", { className: styles.searchContainer, children: _jsx("input", { type: "text", placeholder: "Search channels, fixtures...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: styles.searchInput }) }), _jsxs("div", { className: styles.viewControls, children: [_jsxs("label", { className: styles.checkbox, children: [_jsx("input", { type: "checkbox", checked: isMultiSelect, onChange: (e) => setIsMultiSelect(e.target.checked) }), "Multi-select"] }), _jsxs("div", { className: styles.viewModeButtons, children: [_jsx("button", { className: `${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`, onClick: () => setViewMode('grid'), title: "Grid View", children: "\u229E" }), _jsx("button", { className: `${styles.viewModeButton} ${viewMode === 'list' ? styles.active : ''}`, onClick: () => setViewMode('list'), title: "List View", children: "\u2630" })] }), viewMode === 'grid' && (_jsxs("select", { value: channelsPerRow, onChange: (e) => setChannelsPerRow(Number(e.target.value)), className: styles.channelsPerRowSelect, children: [_jsx("option", { value: 8, children: "8 per row" }), _jsx("option", { value: 16, children: "16 per row" }), _jsx("option", { value: 24, children: "24 per row" }), _jsx("option", { value: 32, children: "32 per row" })] }))] })] }), _jsx("div", { className: styles.selectedInfo, children: localSelectedChannels.size > 0 && (_jsxs("span", { children: ["Selected: ", Array.from(localSelectedChannels).map(ch => ch + 1).join(', ')] })) }), _jsx("div", { className: `${styles.channelContainer} ${styles[viewMode]}`, style: viewMode === 'grid' ? { gridTemplateColumns: `repeat(${channelsPerRow}, 1fr)` } : {}, children: filteredChannels.map(renderChannel) }), _jsxs("div", { className: styles.footer, children: [_jsxs("span", { className: styles.channelCount, children: ["Showing ", filteredChannels.length, " of ", maxChannels, " channels"] }), _jsx("button", { className: styles.clearButton, onClick: () => setLocalSelectedChannels(new Set()), disabled: localSelectedChannels.size === 0, children: "Clear Selection" })] })] }))] }));
    if (!isDockable) {
        return content;
    }
    return (_jsx(DockableComponent, { id: "dmx-channel-grid", title: "DMX Channel Grid", component: "dmx-channel-grid", defaultPosition: { zone: 'floating', offset: { x: 100, y: 100 } }, defaultZIndex: 1000, isMinimized: isMinimized, onMinimizedChange: onMinimizedChange, children: content }));
};
