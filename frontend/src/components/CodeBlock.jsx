import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeBlock({ children, language = 'bash' }) {
  return (
    <SyntaxHighlighter language={language} style={atomDark} customStyle={{ borderRadius: '8px', padding: '1rem', fontSize: '0.9rem', margin: '1rem 0' }}>
      {String(children).trim()}
    </SyntaxHighlighter>
  );
}
