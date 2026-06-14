import { useRef, useState, useEffect } from "react";
import { Camera, X, Edit2, Link as LinkIcon, Plus, Box } from "lucide-react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useStore } from "../store";
import toast from "react-hot-toast";
import { getDb, Model } from "../db";
import { LinkPartModal } from "./LinkPartModal";

// Ensure model-viewer is registered
import "@google/model-viewer";

interface DetailPanelProps {
  onUpdate: () => void;
}

export function DetailPanel({ onUpdate }: DetailPanelProps) {
  const { models, selectedModelIds, setSelectedModelIds, baseDirectory } = useStore();
  const model = models.find(m => m.id === selectedModelIds[0]);
  const viewerRef = useRef<any>(null);
  const [exposure, setExposure] = useState(1);
  const [isSavingThumb, setIsSavingThumb] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [linkedParts, setLinkedParts] = useState<Model[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  if (!model) return null;

  const fetchLinkedParts = async () => {
    try {
      const db = await getDb();
      const parts = await db.select<Model[]>(
        "SELECT m.* FROM Models m JOIN Model_Parts mp ON m.id = mp.part_id WHERE mp.parent_id = $1",
        [model.id]
      );
      setLinkedParts(parts);
    } catch (err) {
      console.error("Failed to fetch linked parts", err);
    }
  };

  useEffect(() => {
    fetchLinkedParts();
  }, [model.id]);

  const modelSrc = convertFileSrc(`${baseDirectory}\\${model.relativePath}`);

  const handleCaptureThumbnail = async () => {
    if (!viewerRef.current) return;
    try {
      setIsSavingThumb(true);
      
      const dataUrl = viewerRef.current.toDataURL("image/png");
      
      await invoke("save_thumbnail", {
        baseDir: baseDirectory,
        relativePath: model.relativePath,
        imageDataBase64: dataUrl,
      });

      toast.success("Thumbnail saved");
      onUpdate(); 
    } catch (err: any) {
      console.error("Failed to capture thumbnail", err);
      toast.error(`Failed to capture thumbnail: ${err.message || err}`);
    } finally {
      setIsSavingThumb(false);
    }
  };

  const tags: string[] = [];
  try {
    if (model.labels) {
      const parsed = JSON.parse(model.labels);
      if (Array.isArray(parsed)) tags.push(...parsed);
    }
  } catch (e) {}

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (tags.includes(tag)) {
      setNewTag("");
      return;
    }
    
    const updatedTags = [...tags, tag];
    try {
      const db = await getDb();
      await db.execute("UPDATE Models SET labels = $1 WHERE id = $2", [JSON.stringify(updatedTags), model.id]);
      setNewTag("");
      onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    try {
      const db = await getDb();
      await db.execute("UPDATE Models SET labels = $1 WHERE id = $2", [JSON.stringify(updatedTags), model.id]);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to remove tag");
    }
  };

  const handleUnlink = async (partId: string) => {
    try {
      const db = await getDb();
      await db.execute("DELETE FROM Model_Parts WHERE parent_id = $1 AND part_id = $2", [model.id, partId]);
      fetchLinkedParts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to unlink part");
    }
  };

  const onClose = () => setSelectedModelIds([]);

  return (
    <div className="w-96 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-white truncate flex-1 mr-2" title={model.name}>
          {model.name}
        </h2>
        <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="h-64 bg-zinc-900 border-b border-zinc-800 relative">
          <model-viewer
            ref={viewerRef}
            src={modelSrc}
            alt={model.name}
            auto-rotate
            camera-controls
            exposure={exposure}
            style={{ width: "100%", height: "100%" }}
            class="outline-none"
          ></model-viewer>

          <button
            onClick={handleCaptureThumbnail}
            disabled={isSavingThumb}
            className="absolute bottom-3 right-3 bg-zinc-800/80 hover:bg-zinc-700 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            title="Capture Thumbnail"
          >
            <Camera size={18} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-zinc-300">Metadata</h3>
              <button className="text-zinc-500 hover:text-white">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Format</span>
                <span className="text-white uppercase">{model.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Size</span>
                <span className="text-white">{(model.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Path</span>
                <span className="text-white truncate max-w-[200px]" title={model.relativePath}>
                  {model.relativePath}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Maker</span>
                <span className="text-white">{model.maker || "Unknown"}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <div key={tag} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-white"><X size={12} /></button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag..."
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
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Viewer Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Exposure: {exposure.toFixed(1)}</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={exposure}
                  onChange={(e) => setExposure(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-300">Related Parts</h3>
              <button 
                onClick={() => setIsLinkModalOpen(true)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <LinkIcon size={12} /> Link Part
              </button>
            </div>
            {linkedParts.length === 0 ? (
              <div className="text-xs text-zinc-500 italic bg-zinc-900/50 p-3 rounded border border-zinc-800/50 text-center">
                No parts linked to this model yet.
              </div>
            ) : (
              <div className="space-y-2">
                {linkedParts.map(part => {
                  const thumbSrc = part.hasCustomThumbnail 
                    ? convertFileSrc(`${baseDirectory}\\${part.relativePath.split(".").slice(0, -1).join(".")}_thumb.png`)
                    : null;

                  return (
                    <div 
                      key={part.id} 
                      className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded group cursor-pointer hover:border-zinc-600 transition-colors"
                      onClick={() => setSelectedModelIds([part.id])}
                    >
                      <div className="w-8 h-8 bg-zinc-950 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {thumbSrc ? (
                          <img src={thumbSrc} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Box size={16} className="text-zinc-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate" title={part.name}>{part.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{part.format}</div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlink(part.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-all"
                        title="Unlink part"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {isLinkModalOpen && (
        <LinkPartModal 
          parentId={model.id}
          linkedPartIds={linkedParts.map(p => p.id)}
          onClose={() => setIsLinkModalOpen(false)}
          onLinked={fetchLinkedParts}
        />
      )}
    </div>
  );
}
