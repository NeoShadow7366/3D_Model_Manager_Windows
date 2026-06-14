import { Model } from "../db";
import { AlertTriangle, Box } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { startDrag } from "@crabnebula/tauri-plugin-drag";

interface ModelCardProps {
  model: Model;
  baseDirectory: string;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
}

export function ModelCard({ model, baseDirectory, onClick, isSelected }: ModelCardProps) {
  // Compute thumbnail path
  // If hasCustomThumbnail is true, the sidecar exists.
  // Generate the sidecar path.
  let thumbSrc = null;
  if (model.hasCustomThumbnail) {
    const fileStem = model.relativePath.split(".").slice(0, -1).join(".");
    const thumbPath = `${baseDirectory}\\${fileStem}_thumb.png`;
    // convertFileSrc lets the webview load local files
    thumbSrc = convertFileSrc(thumbPath);
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent default HTML5 drag
    
    const absoluteModelPath = `${baseDirectory}\\${model.relativePath}`;
    
    const dragOptions: any = {
      item: [absoluteModelPath],
    };

    if (model.hasCustomThumbnail) {
      const fileStem = model.relativePath.split(".").slice(0, -1).join(".");
      dragOptions.icon = `${baseDirectory}\\${fileStem}_thumb.png`;
    }

    startDrag(dragOptions).catch(err => {
      console.error("Failed to start native drag:", err);
    });
  };

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      className={`
        relative flex flex-col bg-zinc-900 border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all
        ${isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-800 hover:border-zinc-700"}
        ${model.isMissing ? "opacity-50 grayscale" : ""}
      `}
    >
      <div className="aspect-square bg-zinc-950 relative flex items-center justify-center p-4">
        {thumbSrc ? (
          <img src={thumbSrc} alt={model.name} className="w-full h-full object-contain" />
        ) : (
          <Box size={48} className="text-zinc-800" />
        )}
        
        {model.isMissing && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-red-500 font-bold p-2 text-center">
            <AlertTriangle size={32} className="mb-2" />
            <span className="text-sm">MISSING FILE</span>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-medium text-white truncate" title={model.name}>
          {model.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-zinc-500 uppercase">{model.format}</span>
          <span className="text-xs text-zinc-600">{(model.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        {model.isMissing && (
          <div className="mt-2 text-[10px] text-red-400 truncate" title={model.relativePath}>
            {model.relativePath}
          </div>
        )}
      </div>
    </div>
  );
}
