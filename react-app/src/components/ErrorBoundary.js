import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error to console for debugging
        console.error('React Error Boundary caught an error:', error, errorInfo);
        // Update state with full error information
        this.setState({
            hasError: true,
            error,
            errorInfo
        });
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: {
                    padding: '20px',
                    margin: '20px',
                    border: '2px solid #ff4444',
                    borderRadius: '8px',
                    backgroundColor: '#fff5f5',
                    fontFamily: 'monospace',
                    maxHeight: '80vh',
                    overflow: 'auto'
                }, children: [_jsx("h2", { style: { color: '#cc0000', marginTop: 0 }, children: "\uD83D\uDEA8 React Application Error" }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("h3", { style: { color: '#aa0000' }, children: "Error Message:" }), _jsx("div", { style: {
                                    padding: '10px',
                                    backgroundColor: '#ffeeee',
                                    border: '1px solid #ffaaaa',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    color: '#cc0000'
                                }, children: this.state.error?.message || 'Unknown error occurred' })] }), this.state.error?.stack && (_jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("h3", { style: { color: '#aa0000' }, children: "Stack Trace:" }), _jsx("pre", { style: {
                                    padding: '10px',
                                    backgroundColor: '#f8f8f8',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    whiteSpace: 'pre-wrap'
                                }, children: this.state.error.stack })] })), this.state.errorInfo?.componentStack && (_jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("h3", { style: { color: '#aa0000' }, children: "Component Stack:" }), _jsx("pre", { style: {
                                    padding: '10px',
                                    backgroundColor: '#f8f8f8',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    whiteSpace: 'pre-wrap'
                                }, children: this.state.errorInfo.componentStack })] })), _jsxs("div", { style: { marginTop: '20px' }, children: [_jsx("button", { onClick: () => window.location.reload(), style: {
                                    padding: '10px 20px',
                                    backgroundColor: '#007acc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }, children: "\uD83D\uDD04 Reload Page" }), _jsx("button", { onClick: () => this.setState({ hasError: false, error: undefined, errorInfo: undefined }), style: {
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }, children: "\uD83D\uDD27 Try Again" })] }), _jsxs("div", { style: {
                            marginTop: '20px',
                            padding: '10px',
                            backgroundColor: '#e6f3ff',
                            border: '1px solid #b3d9ff',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }, children: [_jsx("strong", { children: "\uD83D\uDCA1 Debug Tips:" }), _jsxs("ul", { style: { margin: '10px 0', paddingLeft: '20px' }, children: [_jsx("li", { children: "Check the browser's Developer Console (F12) for additional errors" }), _jsx("li", { children: "Look for network errors in the Network tab" }), _jsx("li", { children: "Verify the backend server is running on port 3030" }), _jsx("li", { children: "Check if all required dependencies are installed" })] })] })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
