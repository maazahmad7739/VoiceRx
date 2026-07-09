'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Trash2 } from 'lucide-react';

export default function AudioUploader({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Validate file type
      if (isValidAudio(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidAudio(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const isValidAudio = (file) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.mpeg', '.webm', '.ogg'];
    const fileName = file.name.toLowerCase();
    const isExtensionValid = validExtensions.some(ext => fileName.endsWith(ext));
    const isMimeValid = file.type.startsWith('audio/') || file.type.includes('mpeg') || file.type.includes('mp4');
    
    return isExtensionValid || isMimeValid;
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <UploadCloud className="h-5 w-5 text-blue-600" />
        <h4 className="font-bold text-sm">Mode 2: Upload Pre-recorded Audio File</h4>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
          dragActive
            ? 'border-blue-500 bg-blue-500/5'
            : selectedFile
            ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
            : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-white dark:bg-slate-900'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={handleChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-3 flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
              <FileAudio className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadCloud className="h-10 w-10 text-slate-400 mx-auto stroke-[1.2]" />
            <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Drag & drop audio consultation here or <span className="text-blue-605 underline">browse</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Supports MP3, WAV, or M4A (Max 20MB)
            </p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={removeFile}
            className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/5 border border-rose-500/10 px-3 py-1.5 rounded-xl transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove File</span>
          </button>
        </div>
      )}
    </div>
  );
}
