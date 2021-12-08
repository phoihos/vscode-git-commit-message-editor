// see: https://github.com/conventional-commits/parser#the-grammar

//#region Summary
export const SUMMARY_SYNTAX_REGEX = /^(\w+)(\((\$?[\w\-\.]*)(\))?)?(\!)?(: (.*))?$/;
export const SUMMARY_TOKEN_SCOPE_REGEX = /^\$?[\w\-\.]+$/;
//#endregion

//#region Footer
export const FOOTER_SYNTAX_REGEX = /^(([\w\-]+)|(\w+ ?\w*|\!))((: | #)(.*))?$/;
export const FOOTER_TOKEN_BC_REGEX = /^BREAKING-CHANGE$/i;
export const FOOTER_TOKEN_IRREGULAR_BC_REGEX = /^BREAKING (C(H(A(N(GE?)?)?)?)?)?|\!$/i;

export const FOOTER_SENTENCE_REGEXES = [
  /^(BREAKING CHANGE|\!)(: )(.*)$/i,
  /^([\w\-]+)(: | #)(.*)$/
];
//#endregion

export const EOL_REGEX = /\r?\n/;
