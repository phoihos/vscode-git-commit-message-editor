const _UNESCAPE_REGEX = /&(lt|gt|nbsp|amp|quot);/g;

export function unescape(text: string): string {
  function replacer(_: string, entity: string) {
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

  return text.replace(_UNESCAPE_REGEX, replacer);
}
