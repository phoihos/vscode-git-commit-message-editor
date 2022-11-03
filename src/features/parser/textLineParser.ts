import {
  SUMMARY_SYNTAX_REGEX,
  FOOTER_SYNTAX_REGEX,
  FOOTER_TOKEN_BC_REGEX,
  FOOTER_TOKEN_IRREGULAR_BC_REGEX
} from './syntaxRegex';

export enum ETokenType {
  /** When the separator required followed by */
  Partial = -2,
  /** When input text is empty */
  None = -1,
  /** When parsing error occurred */
  Error = 0,

  Type = 1,
  Scope = 2,
  Desc = 3
}

export interface Tokens {
  readonly type: string;
  readonly scope: string;
  readonly desc: string;
  readonly isBreaking: boolean;
  readonly tokenTypeAt: ETokenType;
}

export function parseSummary(summary: string): Tokens {
  const tokens = {
    type: '',
    scope: '',
    desc: '',
    isBreaking: false,
    tokenTypeAt: ETokenType.None
  };

  if (summary.length === 0) {
    return tokens;
  }

  const match = summary.match(SUMMARY_SYNTAX_REGEX);
  if (match === null) {
    tokens.tokenTypeAt = ETokenType.Error;
    return tokens;
  }

  tokens.type = match[1]; // (\w+)
  tokens.scope = match[3] ?? ''; // (\$?[\w\-\.]*)
  tokens.desc = match[7] ?? ''; // (.*)

  tokens.isBreaking = match[5] ? true : false; // (\!)?

  // (: (.*))?
  if (match[6] !== undefined) {
    tokens.tokenTypeAt = ETokenType.Desc;
  }
  // (\((\$?[\w\-\.]*)(\))?)?
  else if (match[2] !== undefined) {
    tokens.tokenTypeAt = match[4] !== undefined ? ETokenType.Partial : ETokenType.Scope; // (\))?
  } else {
    tokens.tokenTypeAt = ETokenType.Type;
  }

  return tokens;
}

export function parseFooter(footer: string): Tokens {
  const tokens = {
    type: '',
    scope: '',
    desc: '',
    isBreaking: false,
    tokenTypeAt: ETokenType.None
  };

  if (footer.length === 0) {
    return tokens;
  }

  let isBreaking = false;

  const match = footer.match(FOOTER_SYNTAX_REGEX);
  if (match === null) {
    tokens.tokenTypeAt = ETokenType.Error;
    return tokens;
  } else {
    const separator = match[5] ?? ': '; // (: | #)
    // ([\w\-]+)
    if (match[2] !== undefined) {
      isBreaking = FOOTER_TOKEN_BC_REGEX.test(match[2]);

      if (isBreaking && separator !== ': ') {
        tokens.tokenTypeAt = ETokenType.Error;
        return tokens;
      }
    }
    // (\w+ ?\w*|\!)
    else if (match[3] !== undefined) {
      isBreaking = FOOTER_TOKEN_IRREGULAR_BC_REGEX.test(match[3]);

      if (isBreaking === false || separator !== ': ') {
        tokens.tokenTypeAt = ETokenType.Error;
        return tokens;
      }
    }
  }

  tokens.type = match[1]; // (([\w\-]+)|(\w+ ?\w*|\!))
  tokens.desc = match[6] ?? ''; // (.*)
  tokens.isBreaking = isBreaking;

  // (.*)
  if (match[6] !== undefined) {
    tokens.tokenTypeAt = ETokenType.Desc;
  } else {
    tokens.tokenTypeAt = ETokenType.Type;
  }

  return tokens;
}
