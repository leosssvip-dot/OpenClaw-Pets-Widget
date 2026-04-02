import { memo, useMemo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** 将纯文本 URL 转为 Markdown 链接，便于点击（不处理已是 [text](url) 内的 url） */
function linkifyRawUrls(text: string): string {
  return text.replace(
    /(^|[\n\r\t ])(https?:\/\/[^\s<>[\]()]+)/g,
    (_, before, url) => `${before}[${url}](${url})`
  );
}

/**
 * Preserve single newlines as hard breaks.
 * Markdown normally collapses `\n` to a space; appending two trailing spaces
 * before each `\n` turns them into `<br>` so status/command output keeps its
 * intended line structure.
 */
function preserveLineBreaks(text: string): string {
  return text.replace(/(?<! {2})\n/g, '  \n');
}

const components: Components = {
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="chat-message__link"
      {...props}
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="chat-message__md-p">{children}</p>,
  strong: ({ children }) => <strong className="chat-message__md-strong">{children}</strong>,
  ul: ({ children }) => <ul className="chat-message__md-ul">{children}</ul>,
  ol: ({ children }) => <ol className="chat-message__md-ol">{children}</ol>,
  li: ({ children }) => <li className="chat-message__md-li">{children}</li>,
  img: ({ src, alt }) => (
    <a href={src} target="_blank" rel="noopener noreferrer" className="chat-message__image-link">
      <img src={src} alt={alt ?? 'image'} className="chat-message__image" loading="lazy" />
    </a>
  ),
  h1: ({ children }) => <h1 className="chat-message__md-h">{children}</h1>,
  h2: ({ children }) => <h2 className="chat-message__md-h">{children}</h2>,
  h3: ({ children }) => <h3 className="chat-message__md-h">{children}</h3>,
  h4: ({ children }) => <h4 className="chat-message__md-h">{children}</h4>,
  h5: ({ children }) => <h5 className="chat-message__md-h">{children}</h5>,
  h6: ({ children }) => <h6 className="chat-message__md-h">{children}</h6>,
  blockquote: ({ children }) => <blockquote className="chat-message__md-blockquote">{children}</blockquote>,
  hr: () => <hr className="chat-message__md-hr" />,
  table: ({ children }) => (
    <div className="chat-message__md-table-wrap">
      <table className="chat-message__md-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="chat-message__md-thead">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="chat-message__md-tr">{children}</tr>,
  th: ({ children }) => <th className="chat-message__md-th">{children}</th>,
  td: ({ children }) => <td className="chat-message__md-td">{children}</td>,
  pre: ({ children }) => <pre className="chat-message__md-pre">{children}</pre>,
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === 'string' && /^language-/.test(className);
    if (isBlock) {
      return (
        <code className="chat-message__md-code-block" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="chat-message__md-inline-code" {...props}>
        {children}
      </code>
    );
  },
};

export const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  const linkified = useMemo(() => linkifyRawUrls(preserveLineBreaks(content)), [content]);
  return (
    <div className="chat-message__content chat-message__content--md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{linkified}</ReactMarkdown>
    </div>
  );
});
