import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export type CardType = { 
  id: number; 
  title: string; 
  description?: string; 
  display_id?: string;
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
          className="bg-white rounded-xl p-3 shadow-lg border border-gray-200 hover:shadow-xl hover:border-[#178366] transition-all duration-150 cursor-pointer"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
        >
          <div className="font-medium text-[#205C44] mb-2">
            {card.title}
          </div>
          {card.display_id && (
            <div className="flex justify-end">
              <span className="bg-[#178366] text-white text-xs px-2 py-1 rounded-md font-medium">
                {card.display_id}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
} 