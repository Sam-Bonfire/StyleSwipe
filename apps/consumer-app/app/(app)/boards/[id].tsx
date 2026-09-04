import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { BoardDetailScreen } from '../../../src/screens/boards/BoardDetailScreen';

export default function BoardsDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BoardDetailScreen boardId={id as string} />;
}
