import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import styles from './FFTOSCAssignment.module.scss';
export const FFTOSCAssignment = ({ selectedBand, selectedRange, onAssignmentCreate }) => {
    const [assignments, setAssignments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        oscAddress: '',
        multiplier: 1,
        offset: 0,
        enabled: true
    });
    const { dmxChannels, fixtures, placedFixtures } = useStore();
    const { socket } = useSocket();
    // Auto-populate form when band/range is selected
    useEffect(() => {
        if (selectedBand && !selectedRange) {
            setFormData(prev => ({
                ...prev,
                oscAddress: `/fft/band/${selectedBand.index}`
            }));
            setShowForm(true);
        }
        else if (selectedRange) {
            setFormData(prev => ({
                ...prev,
                oscAddress: `/fft/range/${selectedRange.start}_${selectedRange.end}`
            }));
            setShowForm(true);
        }
    }, [selectedBand, selectedRange]);
    const createAssignment = () => {
        const newAssignment = {
            id: `assignment_${Date.now()}`,
            fftBandStart: selectedRange ? selectedRange.start : (selectedBand?.index || 0),
            fftBandEnd: selectedRange ? selectedRange.end : (selectedBand?.index || 0),
            oscAddress: formData.oscAddress,
            multiplier: formData.multiplier,
            offset: formData.offset,
            enabled: formData.enabled
        };
        setAssignments([...assignments, newAssignment]);
        onAssignmentCreate?.(newAssignment);
        setShowForm(false);
        resetForm();
    };
    const deleteAssignment = (id) => {
        setAssignments(assignments.filter(a => a.id !== id));
    };
    const toggleAssignment = (id) => {
        setAssignments(assignments.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    };
    const resetForm = () => {
        setFormData({
            oscAddress: '',
            multiplier: 1,
            offset: 0,
            enabled: true
        });
    };
    const getQuickOSCAddresses = () => {
        const addresses = [];
        // DMX channels
        Object.keys(dmxChannels).forEach(channel => {
            addresses.push(`/dmx/channel/${channel}`);
        });
        // Fixture channels
        placedFixtures.forEach(placedFixture => {
            const fixture = fixtures.find(f => f.id === placedFixture.fixtureId);
            if (fixture) {
                fixture.channels.forEach((channel, index) => {
                    addresses.push(`/fixture/${placedFixture.id}/channel/${index}`);
                    addresses.push(`/fixture/${placedFixture.id}/${channel.name.toLowerCase()}`);
                });
            }
        });
        // Master controls
        addresses.push('/master');
        addresses.push('/master/dimmer');
        addresses.push('/master/strobe');
        return addresses;
    };
    const quickSelectAddress = (address) => {
        setFormData(prev => ({ ...prev, oscAddress: address }));
    };
    return (_jsxs("div", { className: styles.fftOSCAssignment, children: [_jsxs("div", { className: styles.header, children: [_jsx("h3", { children: "FFT to OSC Assignments" }), _jsxs("button", { className: styles.addButton, onClick: () => setShowForm(true), children: [_jsx("i", { className: "fas fa-plus" }), "Add Assignment"] })] }), showForm && (_jsxs("div", { className: styles.assignmentForm, children: [_jsxs("div", { className: styles.formHeader, children: [_jsx("h4", { children: "Create New Assignment" }), _jsx("button", { className: styles.closeButton, onClick: () => setShowForm(false), children: _jsx("i", { className: "fas fa-times" }) })] }), _jsxs("div", { className: styles.selectionInfo, children: [selectedBand && !selectedRange && (_jsxs("div", { className: styles.bandInfo, children: [_jsx("strong", { children: "Selected Band:" }), " ", selectedBand.index, "(", Math.round(selectedBand.frequency), " Hz)"] })), selectedRange && (_jsxs("div", { className: styles.rangeInfo, children: [_jsx("strong", { children: "Selected Range:" }), " ", selectedRange.start, " - ", selectedRange.end, "(", Math.round((selectedRange.start / 1024) * 22050), " - ", Math.round((selectedRange.end / 1024) * 22050), " Hz)"] }))] }), _jsxs("div", { className: styles.formGrid, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "OSC Address:" }), _jsx("input", { type: "text", value: formData.oscAddress, onChange: (e) => setFormData(prev => ({ ...prev, oscAddress: e.target.value })), placeholder: "/your/osc/address" }), _jsxs("div", { className: styles.quickAddresses, children: [_jsx("label", { children: "Quick Select:" }), _jsx("div", { className: styles.addressButtons, children: getQuickOSCAddresses().slice(0, 8).map(address => (_jsx("button", { className: styles.addressButton, onClick: () => quickSelectAddress(address), children: address }, address))) })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Multiplier:" }), _jsx("input", { type: "number", step: "0.1", value: formData.multiplier, onChange: (e) => setFormData(prev => ({ ...prev, multiplier: parseFloat(e.target.value) })) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Offset:" }), _jsx("input", { type: "number", step: "0.1", value: formData.offset, onChange: (e) => setFormData(prev => ({ ...prev, offset: parseFloat(e.target.value) })) })] }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: formData.enabled, onChange: (e) => setFormData(prev => ({ ...prev, enabled: e.target.checked })) }), "Enabled"] }) })] }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { className: styles.createButton, onClick: createAssignment, disabled: !formData.oscAddress, children: "Create Assignment" }), _jsx("button", { className: styles.cancelButton, onClick: () => setShowForm(false), children: "Cancel" })] })] })), _jsxs("div", { className: styles.assignmentsList, children: [_jsxs("h4", { children: ["Active Assignments (", assignments.filter(a => a.enabled).length, ")"] }), assignments.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("p", { children: "No assignments created yet." }), _jsx("p", { children: "Select a frequency band in the FFT analyzer and click \"Add Assignment\"." })] })) : (_jsx("div", { className: styles.assignments, children: assignments.map(assignment => (_jsxs("div", { className: `${styles.assignment} ${!assignment.enabled ? styles.disabled : ''}`, children: [_jsxs("div", { className: styles.assignmentInfo, children: [_jsx("div", { className: styles.frequency, children: assignment.fftBandStart === assignment.fftBandEnd
                                                ? `Band ${assignment.fftBandStart}`
                                                : `Bands ${assignment.fftBandStart}-${assignment.fftBandEnd}` }), _jsxs("div", { className: styles.oscAddress, children: [_jsx("i", { className: "fas fa-arrow-right" }), assignment.oscAddress] }), _jsxs("div", { className: styles.parameters, children: ["\u00D7", assignment.multiplier, " +", assignment.offset] })] }), _jsxs("div", { className: styles.assignmentActions, children: [_jsx("button", { className: `${styles.toggleButton} ${assignment.enabled ? styles.enabled : styles.disabled}`, onClick: () => toggleAssignment(assignment.id), title: assignment.enabled ? 'Disable' : 'Enable', children: _jsx("i", { className: `fas ${assignment.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}` }) }), _jsx("button", { className: styles.deleteButton, onClick: () => deleteAssignment(assignment.id), title: "Delete Assignment", children: _jsx("i", { className: "fas fa-trash" }) })] })] }, assignment.id))) }))] }), _jsxs("div", { className: styles.instructions, children: [_jsx("h4", { children: "How to use:" }), _jsxs("ol", { children: [_jsx("li", { children: "Start the Audio FFT analyzer above" }), _jsx("li", { children: "Click on a frequency band or drag to select a range" }), _jsx("li", { children: "The assignment form will auto-populate - configure the OSC address" }), _jsx("li", { children: "Adjust multiplier and offset as needed" }), _jsx("li", { children: "The selected frequencies will automatically send values to your OSC address" })] })] })] }));
};
