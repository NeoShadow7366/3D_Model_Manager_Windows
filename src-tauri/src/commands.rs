use std::fs;
use std::path::Path;

#[tauri::command]
pub async fn save_thumbnail(
    base_dir: String,
    relative_path: String,
    image_data_base64: String,
) -> Result<(), String> {
    // Determine the target path
    let model_path = Path::new(&base_dir).join(&relative_path);
    let parent_dir = model_path.parent().ok_or("Invalid path")?;
    
    // Generate thumbnail path (e.g., model_thumb.png)
    let file_stem = model_path.file_stem().and_then(|s| s.to_str()).unwrap_or("thumb");
    let thumb_name = format!("{}_thumb.png", file_stem);
    let thumb_path = parent_dir.join(thumb_name);

    // Decode base64 data
    let base64_str = if image_data_base64.starts_with("data:") {
        image_data_base64.split(",").nth(1).unwrap_or(&image_data_base64)
    } else {
        &image_data_base64
    };

    use base64ct::{Base64, Encoding};
    let mut buffer = vec![0; base64_str.len()];
    let decoded = Base64::decode(base64_str, &mut buffer).map_err(|e| e.to_string())?;

    fs::write(&thumb_path, decoded).map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(serde::Serialize, Clone)]
pub struct ScannedModel {
    pub name: String,
    pub relative_path: String,
    pub folder_name: String,
    pub format: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub async fn scan_directory(base_dir: String) -> Result<Vec<ScannedModel>, String> {
    let mut results = Vec::new();
    let root_path = Path::new(&base_dir);
    
    if !root_path.exists() || !root_path.is_dir() {
        return Err("Base directory does not exist or is not a directory".into());
    }

    let mut dirs_to_visit = vec![root_path.to_path_buf()];

    while let Some(current_dir) = dirs_to_visit.pop() {
        if let Ok(entries) = fs::read_dir(&current_dir) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                if path.is_dir() {
                    dirs_to_visit.push(path);
                } else if path.is_file() {
                    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                        let ext = ext.to_lowercase();
                        if ext == "glb" || ext == "gltf" || ext == "fbx" || ext == "obj" || ext == "stl" {
                            if let Ok(rel_path) = path.strip_prefix(root_path) {
                                let relative_path = rel_path.to_string_lossy().to_string();
                                let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string();
                                let folder_name = current_dir.file_name().and_then(|s| s.to_str()).unwrap_or("root").to_string();
                                let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
                                
                                results.push(ScannedModel {
                                    name,
                                    relative_path: relative_path.replace("\\", "/"),
                                    folder_name,
                                    format: ext,
                                    size_bytes,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(results)
}
