/**
 * 书籍解析结果的 IndexedDB 缓存模块
 *
 * ## 为什么用 IndexedDB 而不是 localStorage？
 *
 * localStorage 有 5-10MB 的存储限制，而一本书的解析结果
 * （content + pages）可能达到 10-15MB。IndexedDB 的存储限制
 * 通常为磁盘空间的 50%+，完全够用。
 *
 * ## 缓存策略
 *
 * cacheKey = bookId + fileSize + mtime + pageConfigHash
 * - bookId：唯一标识一本书
 * - fileSize + mtime：检测文件是否被修改
 * - pageConfigHash：检测分页参数是否变化（窗口大小、字号、行高等）
 *
 * 任何一个字段变化 → 缓存未命中 → 重新解析
 *
 * ## 学习要点
 *
 * IndexedDB 是浏览器内置的 NoSQL 数据库：
 * - 异步 API（不会阻塞 UI）
 * - 支持结构化克隆（可以直接存 JS 对象，比 JSON.stringify 快）
 * - 事务模型（类似数据库的 BEGIN/COMMIT）
 * - 索引查询（可以按字段高效查找）
 */

import type { Chapter, ChapterPageMap, Page } from '@/types/book';

/* ---- 常量 ---- */

const DB_NAME = 'setsuna-read-cache';
const DB_VERSION = 1;
const STORE_NAME = 'bookCache';

/* ---- 类型定义 ---- */

/** 缓存条目的元数据（用于匹配和验证） */
interface CacheMeta {
  bookId: string;
  fileSize: number;
  mtime: number;
  pageConfigHash: string;
}

/** 缓存的完整数据 */
interface CachedBookData {
  content: string;
  chapters: Chapter[];
  pages: Page[];
  chapterPageMap: ChapterPageMap[];
  totalPages: number;
}

/** IndexedDB 中存储的条目 = 元数据 + 数据 */
interface CacheEntry extends CacheMeta {
  data: CachedBookData;
  /** 写入时间，用于 LRU 淘汰 */
  savedAt: number;
}

/* ---- 工具函数 ---- */

/**
 * 计算 pageConfig 的哈希值
 *
 * 将影响分页的参数序列化为字符串，用于比较是否相同。
 * 不需要加密级哈希，JSON.stringify 比较就够了——
 * 因为我们只在同一次调用中比较字符串相等性。
 */
export function hashPageConfig(config: {
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
}): string {
  return JSON.stringify({
    w: config.width,
    h: config.height,
    fs: config.fontSize,
    ff: config.fontFamily,
    lh: config.lineHeight,
  });
}

/* ---- IndexedDB 连接管理 ---- */

/**
 * 打开（或创建）IndexedDB 数据库
 *
 * IndexedDB 的打开是异步的，返回 IDBOpenDBRequest。
 * 我们用 Promise 包装它，方便在 async 函数中使用。
 *
 * onupgradeneeded 只在数据库版本升级时触发（首次创建也算），
 * 这里用来创建 ObjectStore（类似数据库的"表"）。
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建 ObjectStore，用 bookId 作为主键
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
        // 创建复合索引：用于按 fileSize + mtime + pageConfigHash 查找
        store.createIndex('lookup', ['bookId', 'fileSize', 'mtime', 'pageConfigHash']);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* ---- 核心 API ---- */

/**
 * 查询缓存
 *
 * 流程：打开 DB → 开启事务 → 查询匹配的条目 → 返回数据或 null
 *
 * @param bookId 书籍 ID
 * @param fileSize 文件大小（字节）
 * @param mtime 文件修改时间戳（毫秒）
 * @param pageConfigHash 分页参数哈希
 * @returns 缓存的数据，未命中返回 null
 */
export async function getCache(
  bookId: string,
  fileSize: number,
  mtime: number,
  pageConfigHash: string,
): Promise<CachedBookData | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(bookId);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        db.close();

        if (!entry) {
          resolve(null);
          return;
        }

        // 验证所有字段是否匹配
        if (
          entry.fileSize === fileSize &&
          entry.mtime === mtime &&
          entry.pageConfigHash === pageConfigHash
        ) {
          console.log('[bookCache] 缓存命中:', bookId);
          resolve(entry.data);
        } else {
          console.log('[bookCache] 缓存过期:', bookId, {
            oldSize: entry.fileSize, newSize: fileSize,
            oldMtime: entry.mtime, newMtime: mtime,
            oldConfig: entry.pageConfigHash, newConfig: pageConfigHash,
          });
          resolve(null);
        }
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[bookCache] 读取缓存失败:', err);
    return null;
  }
}

/**
 * 写入缓存
 *
 * 使用 put 而不是 add，这样如果 bookId 已存在会覆盖旧数据。
 */
export async function setCache(
  bookId: string,
  fileSize: number,
  mtime: number,
  pageConfigHash: string,
  data: CachedBookData,
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        bookId,
        fileSize,
        mtime,
        pageConfigHash,
        data,
        savedAt: Date.now(),
      };
      const request = store.put(entry);

      request.onsuccess = () => {
        db.close();
        console.log('[bookCache] 缓存写入:', bookId, `(${(data.content.length * 2 / 1024 / 1024).toFixed(1)}MB)`);
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    // 缓存写入失败不应该影响正常流程，静默处理
    console.warn('[bookCache] 写入缓存失败:', err);
  }
}

/**
 * 删除某本书的所有缓存
 *
 * 删除书籍时调用，避免 IndexedDB 中残留无用数据。
 */
export async function deleteCache(bookId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(bookId);

      request.onsuccess = () => {
        db.close();
        console.log('[bookCache] 缓存删除:', bookId);
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[bookCache] 删除缓存失败:', err);
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        db.close();
        console.log('[bookCache] 全部缓存已清空');
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[bookCache] 清空缓存失败:', err);
  }
}
