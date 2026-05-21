import React from 'react';
import type { ImportProgress } from '@/types/importProgress';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  title: string;
  progress: ImportProgress;
  onCancel: () => void;
};

const stageLabel: Record<ImportProgress['stage'], string> = {
  reading: '正在读取文件',
  decoding: '正在解码文本',
  chapters: '正在识别章节',
  pagination: '正在分页排版',
  finalizing: '正在整理数据',
};

export default function ImportProgressOverlay({ open, title, progress, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className={cn(
          'relative w-[520px] max-w-[92vw] rounded-2xl border shadow-2xl overflow-hidden',
          'bg-[#111114] border-[rgba(160,121,45,0.25)]',
        )}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="text-sm tracking-widest text-[rgba(160,121,45,0.75)] select-none">开卷有益</div>
          <h3 className="mt-1 text-lg font-semibold text-[rgba(246,241,230,0.92)] truncate">正在打开《{title}》</h3>

          <div className="mt-4 text-sm text-[rgba(246,241,230,0.75)]">
            {stageLabel[progress.stage]} · {progress.message}
          </div>

          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8b6914] via-[#a0792d] to-[#b43a2f]"
              style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            />
          </div>

          <div className="mt-2 text-right text-xs text-white/50 tabular-nums">{progress.percent.toFixed(0)}%</div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm border border-white/10 text-white/80 hover:bg-white/5"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
