#!/bin/sh
#
# install-hook.sh
# 将 post-commit hook 安装到当前项目的 .git/hooks/ 目录
# 用法：在项目根目录执行 ./scripts/install-hook.sh
#

HOOK_DIR=".git/hooks"
HOOK_FILE="${HOOK_DIR}/post-commit"

# 检查是否在 git 仓库中
if [ ! -d ".git" ]; then
    echo "错误：当前目录不是 git 仓库"
    exit 1
fi

# 如果 hook 已存在，备份
if [ -f "$HOOK_FILE" ]; then
    cp "$HOOK_FILE" "${HOOK_FILE}.bak"
    echo "已备份现有 hook → ${HOOK_FILE}.bak"
fi

# 写入 post-commit hook
cat > "$HOOK_FILE" << 'HOOK'
#!/bin/sh
#
# post-commit hook
# 每次 commit 后自动解析 conventional commit 格式，追加到 CHANGELOG.md
#
# 支持的类型：feat → 新增 | fix → 修复 | style → 变更 | docs → 文档
# 其他类型（chore、refactor 等）跳过，不写入 changelog
#

CHANGELOG="CHANGELOG.md"
DATE=$(date +%Y-%m-%d)

# 取最新一条 commit（跳过 merge commit）
COMMIT_MSG=$(git log -1 --no-merges --format="%s")
COMMIT_HASH=$(git log -1 --no-merges --format="%h")

# 没有 commit message 则退出
[ -z "$COMMIT_MSG" ] && exit 0

# 解析 type 和 description
# 格式：type: description 或 type(scope): description
TYPE=$(echo "$COMMIT_MSG" | sed -n 's/^\([a-z]*\).*/\1/p')
DESC=$(echo "$COMMIT_MSG" | sed 's/^[a-z]*[^:]*: *//')

# 没有匹配到 conventional format 则跳过
[ -z "$TYPE" ] && exit 0

# 映射类型到中文标签
case "$TYPE" in
    feat)     LABEL="新增" ;;
    fix)      LABEL="修复" ;;
    style)    LABEL="变更" ;;
    docs)     LABEL="文档" ;;
    *)        exit 0 ;;  # 其他类型不记录
esac

# 构造 changelog 条目
ENTRY="- \`${COMMIT_HASH}\` ${LABEL} ${DESC}"

# 如果 CHANGELOG.md 不存在，创建文件头
if [ ! -f "$CHANGELOG" ]; then
    cat > "$CHANGELOG" << 'HEADER'
# 更新日志

> 本文件由 git hook 自动生成，格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。
> 仅记录 `feat`、`fix`、`style`、`docs` 类型的提交。

HEADER
fi

# 查找今天的日期标题行号（格式：## YYYY-MM-DD）
LINE=$(grep -n "^## ${DATE}" "$CHANGELOG" | head -n 1 | cut -d: -f1)

if [ -n "$LINE" ]; then
    # 今天的标题已存在，找到该日期段的末尾（下一个 ## 之前）插入
    TOTAL=$(wc -l < "$CHANGELOG")
    INSERT_LINE=$((LINE + 1))

    FOUND_NEXT=0
    while [ $INSERT_LINE -le $TOTAL ]; do
        CURRENT_LINE=$(sed -n "${INSERT_LINE}p" "$CHANGELOG")
        case "$CURRENT_LINE" in
            "## "*)
                FOUND_NEXT=1
                break
                ;;
        esac
        INSERT_LINE=$((INSERT_LINE + 1))
    done

    if [ $FOUND_NEXT -eq 1 ]; then
        INSERT_LINE=$((INSERT_LINE - 1))
        sed -i "${INSERT_LINE}i\\
${ENTRY}" "$CHANGELOG"
    else
        echo "$ENTRY" >> "$CHANGELOG"
    fi
else
    # 追加新的日期段
    {
        echo ""
        echo "## ${DATE}"
        echo ""
        echo "$ENTRY"
    } >> "$CHANGELOG"
fi

# 暂存 CHANGELOG.md，下次 commit 自动包含
git add "$CHANGELOG"
HOOK

# 设置可执行权限
chmod +x "$HOOK_FILE"

echo "post-commit hook 已安装到 ${HOOK_FILE}"
echo "以后每次 commit 会自动更新 CHANGELOG.md"
