import { useRef, useState, useEffect } from "react";
import { X, Plus, Image as ImageIcon } from "lucide-react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useStore } from "../store";
import toast from "react-hot-toast";
import { getDb, Model } from "../db";

// Ensure model-viewer is registered
import "@google/model-viewer";

interface BatchPanelProps {
  onUpdate: () => void;
}

export function BatchPanel({ onUpdate }: BatchPanelProps) {
  const { models, selectedModelIds, setSelectedModelIds, baseDirectory } = useStore();
  const [newTag, setNewTag] = useState("");
  const [thumbnailQueue, setThumbnailQueue] = useState<Model[]>([]);
  const viewerRef = useRef<any>(null);

  const selectedModels = models.filter(m => selectedModelIds.includes(m.id));
  
  // Calculate common tags
  const commonTags = selectedModels.reduce((acc: string[], model, index) => {
    let modelTags: string[] = [];
    try {
      if (model.labels) {
        const parsed = JSON.parse(model.labels);
        if (Array.isArray(parsed)) modelTags = parsed;
      }
    } catch(e) {}

    if (index === 0) return modelTags;
    return acc.filter(t => modelTags.includes(t));
  }, []);

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    
    try {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      
      for (const model of selectedModels) {
        let tags: string[] = [];
        try {
          if (model.labels) {
            const parsed = JSON.parse(model.labels);
            if (Array.isArray(parsed)) tags = parsed;
          }
        } catch(e) {}
        
        if (!tags.includes(tag)) {
          tags.push(tag);
          await db.execute("UPDATE Models SET labels = $1 WHERE id = $2", [JSON.stringify(tags), model.id]);
        }
      }
      
      await db.execute("COMMIT");
      setNewTag("");
      onUpdate();
      toast.success(`Tag added to ${selectedModels.length} models`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add batch tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const db = await getDb();
      await db.execute("BEGIN TRANSACTION");
      
      for (const model of selectedModels) {
        let tags: string[] = [];
        try {
          if (model.labels) {
            const parsed = JSON.parse(model.labels);
            if (Array.isArray(parsed)) tags = parsed;
          }
        } catch(e) {}
        
        if (tags.includes(tagToRemove)) {
          tags = tags.filter(t => t !== tagToRemove);
          await db.execute("UPDATE Models SET labels = $1 WHERE id = $2", [JSON.stringify(tags), model.id]);
        }
      }
      
      await db.execute("COMMIT");
      onUpdate();
      toast.success(`Tag removed from ${selectedModels.length} models`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove batch tag");
    }
  };

  const startAutoThumbnails = () => {
    const missing = selectedModels.filter(m => !m.hasCustomThumbnail && !m.isMissing);
    if (missing.length === 0) {
      toast.error("All selected models already have thumbnails or are missing files.");
      return;
    }
    setThumbnailQueue(missing);
  };

  // Process the queue
  useEffect(() => {
    if (thumbnailQueue.length === 0) return;

    const currentModel = thumbnailQueue[0];
    let timeoutId: any;

    const handleLoad = async () => {
      // Wait a short bit to ensure render
      timeoutId = setTimeout(async () => {
        try {
          if (viewerRef.current) {
            const dataUrl = viewerRef.current.toDataURL("image/png");
            await invoke("save_thumbnail", {
              baseDir: baseDirectory,
              relativePath: currentModel.relativePath,
              imageDataBase64: dataUrl,
            });
            
            // Mark model locally so it doesn't flicker while DB syncs
            currentModel.hasCustomThumbnail = true;
            onUpdate(); // trigger refresh
          }
        } catch(err) {
          console.error("Failed to capture batch thumb", err);
        }
        
        // Move to next
        setThumbnailQueue(prev => prev.slice(1));
      }, 800); // 800ms wait after load to ensure texture loading
    };

    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener("load", handleLoad);
    }

    return () => {
      if (viewer) viewer.removeEventListener("load", handleLoad);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [thumbnailQueue, baseDirectory, onUpdate]);

  return (
    <div className="w-96 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-white">
          {selectedModels.length} Models Selected
        </h2>
        <button onClick={() => setSelectedModelIds([])} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Batch Tags (Shared)</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {commonTags.length === 0 && <span className="text-xs text-zinc-600">No shared tags</span>}
            {commonTags.map(tag => (
              <div key={tag} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-white"><X size={12} /></button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag to all..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-600"
            />
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1 rounded">
              <Plus size={16} />
            </button>
          </form>
        </section>

        <section>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Batch Tools</h3>
          <button 
            onClick={startAutoThumbnails}
            disabled={thumbnailQueue.length > 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded text-sm transition-colors"
          >
            <ImageIcon size={16} />
            {thumbnailQueue.length > 0 ? `Generating... (${thumbnailQueue.length} left)` : "Generate Missing Thumbnails"}
          </button>
        </section>

        {thumbnailQueue.length > 0 && (
          <div className="mt-4 border border-zinc-800 p-2 rounded bg-zinc-900">
            <p className="text-xs text-zinc-400 mb-2">Processing: {thumbnailQueue[0].name}</p>
            {/* Hidden viewer for processing */}
            <div className="w-full h-48 relative overflow-hidden bg-zinc-950 rounded pointer-events-none">
              <model-viewer
                ref={viewerRef}
                src={convertFileSrc(`${baseDirectory}\\${thumbnailQueue[0].relativePath}`)}
                alt="Generating thumbnail"
                camera-controls={false}
                auto-rotate={false}
                style={{ width: "100%", height: "100%" }}
              ></model-viewer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
