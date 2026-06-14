import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getDb, Model, Settings } from "./db";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ModelGrid } from "./components/ModelGrid";
import { DetailPanel } from "./components/DetailPanel";
import { BatchPanel } from "./components/BatchPanel";
import { v4 as uuidv4 } from "uuid";
import { useStore } from "./store";
import toast from "react-hot-toast";

function App() {
  const { 
    setModels, 
    setBaseDirectory, 
    setIsScanning, selectedModelIds 
  } = useStore();

  useEffect(() => {
    loadSettingsAndModels();
  }, []);

  const loadSettingsAndModels = async () => {
    try {
      const db = await getDb();
      
      // Get settings
      const settingsResult = await db.select<Settings[]>("SELECT * FROM Settings WHERE id = 1");
      let currentBaseDir = "";
      if (settingsResult.length > 0) {
        currentBaseDir = settingsResult[0].baseDirectory;
        setBaseDirectory(currentBaseDir);
      }

      // If no base directory is set, prompt user
      if (!currentBaseDir) {
        const selectedDir = await open({
          directory: true,
          multiple: false,
          title: "Select 3D Models Base Directory"
        });
        if (selectedDir) {
          currentBaseDir = selectedDir as string;
          await db.execute("UPDATE Settings SET baseDirectory = $1 WHERE id = 1", [currentBaseDir]);
          setBaseDirectory(currentBaseDir);
          toast.success("Base directory updated");
        }
      }

      if (currentBaseDir) {
        await fetchModels();
      }
    } catch (err: any) {
      console.error("Failed to initialize:", err);
      toast.error(`Initialization failed: ${err.message || err}`);
    }
  };

  const fetchModels = async () => {
    try {
      const db = await getDb();
      const allModels = await db.select<Model[]>("SELECT * FROM Models ORDER BY name ASC");
      setModels(allModels);
    } catch (err: any) {
      console.error("Failed to fetch models:", err);
      toast.error("Failed to fetch models from database");
    }
  };

  const handleScan = async () => {
    const currentBaseDir = useStore.getState().baseDirectory;
    if (!currentBaseDir) {
      toast.error("No base directory set");
      return;
    }
    try {
      setIsScanning(true);
      const db = await getDb();
      
      const scanToast = toast.loading("Scanning directory...");
      // Scan file system
      const scannedModels: any[] = await invoke("scan_directory", { baseDir: currentBaseDir });
      
      toast.loading("Syncing database...", { id: scanToast });
      
      await db.execute("BEGIN TRANSACTION");
      try {
        // Update DB
        // 1. Mark existing models as missing if they aren't in the scanned list
        const existingModels = await db.select<Model[]>("SELECT id, relativePath FROM Models");
        const scannedPaths = new Set(scannedModels.map(m => m.relative_path));
        
        for (const m of existingModels) {
          if (!scannedPaths.has(m.relativePath)) {
            await db.execute("UPDATE Models SET isMissing = 1 WHERE id = $1", [m.id]);
          } else {
            await db.execute("UPDATE Models SET isMissing = 0 WHERE id = $1", [m.id]);
          }
        }

        // 2. Insert new models
        const existingPaths = new Set(existingModels.map(m => m.relativePath));
        let newModelsCount = 0;
        
        for (const sm of scannedModels) {
          if (!existingPaths.has(sm.relative_path)) {
            newModelsCount++;
            const id = uuidv4();
            await db.execute(
              `INSERT INTO Models (id, name, relativePath, folderName, format, sizeBytes, maker, labels, categories, hasCustomThumbnail, isMissing) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                id, sm.name, sm.relative_path, sm.folder_name, sm.format, sm.size_bytes,
                "", "[]", "[]", 0, 0
              ]
            );
          }
        }
        await db.execute("COMMIT");
        toast.success(`Scan complete. Found ${newModelsCount} new models.`, { id: scanToast });
      } catch (err) {
        await db.execute("ROLLBACK");
        throw err;
      }
      
      await fetchModels();

    } catch (err: any) {
      console.error("Scan failed:", err);
      toast.error(`Scan failed: ${err.message || err}`);
    } finally {
      setIsScanning(false);
    }
  };



  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar onScan={handleScan} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <div className="flex-1 flex overflow-hidden">
          <ModelGrid />
          
          {selectedModelIds.length === 1 && (
            <DetailPanel onUpdate={fetchModels} />
          )}
          {selectedModelIds.length > 1 && (
            <BatchPanel onUpdate={fetchModels} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
