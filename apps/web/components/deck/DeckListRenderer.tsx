import * as React from 'react';
import { StacksView } from './views/StacksView';
import { ImageGridView } from './views/ImageGridView';
import { TextListView } from './views/TextListView';
import { TableView } from './views/TableView';
import type { DeckViewRendererProps } from './types';

interface DeckListRendererProps extends DeckViewRendererProps {
  viewMode: 'stacks' | 'image' | 'text' | 'table';
}

export function DeckListRenderer(props: DeckListRendererProps) {
  const { viewMode, ...rest } = props;
  if (viewMode === 'stacks') return <StacksView {...rest} />;
  if (viewMode === 'image') return <ImageGridView {...rest} />;
  if (viewMode === 'text') return <TextListView {...rest} />;
  if (viewMode === 'table') return <TableView {...rest} />;
  return null;
}
