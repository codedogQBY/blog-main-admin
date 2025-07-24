// Markdown解析相关工具函数
export const parseMarkdownAndInsert = (markdown: string, editor: any, view: any) => {
  if (!editor) return
  
  // 清空当前选区
  editor.chain().focus().deleteSelection().run()
  
  const lines = markdown.split('\n')
  let htmlContent = ''
  
  let inCodeBlock = false
  let codeBlockContent = ''
  let codeLanguage = ''
  let inTable = false
  let tableRows: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // 处理代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // 结束代码块
        htmlContent += `</code></pre>`
        inCodeBlock = false
        codeBlockContent = ''
        codeLanguage = ''
      } else {
        // 开始代码块
        inCodeBlock = true
        codeLanguage = line.slice(3).trim() || 'text'
        htmlContent += `<pre><code class="language-${codeLanguage}">`
      }
      continue
    }
    
    if (inCodeBlock) {
      htmlContent += escapeHtml(line) + '\n'
      continue
    }
    
    // 处理表格
    if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true
        htmlContent += '<table><tbody>'
        tableRows = []
      }
      
      // 跳过分隔线
      if (line.match(/^\|[\s\-\|:]+\|$/)) {
        // 将之前的行作为表头
        if (tableRows.length === 1) {
          const headerRow = tableRows[0]
          htmlContent = htmlContent.replace('<tbody>', '<thead>' + headerRow + '</thead><tbody>')
        }
        continue
      }
      
      const cells = line.split('|').slice(1, -1)
      const isFirstRow = tableRows.length === 0
      const cellTag = isFirstRow ? 'th' : 'td'
      
      let rowHtml = '<tr>'
      cells.forEach(cell => {
        rowHtml += `<${cellTag}>${parseInlineMarkdownToHtml(cell.trim())}</${cellTag}>`
      })
      rowHtml += '</tr>'
      
      htmlContent += rowHtml
      tableRows.push(rowHtml)
      continue
    } else if (inTable) {
      // 结束表格
      htmlContent += '</tbody></table>'
      inTable = false
      tableRows = []
    }
    
    // 处理空行
    if (line.trim() === '') {
      htmlContent += '<p></p>'
      continue
    }
    
    // 处理标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = parseInlineMarkdownToHtml(headingMatch[2])
      htmlContent += `<h${level}>${text}</h${level}>`
      continue
    }
    
    // 处理引用
    if (line.startsWith('> ')) {
      const text = parseInlineMarkdownToHtml(line.slice(2))
      htmlContent += `<blockquote><p>${text}</p></blockquote>`
      continue
    }
    
    // 处理任务列表
    if (line.match(/^- \[([ x])\] (.+)$/)) {
      const match = line.match(/^- \[([ x])\] (.+)$/)
      if (match) {
        const checked = match[1] === 'x'
        const text = parseInlineMarkdownToHtml(match[2])
        htmlContent += `<ul data-type="taskList"><li data-checked="${checked}"><label><input type="checkbox" ${checked ? 'checked' : ''}></label><div>${text}</div></li></ul>`
      }
      continue
    }
    
    // 处理无序列表
    if (line.match(/^[\s]*[-*+]\s+(.+)$/)) {
      const match = line.match(/^[\s]*[-*+]\s+(.+)$/)
      if (match) {
        const text = parseInlineMarkdownToHtml(match[1])
        htmlContent += `<ul><li><p>${text}</p></li></ul>`
      }
      continue
    }
    
    // 处理有序列表
    if (line.match(/^[\s]*\d+\.\s+(.+)$/)) {
      const match = line.match(/^[\s]*\d+\.\s+(.+)$/)
      if (match) {
        const text = parseInlineMarkdownToHtml(match[1])
        htmlContent += `<ol><li><p>${text}</p></li></ol>`
      }
      continue
    }
    
    // 处理分割线
    if (line.match(/^[-*_]{3,}$/)) {
      htmlContent += '<hr>'
      continue
    }
    
    // 处理普通段落
    const text = parseInlineMarkdownToHtml(line)
    htmlContent += `<p>${text}</p>`
  }
  
  // 结束可能未关闭的元素
  if (inCodeBlock) {
    htmlContent += '</code></pre>'
  }
  if (inTable) {
    htmlContent += '</tbody></table>'
  }
  
  // 在当前位置插入HTML内容，而不是替换整个内容
  const { state } = view
  const { selection } = state
  const { $from } = selection
  
  // 删除当前选区（如果有的话）
  if (!selection.empty) {
    editor.chain().focus().deleteSelection().run()
  }
  
  // 在当前位置插入HTML内容
  editor.chain().focus().insertContent(htmlContent).run()
}

// 解析行内Markdown并转换为HTML
export const parseInlineMarkdownToHtml = (text: string): string => {
  if (!text) return ''
  
  // 转义HTML字符
  text = escapeHtml(text)
  
  // 处理行内代码（最先处理，避免其他格式影响）
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // 处理粗体（双星号）
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // 处理斜体（单星号，但不影响已处理的粗体）
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  
  // 处理删除线
  text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>')
  
  // 处理链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  return text
}

// HTML转义函数
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// 搜索功能相关
export const findMatches = (searchText: string, editor: any) => {
  const matches: Array<{ from: number; to: number }> = []
  
  if (!searchText || !editor) return matches
  
  const { state } = editor
  const { doc } = state
  const searchValue = searchText.toLowerCase()
  
  // 遍历所有文本节点查找匹配
  doc.descendants((node: any, pos: number) => {
    if (node.isText && node.text) {
      const text = node.text.toLowerCase()
      let searchIndex = 0
      let index = text.indexOf(searchValue, searchIndex)
      
      while (index !== -1) {
        matches.push({
          from: pos + index,
          to: pos + index + searchText.length
        })
        searchIndex = index + 1
        index = text.indexOf(searchValue, searchIndex)
      }
    }
  })
  
  return matches
}

// 目录生成功能
export const updateTableOfContents = (editor: any) => {
  if (!editor) return []
  
  const toc: Array<{ id: string; text: string; level: number }> = []
  const doc = editor.state.doc
  
  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'heading') {
      const text = node.textContent
      const level = node.attrs.level
      // 创建更简单的ID
      const id = `heading-${text.replace(/\s+/g, '-').toLowerCase()}-${pos}`
      
      toc.push({ id, text, level })
    }
  })
  
  return toc
}