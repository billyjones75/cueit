import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export type CardType = { 
  id: number; 
  title: string; 
  description?: string; 
  orderIndex: number;
};

interface CardProps {
  card: CardType;
  index: number;
  onClick: (card: CardType) => void;
}

export function Card({ card, index, onClick }: CardProps) {
  return (
    <Draggable draggableId={card.id.toString()} index={index} key={card.id}>
      {(provided, snapshot) => (
        <div
          className="bg-white rounded-xl p-3 flex items-center gap-2 shadow-lg border border-gray-200 hover:shadow-xl hover:border-[#178366] transition-all duration-150 cursor-pointer"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
        >
          <span className="font-medium text-[#205C44]">{card.title}</span>
        </div>
      )}
    </Draggable>
  );
} 