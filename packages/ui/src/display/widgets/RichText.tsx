'use client';

import React from 'react';

export interface RichTextInline {
  type: string;
  content?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface RichTextBlock {
  type: string;
  content: RichTextInline[];
}

export interface RichTextProps {
  content: RichTextBlock;
  fontSize: number;
  fontFamily: string;
  color: string;
  direction: 'rtl' | 'ltr';
}

export function RichText({
  content,
  fontSize,
  fontFamily,
  color,
  direction,
}: RichTextProps) {
  const renderInline = (node: RichTextInline, index: number) => {
    if (!node.content) return null;

    const style: React.CSSProperties = {
      fontWeight: node.bold ? 700 : undefined,
      fontStyle: node.italic ? 'italic' : undefined,
      textDecoration: node.underline ? 'underline' : undefined,
    };

    return (
      <span key={index} style={style}>
        {node.content}
      </span>
    );
  };

  const renderBlock = (block: RichTextBlock, index: number) => {
    if (block.type === 'paragraph') {
      return (
        <p
          key={index}
          style={{
            margin: 0,
            marginBottom: fontSize * 0.5,
            lineHeight: 1.5,
          }}
        >
          {block.content.map(renderInline)}
        </p>
      );
    }

    return (
      <div key={index} style={{ marginBottom: fontSize * 0.5, lineHeight: 1.5 }}>
        {block.content.map(renderInline)}
      </div>
    );
  };

  const blocks = content.type === 'doc' && Array.isArray(content.content)
    ? (content.content as unknown as RichTextBlock[])
    : [content];

  return (
    <div
      style={{
        fontSize,
        fontFamily,
        color,
        direction,
        width: '100%',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      {blocks.map(renderBlock)}
    </div>
  );
}
