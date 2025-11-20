import type { ReactElement } from 'react';
import CodeBlock from '../components/CodeBlock';
import ContentBlock from '../components/ContentBlock';
import KeyboardShortcut from '../components/KeyboardShortcut';
import StepIndicator from '../components/StepIndicator';

export function parseContent(content: string) {
  const lines = content.split('\n');
  const elements: ReactElement[] = [];
  let currentIndex = 0;
  let stepCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;

    // Code blocks (lines starting with specific commands or containing code patterns)
    if (line.match(/^(migrator|curl|pip|uv|npm|git|DATABASE_URL|SELECT|INSERT|UPDATE|DELETE)/)) {
      let codeBlock = line;
      let j = i + 1;
      // Collect multi-line code if next lines are indented or continue the command
      while (j < lines.length && (lines[j].startsWith(' ') || lines[j].startsWith('\t') || !lines[j].trim())) {
        if (lines[j].trim()) codeBlock += '\n' + lines[j];
        j++;
      }
      elements.push(<CodeBlock key={currentIndex++} code={codeBlock.trim()} />);
      i = j - 1;
      continue;
    }

    // Callout blocks
    if (line.startsWith('**Tip:**') || line.includes('💡')) {
      elements.push(
        <ContentBlock key={currentIndex++} type="tip">
          {line.replace(/\*\*Tip:\*\*|💡/g, '').trim()}
        </ContentBlock>
      );
      continue;
    }
    
    if (line.startsWith('**Warning:**') || line.startsWith('⚠️')) {
      elements.push(
        <ContentBlock key={currentIndex++} type="warning">
          {line.replace(/\*\*Warning:\*\*|⚠️/g, '').trim()}
        </ContentBlock>
      );
      continue;
    }
    
    if (line.startsWith('**Important:**') || line.startsWith('**Note:**')) {
      elements.push(
        <ContentBlock key={currentIndex++} type="note">
          {line.replace(/\*\*Important:\*\*|\*\*Note:\*\*/g, '').trim()}
        </ContentBlock>
      );
      continue;
    }

    // Numbered steps
    if (line.match(/^\d+\.\s/)) {
      stepCounter++;
      const text = line.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={currentIndex++} className="flex items-start gap-3 mb-4">
          <StepIndicator number={stepCounter} />
          <p className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
            {parseInlineElements(text)}
          </p>
        </div>
      );
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={currentIndex++} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        {parseInlineElements(line)}
      </p>
    );
  }

  return elements;
}

function parseInlineElements(text: string) {
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Parse keyboard shortcuts (Ctrl+K, Cmd+Enter, etc.)
  const kbdRegex = /\*\*(Ctrl|Cmd|Alt|Shift)(\+[A-Z]|\+Enter|\+[a-z])\*\*/g;
  let match;

  while ((match = kbdRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<KeyboardShortcut key={keyIndex++} keys={match[0].replace(/\*\*/g, '')} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Parse bold text
  return parts.map((part, i) => {
    if (typeof part === 'string') {
      return part.split(/(\*\*.*?\*\*)/).map((segment, j) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          return <strong key={`${i}-${j}`} className="font-semibold text-gray-900 dark:text-gray-100">{segment.slice(2, -2)}</strong>;
        }
        return segment;
      });
    }
    return part;
  });
}
