import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import styles from './CanvasImageUpload.module.scss';
export const CanvasImageUpload = ({ onImageUploaded, currentImage }) => {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const handleFileSelect = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        const reader = new FileReader();
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                setUploadProgress((e.loaded / e.total) * 100);
            }
        };
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                onImageUploaded(img);
                setIsUploading(false);
                setUploadProgress(100);
            };
            img.src = e.target?.result;
        };
        reader.readAsDataURL(file);
    };
    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };
    const clearImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Create an empty image to represent "no background"
        const emptyImg = new Image();
        onImageUploaded(emptyImg);
    };
    return (_jsxs("div", { className: styles.canvasImageUpload, children: [_jsxs("div", { className: styles.header, children: [_jsx("h3", { children: "2D Canvas Background" }), currentImage && currentImage.src && (_jsxs("button", { className: styles.clearButton, onClick: clearImage, title: "Remove background image", children: [_jsx("i", { className: "fas fa-trash" }), "Clear"] }))] }), _jsxs("div", { className: `${styles.dropZone} ${isDragOver ? styles.dragOver : ''} ${isUploading ? styles.uploading : ''}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), children: [isUploading ? (_jsxs("div", { className: styles.uploadProgress, children: [_jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progressFill, style: { width: `${uploadProgress}%` } }) }), _jsxs("span", { children: ["Uploading... ", Math.round(uploadProgress), "%"] })] })) : currentImage && currentImage.src ? (_jsxs("div", { className: styles.currentImage, children: [_jsx("img", { src: currentImage.src, alt: "Canvas background", className: styles.preview }), _jsxs("div", { className: styles.imageInfo, children: [_jsx("p", { children: "Background image loaded" }), _jsx("p", { children: "Click to change or drag new image" })] })] })) : (_jsxs("div", { className: styles.placeholder, children: [_jsx("i", { className: "fas fa-cloud-upload-alt" }), _jsx("h4", { children: "Upload 2D Canvas Background" }), _jsx("p", { children: "Drag & drop an image here or click to browse" }), _jsx("p", { className: styles.supportedFormats, children: "Supported: JPG, PNG, GIF, WebP" })] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileInputChange, className: styles.hiddenInput })] }), _jsxs("div", { className: styles.instructions, children: [_jsx("h4", { children: "Tips for best results:" }), _jsxs("ul", { children: [_jsx("li", { children: "Use a floor plan or venue layout image" }), _jsx("li", { children: "Higher resolution images provide better fixture placement accuracy" }), _jsx("li", { children: "JPG format recommended for performance" }), _jsx("li", { children: "Image will be automatically scaled to fit the canvas" })] })] })] }));
};
