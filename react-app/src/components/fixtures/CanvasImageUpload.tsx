import React, { useState, useRef } from 'react';
import styles from './CanvasImageUpload.module.scss';

interface CanvasImageUploadProps {
  onImageUploaded: (image: HTMLImageElement) => void;
  currentImage?: HTMLImageElement | null;
}

export const CanvasImageUpload: React.FC<CanvasImageUploadProps> = ({
  onImageUploaded,
  currentImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
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
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
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

  return (
    <div className={styles.canvasImageUpload}>
      <div className={styles.header}>
        <h3>2D Canvas Background</h3>
        {currentImage && currentImage.src && (
          <button 
            className={styles.clearButton}
            onClick={clearImage}
            title="Remove background image"
          >
            <i className="fas fa-trash"></i>
            Clear
          </button>
        )}
      </div>

      <div 
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''} ${isUploading ? styles.uploading : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className={styles.uploadProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span>Uploading... {Math.round(uploadProgress)}%</span>
          </div>
        ) : currentImage && currentImage.src ? (
          <div className={styles.currentImage}>
            <img 
              src={currentImage.src} 
              alt="Canvas background" 
              className={styles.preview}
            />
            <div className={styles.imageInfo}>
              <p>Background image loaded</p>
              <p>Click to change or drag new image</p>
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <i className="fas fa-cloud-upload-alt"></i>
            <h4>Upload 2D Canvas Background</h4>
            <p>Drag & drop an image here or click to browse</p>
            <p className={styles.supportedFormats}>
              Supported: JPG, PNG, GIF, WebP
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className={styles.hiddenInput}
        />
      </div>

      <div className={styles.instructions}>
        <h4>Tips for best results:</h4>
        <ul>
          <li>Use a floor plan or venue layout image</li>
          <li>Higher resolution images provide better fixture placement accuracy</li>
          <li>JPG format recommended for performance</li>
          <li>Image will be automatically scaled to fit the canvas</li>
        </ul>
      </div>
    </div>
  );
};
