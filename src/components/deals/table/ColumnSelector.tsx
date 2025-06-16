
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Settings, GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { TableColumn, useTableColumns } from '@/hooks/deals/useTableColumns';

interface ColumnSelectorProps {
  onColumnsChange?: () => void;
}

export function ColumnSelector({ onColumnsChange }: ColumnSelectorProps) {
  const { columns, reorderColumns, resetToDefault, toggleColumnVisibility } = useTableColumns();
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<TableColumn[]>(columns);

  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalColumns(items);
  };

  const handleApplyChanges = () => {
    reorderColumns(localColumns.map(col => col.key));
    onColumnsChange?.();
    setOpen(false);
  };

  const handleToggleVisibility = (key: string) => {
    const updated = localColumns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updated);
    toggleColumnVisibility(key);
  };

  const handleReset = () => {
    resetToDefault();
    setLocalColumns(columns);
    onColumnsChange?.();
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Columns
          <Badge variant="secondary" className="ml-2">
            {visibleCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Table Columns</DialogTitle>
          <DialogDescription>
            Drag and drop to reorder columns, or toggle visibility. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localColumns.map((column, index) => (
                    <Draggable
                      key={column.key}
                      draggableId={column.key}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            flex items-center gap-3 p-3 border rounded-lg bg-card
                            ${snapshot.isDragging ? 'shadow-lg' : ''}
                            ${column.locked ? 'opacity-75' : ''}
                          `}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          
                          <Checkbox
                            checked={column.visible}
                            onCheckedChange={() => handleToggleVisibility(column.key)}
                            disabled={column.locked}
                            className="flex-shrink-0"
                          />
                          
                          <div className="flex items-center gap-2 flex-1">
                            {column.icon && (
                              <column.icon className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{column.label}</span>
                            {column.locked && (
                              <Badge variant="outline" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {column.visible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {column.dataType}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyChanges}>
              Apply Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
