import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { StyleBoardScreen } from '../../../src/screens/discovery/StyleBoardScreen';

export default function BoardPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StyleBoardScreen boardId={id} />;
}
