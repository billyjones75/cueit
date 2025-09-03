export function calculateFractionalIndex(beforeIndex: number, afterIndex: number): number {
  return beforeIndex + (afterIndex - beforeIndex) / 2;
}

export function getNewCardIndex(lastCardIndex: number): number {
  return lastCardIndex + 1000;
}

export function getInsertIndex(beforeCard: { orderIndex: number } | null, afterCard: { orderIndex: number } | null): number {
  if (afterCard === null) {
    // Moving to the end of the list
    const beforeIndex = beforeCard ? beforeCard.orderIndex : 0;
    return beforeIndex + 1000;
  }
  
  const beforeIndex = beforeCard ? beforeCard.orderIndex : 0;
  const afterIndex = afterCard.orderIndex;
  return calculateFractionalIndex(beforeIndex, afterIndex);
} 