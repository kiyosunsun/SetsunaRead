#!/bin/sh
#
# backfill-changelog.sh
# 一次性脚本：从 git 历史中提取 conventional commits，生成 CHANGELOG.md
# 用法：在项目根目录执行 ./scripts/backfill-changelog.sh
#
# 支持的类型：feat → 新增 | fix → 修复 | style → 变更 | docs → 文档
#

CHANGELOG="CHANGELOG.md"

# 如果 CHANGELOG.md 已存在，备份
if [ -f "$CHANGELOG" ]; then
    cp "$CHANGELOG" "${CHANGELOG}.bak"
    echo "已备份现有 ${CHANGELOG} → ${CHANGELOG}.bak"
fi

# 写入文件头
cat > "$CHANGELOG" << 'HEADER'
# 更新日志

> 本文件由脚本自动生成，格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。
> 仅记录 `feat`、`fix`、`style`、`docs` 类型的提交。

HEADER

# 遍历所有 commit（从旧到新），按日期分组
CURRENT_DATE=""

git log --no-merges --reverse --format="%h|%s|%ai" | while IFS='|' read -r HASH MSG DATE_FULL; do

    # 提取日期部分（YYYY-MM-DD）
    DATE=$(echo "$DATE_FULL" | cut -d' ' -f1)

    # 解析 type
    TYPE=$(echo "$MSG" | sed -n 's/^\([a-z]*\).*/\1/p')
    DESC=$(echo "$MSG" | sed 's/^[a-z]*[^:]*: *//')

    # 跳过不支持的类型
    case "$TYPE" in
        feat)  LABEL="新增" ;;
        fix)   LABEL="修复" ;;
        style) LABEL="变更" ;;
        docs)  LABEL="文档" ;;
        *)     continue ;;
    esac

    # 新的日期段
    if [ "$DATE" != "$CURRENT_DATE" ]; then
        CURRENT_DATE="$DATE"
        echo "" >> "$CHANGELOG"
        echo "## ${DATE}" >> "$CHANGELOG"
        echo "" >> "$CHANGELOG"
    fi

    # 写入条目
    echo "- \`${HASH}\` ${LABEL} ${DESC}" >> "$CHANGELOG"

done

echo "已生成 ${CHANGELOG}，共 $(grep -c '^- `' "$CHANGELOG") 条记录"
