import { useRef, useEffect, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ModelCard } from "./ModelCard";
import { useStore } from "../store";

export function ModelGrid() {
  const { models, baseDirectory, selectedModelIds, setSelectedModelIds, searchQuery, selectedTags } = useStore();
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate columns based on container width. Default to 4.
  const [columns, setColumns] = useState(4);
  
  useEffect(() => {
    const updateColumns = () => {
      if (parentRef.current) {
        const width = parentRef.current.offsetWidth;
        // Assume card min-width is around 200px
        const cols = Math.max(1, Math.floor(width / 220));
        setColumns(cols);
      }
    };
    
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      // 1. Search filter
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Tag filter
      if (selectedTags.length > 0) {
        if (!m.labels) return false;
        try {
          const parsed = JSON.parse(m.labels);
          if (Array.isArray(parsed)) {
            // Must contain ALL selected tags
            const hasAllTags = selectedTags.every(tag => parsed.includes(tag));
            if (!hasAllTags) return false;
          } else {
            return false;
          }
        } catch (e) {
          return false;
        }
      }
      return true;
    });
  }, [models, searchQuery, selectedTags]);

  const handleModelClick = (e: React.MouseEvent, modelId: string, index: number) => {
    if (e.ctrlKey || e.metaKey) {
      if (selectedModelIds.includes(modelId)) {
        setSelectedModelIds(selectedModelIds.filter(id => id !== modelId));
      } else {
        setSelectedModelIds([...selectedModelIds, modelId]);
      }
    } else if (e.shiftKey && selectedModelIds.length > 0) {
      const lastSelectedId = selectedModelIds[selectedModelIds.length - 1];
      const lastIndex = filteredModels.findIndex(m => m.id === lastSelectedId);
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, index);
        const end = Math.max(lastIndex, index);
        const rangeIds = filteredModels.slice(start, end + 1).map(m => m.id);
        const newSelection = new Set([...selectedModelIds, ...rangeIds]);
        setSelectedModelIds(Array.from(newSelection));
      } else {
        setSelectedModelIds([modelId]);
      }
    } else {
      setSelectedModelIds([modelId]);
    }
  };

  const rowCount = Math.ceil(filteredModels.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // estimated row height
    overscan: 5,
  });

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-y-auto p-4 bg-zinc-950"
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowModels = filteredModels.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              className="absolute top-0 left-0 w-full flex gap-4"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "16px",
              }}
            >
              {rowModels.map((model) => (
                <div key={model.id} style={{ width: `calc((100% - ${(columns - 1) * 16}px) / ${columns})` }}>
                  <ModelCard
                    model={model}
                    baseDirectory={baseDirectory}
                    isSelected={selectedModelIds.includes(model.id)}
                    onClick={(e) => handleModelClick(e, model.id, startIndex + rowModels.indexOf(model))}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      
      {filteredModels.length === 0 && (
        <div className="flex items-center justify-center h-full text-zinc-500">
          No models found matching your criteria.
        </div>
      )}
    </div>
  );
}
