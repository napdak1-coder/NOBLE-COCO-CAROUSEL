# DB Structure

The app is designed around a small editable design document, not a full Figma clone.

## Tables

- `brands`: shop identity, colors, fonts, handle, writing voice.
- `projects`: one carousel generation job, including topic, audience, goal, and status.
- `assets`: uploaded product photos and logos.
- `templates`: reusable card layouts with placeholder element definitions.
- `slides`: carousel cards generated for a project.
- `elements`: editable objects on each slide: image, text, shape.
- `exports`: generated image/zip export history.

## Runtime Document Shape

The browser MVP stores the active project in `localStorage` as:

```json
{
  "brand": {},
  "project": {},
  "assets": [],
  "slides": [
    {
      "id": "slide_1",
      "templateId": "luxury-minimal",
      "role": "hook",
      "headline": "...",
      "body": "...",
      "elements": []
    }
  ]
}
```

This mirrors the relational schema so the later backend can migrate without changing the editor model.
