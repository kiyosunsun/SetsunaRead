import type { ImportProgress } from '@/types/importProgress';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  title: string;
  progress: ImportProgress;
  onCancel: () => void;
};

/* ---------------------------------------------------------------------------
   阶段标签
   --------------------------------------------------------------------------- */
const stageLabel: Record<ImportProgress['stage'], string> = {
  reading: '正在读取文件',
  decoding: '正在解码文本',
  chapters: '正在识别章节',
  pagination: '正在分页排版',
  finalizing: '正在整理数据',
};

/* ---------------------------------------------------------------------------
   导入进度遮罩层
   深色木质风格，使用新设计系统颜色
   --------------------------------------------------------------------------- */
export default function ImportProgressOverlay({ open, title, progress, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 弹窗卡片 */}
      <div
        className={cn(
          'relative w-[520px] max-w-[92vw] rounded-2xl border shadow-2xl overflow-hidden',
        )}
        style={{
          background: '#111114',
          borderColor: 'rgba(184,134,11,0.25)', // brass 色系
        }}
      >
        {/* 顶部铜金色装饰线 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
          }}
        />

        {/* 内容区域 */}
        <div className="px-6 pt-6 pb-4">
          {/* 副标题 */}
          <div
            className="text-sm tracking-widest select-none"
            style={{ color: 'rgba(184,134,11,0.75)' }}
          >
            开卷有益
          </div>

          {/* 书名 */}
          <h3
            className="mt-1 text-lg font-semibold truncate"
            style={{ color: 'rgba(244,234,213,0.92)' }}
          >
            正在打开《{title}》
          </h3>

          {/* 阶段信息 */}
          <div
            className="mt-4 text-sm"
            style={{ color: 'rgba(244,234,213,0.75)' }}
          >
            {stageLabel[progress.stage]} · {progress.message}
          </div>

          {/* 进度条 */}
          <div
            className="mt-3 h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #8b6914, #a0792d, #b43a2f)',
                width: `${Math.min(100, Math.max(0, progress.percent))}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* 百分比 */}
          <div
            className="mt-2 text-right text-xs tabular-nums"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {progress.percent.toFixed(0)}%
          </div>
        </div>

        {/* 底部操作 */}
        <div className="px-6 pb-6 flex items-center justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm transition-colors"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
