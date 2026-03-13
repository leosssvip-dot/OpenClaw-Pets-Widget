import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';

/** 将纯文本 URL 转为 Markdown 链接，便于点击（不处理已是 [text](url) 内的 url） */
function linkifyRawUrls(text: string): string {
  return text.replace(
    /(^|[\n\r\t ])(https?:\/\/[^\s<>[\]()]+)/g,
    (_, before, url) => `${before}[${url}](${url})`
  );
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

export function MarkdownContent({ content }: { content: string }) {
  const linkified = linkifyRawUrls(content);
  return (
    <div className="chat-message__content chat-message__content--md">
      <ReactMarkdown components={components}>{linkified}</ReactMarkdown>
    </div>
  );
}
