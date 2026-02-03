import { useDrag, useDrop } from 'react-dnd';

const ItemType = 'COLUMN';

function DraggableColumn({ id, index, moveColumn, children }) {
  const [, dragRef] = useDrag({
    type: ItemType,
    item: { id, index },
  });

  const [, dropRef] = useDrop({
    accept: ItemType,
    hover(item) {
      if (item.index === index) return;
      moveColumn(item.index, index);
      item.index = index;
    },
  });

  return (
    <th ref={(node) => dragRef(dropRef(node))} style={{ cursor: 'move' }}>
      {children}
    </th>
  );
}

export default DraggableColumn;
