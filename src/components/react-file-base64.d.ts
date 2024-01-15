declare module 'react-file-base64' {
  const FileBase64: React.ComponentType<{
    multiple?: boolean;
    onDone: (file: { base64: string; file: File }) => void;
  }>;
  export default FileBase64;
}
