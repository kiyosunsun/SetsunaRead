/**
 * 本地文件存储工具
 * 用于从原始文件路径读取书籍内容
 */
import { readFile, exists, stat } from '@tauri-apps/plugin-fs';

/**
 * 从指定路径读取书籍文件
 * @param filePath 文件的绝对路径
 * @returns 文件内容（ArrayBuffer），如果文件不存在或读取失败返回 null
 */
export async function loadBookFile(filePath: string): Promise<ArrayBuffer | null> {
  if (!filePath) return null;

  try {
    const fileExists = await exists(filePath);
    if (!fileExists) {
      return null;
    }

    const content = await readFile(filePath);
    // readFile 返回 Uint8Array，需要转换为 ArrayBuffer
    return content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength
    );
  } catch {
    return null;
  }
}

/**
 * 获取文件元数据（大小 + 修改时间）
 * 用于缓存 key 的一部分，判断文件是否变化
 * @param filePath 文件的绝对路径
 * @returns 文件大小（字节）和修改时间戳（毫秒），失败返回 null
 */
export async function getFileStats(filePath: string): Promise<{ size: number; mtime: number } | null> {
  try {
    const info = await stat(filePath);
    return {
      size: info.size,
      // mtime 可能为 null（某些文件系统不支持），降级为 0
      mtime: info.mtime instanceof Date ? info.mtime.getTime() : 0,
    };
  } catch {
    return null;
  }
}
