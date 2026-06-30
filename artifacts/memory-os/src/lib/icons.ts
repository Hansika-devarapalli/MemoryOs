export function getDocumentIcon(type: string) {
  switch (type) {
    case 'pdf': return 'FileText';
    case 'docx': return 'File';
    case 'md': return 'FileCode';
    case 'txt': return 'AlignLeft';
    case 'image': return 'Image';
    default: return 'File';
  }
}
