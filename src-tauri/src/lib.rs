use tauri_plugin_sql::{Migration, MigrationKind};

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS Models (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    relativePath TEXT UNIQUE,
                    folderName TEXT,
                    format TEXT,
                    sizeBytes INTEGER,
                    maker TEXT,
                    labels TEXT,
                    categories TEXT,
                    dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
                    hasCustomThumbnail BOOLEAN DEFAULT 0,
                    isMissing BOOLEAN DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS Model_Parts (
                    parent_id TEXT,
                    part_id TEXT,
                    PRIMARY KEY (parent_id, part_id),
                    FOREIGN KEY(parent_id) REFERENCES Models(id),
                    FOREIGN KEY(part_id) REFERENCES Models(id)
                );
                CREATE TABLE IF NOT EXISTS Settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    baseDirectory TEXT,
                    autoRenderThreshold INTEGER DEFAULT 50
                );
                INSERT OR IGNORE INTO Settings (id, baseDirectory, autoRenderThreshold) VALUES (1, '', 50);
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:vault3d.db", migrations)
            .build()
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_drag::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_directory,
            commands::save_thumbnail
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
