import { StyleBoardScreen } from '../../../src/screens/discovery/StyleBoardScreen';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function BoardPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StyleBoardScreen boardId={id} />;
}
