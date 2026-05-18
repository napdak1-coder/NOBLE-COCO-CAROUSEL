-- Luxury Carousel Studio relational schema draft.
-- MVP stores the same document shape in browser localStorage; this schema is
-- ready for SQLite/PostgreSQL when multi-user storage is added.

CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  voice TEXT NOT NULL DEFAULT '고급스럽고 절제된',
  primary_color TEXT NOT NULL DEFAULT '#111111',
  accent_color TEXT NOT NULL DEFAULT '#b89b5e',
  font_heading TEXT NOT NULL DEFAULT 'Pretendard',
  font_body TEXT NOT NULL DEFAULT 'Pretendard',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  audience TEXT,
  goal TEXT,
  slide_count INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  kind TEXT NOT NULL CHECK (kind IN ('image', 'logo')),
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 1080,
  height INTEGER NOT NULL DEFAULT 1350,
  template_json TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slides (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  template_id TEXT REFERENCES templates(id),
  slide_index INTEGER NOT NULL,
  role TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  visual_direction TEXT,
  background_color TEXT NOT NULL DEFAULT '#f8f4ee',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, slide_index)
);

CREATE TABLE elements (
  id TEXT PRIMARY KEY,
  slide_id TEXT NOT NULL REFERENCES slides(id),
  asset_id TEXT REFERENCES assets(id),
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'shape')),
  name TEXT NOT NULL,
  content TEXT,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  rotation REAL NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  style_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  format TEXT NOT NULL CHECK (format IN ('png', 'jpg', 'zip')),
  storage_url TEXT,
  slide_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_brand_id ON projects(brand_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_slides_project_id ON slides(project_id);
CREATE INDEX idx_elements_slide_id ON elements(slide_id);
