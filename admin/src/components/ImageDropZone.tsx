'use client';

import {
  DragEvent,
  ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

type Props = {
  onFiles: (files: File[]) => void | Promise<void>;
  multiple?: boolean;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
};

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name);
}

export function ImageDropZone({
  onFiles,
  multiple = false,
  disabled,
  busy,
  busyLabel = 'Yükleniyor…',
  hint = 'Sürükleyip bırakın veya tıklayın',
  className = '',
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);

  const takeFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || disabled || busy) return;
      const files = Array.from(list).filter(isImageFile);
      if (!files.length) return;
      void onFiles(multiple ? files : files.slice(0, 1));
    },
    [busy, disabled, multiple, onFiles],
  );

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || busy) return;
    setDragOver(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    takeFiles(e.dataTransfer.files);
  }

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-border-muted bg-background hover:border-accent/50 hover:bg-surface-high/40'
        } ${disabled || busy ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          disabled={disabled || busy}
          className="sr-only"
          onChange={(e) => {
            takeFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {busy ? (
          <span className="text-sm text-muted">{busyLabel}</span>
        ) : (
          <>
            <span className="mono text-[10px] uppercase tracking-widest text-muted">
              Drop_Zone
            </span>
            <span className="text-sm text-foreground">{hint}</span>
            <span className="text-xs text-muted">
              JPEG, PNG, WebP, GIF, AVIF
              {multiple ? ' · birden fazla' : ''}
            </span>
          </>
        )}
        {children}
      </label>
    </div>
  );
}
