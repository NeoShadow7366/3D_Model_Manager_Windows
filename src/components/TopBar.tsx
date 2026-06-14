import { useState, useMemo } from "react";
import { Search, Filter, LayoutGrid, List, Check } from "lucide-react";
import { useStore } from "../store";

export function TopBar() {
  const { searchQuery, setSearchQuery, selectedTags, setSelectedTags, models } = useStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Derive all unique tags from models
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    models.forEach(m => {
      if (m.labels) {
        try {
          const parsed = JSON.parse(m.labels);
          if (Array.isArray(parsed)) {
            parsed.forEach(t => tagSet.add(t));
          }
        } catch (e) {}
      }
    });
    return Array.from(tagSet).sort();
  }, [models]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 relative z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 transition-colors text-sm font-medium ${selectedTags.length > 0 ? "text-blue-400" : "text-zinc-400 hover:text-white"}`}
          >
            <Filter size={16} />
            Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
          
          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Filter by Tag</div>
              {allTags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-zinc-400 italic">No tags available</div>
              ) : (
                allTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-zinc-800 text-zinc-300 text-left"
                    >
                      <span className="truncate">{tag}</span>
                      {isSelected && <Check size={14} className="text-blue-500 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 border border-zinc-800 rounded-md p-1">
        <button className="p-1 rounded bg-zinc-800 text-white">
          <LayoutGrid size={16} />
        </button>
        <button className="p-1 rounded text-zinc-500 hover:text-white transition-colors">
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
