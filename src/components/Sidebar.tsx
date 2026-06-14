import { Settings, Folder, RefreshCw, AlertCircle } from "lucide-react";
import { useStore } from "../store";

interface SidebarProps {
  onScan: () => void;
}

export function Sidebar({ onScan }: SidebarProps) {
  const { isScanning, baseDirectory } = useStore();
  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-sm font-bold text-white">V</span>
          </div>
          Vault 3D
        </h1>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {baseDirectory ? (
          <div className="text-sm">
            <div className="px-2 py-1 text-zinc-500 font-medium text-xs mb-1">LIBRARY</div>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 text-left">
              <Folder size={16} className="text-blue-500" />
              All Models
            </button>
            {/* Folder tree would be rendered here */}
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center justify-center text-center h-full text-zinc-500 space-y-3">
            <AlertCircle size={32} />
            <p className="text-sm">No base directory set. Click Settings to configure.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={onScan}
          disabled={isScanning || !baseDirectory}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-md py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
          {isScanning ? "Scanning..." : "Scan Changes"}
        </button>
      </div>
    </div>
  );
}
