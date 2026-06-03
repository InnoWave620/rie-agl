'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { formatFileSize } from '../../lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 10,
  className = '',
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (f: File) => {
      setError(null);
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['pdf', 'doc', 'docx'].includes(ext)) {
        setError('Only PDF, DOC, and DOCX files are accepted.');
        return;
      }
      setFile(f);
      onFileSelect(f);
    },
    [maxSizeMB, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  };

  const removeFile = () => {
    setFile(null);
    onFileSelect(null);
    setError(null);
  };

  if (file) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl border-2 animate-scale-in"
        style={{ borderColor: '#22C55E', background: '#DCFCE7' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#22C55E' }}
        >
          <FileText size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: '#15803D' }}>
            {file.name}
          </div>
          <div className="text-xs" style={{ color: '#16A34A' }}>
            {formatFileSize(file.size)} • Ready to upload
          </div>
        </div>
        <CheckCircle size={20} style={{ color: '#22C55E', flexShrink: 0 }} />
        <button
          type="button"
          onClick={removeFile}
          className="btn btn-ghost btn-sm rounded-full p-1"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        htmlFor="file-upload"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: dragging ? '#1C355E' : '#D1D5DB',
          background: dragging ? '#EEF2F9' : '#F9FAFB',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          style={{ background: dragging ? '#1C355E' : '#E5E7EB' }}
        >
          <Upload size={22} style={{ color: dragging ? 'white' : '#9CA3AF' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: '#142440' }}>
            {dragging ? 'Drop your file here' : 'Drag & drop your CV here'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            or{' '}
            <span className="font-semibold" style={{ color: '#F58220' }}>
              browse to upload
            </span>
          </p>
        </div>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          PDF, DOC, DOCX • Max {maxSizeMB}MB
        </p>
        <input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
      {error && (
        <p className="mt-2 text-sm font-medium" style={{ color: '#EF4444' }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
