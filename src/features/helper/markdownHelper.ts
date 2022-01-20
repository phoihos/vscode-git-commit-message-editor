/**
 * @description This is a modified version of the original code from https://github.com/microsoft/vscode-pull-request-github/blob/main/src/issues/util.ts
 */

import { marked } from 'marked';

export class UglyMarkdownRenderer extends marked.Renderer {
  public code(code: string, language: string | undefined, _isEscaped: boolean): string {
    return `\`${
      language === 'markdown' || language === 'md'
        ? marked.parse(code, { renderer: new UglyMarkdownRenderer() })
        : code
    }\` `;
  }
  public blockquote(quote: string): string {
    return quote;
  }
  public html(_html: string): string {
    return '';
  }
  public heading(
    text: string,
    _level: 1 | 2 | 3 | 4 | 5 | 6,
    _raw: string,
    _slugger: marked.Slugger
  ): string {
    return text + ' ';
  }
  public hr(): string {
    return '';
  }
  public list(body: string, ordered: boolean, start: number): string {
    return body.replace(/\${li}/g, ordered ? () => `${start++}\\.` : () => '\\-');
  }
  public listitem(text: string): string {
    return '${li} ' + text + ' ';
  }
  public checkbox(_checked: boolean): string {
    return '';
  }
  public paragraph(text: string): string {
    return text.replace(/(<|>)/g, '\\$1') + ' ';
  }
  public table(header: string, body: string): string {
    return header + ' ' + body;
  }
  public tablerow(content: string): string {
    return content;
  }
  public tablecell(
    content: string,
    _flags: {
      header: boolean;
      align: 'center' | 'left' | 'right' | null;
    }
  ): string {
    return content;
  }
  public strong(text: string): string {
    return text;
  }
  public em(text: string): string {
    return text;
  }
  public codespan(code: string): string {
    return '`' + code + '`';
  }
  public br(): string {
    return ' ';
  }
  public del(text: string): string {
    return text;
  }
  public link(_href: string, _title: string, text: string): string {
    return text + ' ';
  }
  public image(_href: string, _title: string, _text: string): string {
    return `![](${_href}|height=14px) `;
  }
  public text(text: string): string {
    return text;
  }
}

const _CODEBLOCK_REGEX = /`.+`/g;
const _UNESCAPE_REGEX = /&(lt|gt|nbsp|amp|quot);/g;

function _unescapeCodeBlock(markdown: string): string {
  function __unescape(entity: string): string {
    switch (entity) {
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'nbsp':
        return ' ';
      case 'amp':
        return '&';
      case 'quot':
        return '"';
      default:
        return entity;
    }
  }

  return markdown.replace(_CODEBLOCK_REGEX, (codeBlock) => {
    return codeBlock.replace(_UNESCAPE_REGEX, (_, entity) => {
      return __unescape(entity);
    });
  });
}

export function minifyMarkdown(markdown: string): string {
  return _unescapeCodeBlock(marked.parse(markdown, { renderer: new UglyMarkdownRenderer() }));
}
