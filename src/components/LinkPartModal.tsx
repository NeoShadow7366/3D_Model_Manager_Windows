import { useState, useMemo } from "react";
import { X, Search, Link as LinkIcon, Box } from "lucide-react";
import { getDb } from "../db";
import { useStore } from "../store";
import toast from "react-hot-toast";
import { convertFileSrc } from "@tauri-apps/api/core";

interface LinkPartModalProps {
  parentId: string;
  linkedPartIds: string[];
  onClose: () => void;
  onLinked: () => void;
}

export function LinkPartModal({ parentId, linkedPartIds, onClose, onLinked }: LinkPartModalProps) {
  const { models, baseDirectory } = useStore();
  const [search, setSearch] = useState("");

  const availableModels = useMemo(() => {
    return models.filter(m => 
      m.id !== parentId && 
      !linkedPartIds.includes(m.id) &&
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [models, parentId, linkedPartIds, search]);

  const handleLink = async (partId: string) => {
    try {
      const db = await getDb();
      await db.execute("INSERT INTO Model_Parts (parent_id, part_id) VALUES ($1, $2)", [parentId, partId]);
      toast.success("Part linked successfully");
      onLinked();
    } catch (err) {
      console.error(err);
      toast.error("Failed to link part");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Link Related Part</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search models to link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {availableModels.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No models available to link.
            </div>
          ) : (
            <div className="space-y-1">
              {availableModels.map(model => {
                const thumbSrc = model.hasCustomThumbnail 
                  ? convertFileSrc(`${baseDirectory}\\${model.relativePath.split(".").slice(0, -1).join(".")}_thumb.png`)
                  : null;

                return (
                  <div key={model.id} className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded group transition-colors">
                    <div className="w-10 h-10 bg-zinc-950 rounded flex items-center justify-center shrink-0">
                      {thumbSrc ? (
                        <img src={thumbSrc} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Box size={20} className="text-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{model.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{model.relativePath}</div>
                    </div>
                    <button 
                      onClick={() => handleLink(model.id)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs transition-all"
                    >
                      <LinkIcon size={12} /> Link
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
