/**
 * 本地文件存储工具
 * 用于从原始文件路径读取书籍内容
 */
import { readFile, exists } from '@tauri-apps/plugin-fs';

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
