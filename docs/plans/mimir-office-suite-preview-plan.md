# Mimir Office Preview Suite Plan (Word, Excel, PowerPoint)

This document specifies the architecture, design, and implementation plan for bringing the exact OpenAI ChatGPT ("Walnut" & "Popcorn") Office preview experience into Mimir for PowerPoint (`.pptx`), Word (`.docx`), and Excel (`.xlsx`).

---

## 1. Executive Architecture & REA Findings

Reverse-engineering the ChatGPT desktop application (`/usr/lib/chatgpt/resources/app.asar`) revealed the two-layer architecture OpenAI uses:

1. **Decoder Tier ("Walnut")**: A background WebAssembly engine (`Walnut.wasm` + `DocumentFormat.OpenXml.wasm` + `.NET Wasm` + `Google.Protobuf`) that ingests raw OpenXML ZIP files and emits clean binary protobuf models.
2. **Surface Tier ("Popcorn")**: Canvas and DOM-based renderers with floating formatting bars, interactive hit-testing, speaker notes, and zoom engines.

### Mimir Translation Architecture

In Mimir, we achieve identical visual fidelity, layout behavior, and user experience without bundling 30MB of heavy .NET WebAssembly binaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MIMIR OFFICE PREVIEW ARCHITECTURE                     │
├───────────────────────┬─────────────────────────────┬───────────────────────┤
│  PowerPoint (.pptx)   │        Word (.docx)         │     Excel (.xlsx)     │
├───────────────────────┼─────────────────────────────┼───────────────────────┤
│ • pptx-preview & Zip  │ • docx-preview (same engine │ • Univer / CanvasGrid │
│ • Active Slide Stage  │   OpenAI uses in app.asar)  │ • Multi-sheet tabs    │
│ • Thumbnail Left Rail │ • Paginated HTML sheets     │ • Formula bar (A1/fx) │
│ • Attached Notes Pane │ • Word-matching margins     │ • Cell selection      │
│ • Fullscreen Slideshow│ • Responsive zoom controls  │ • Range comments      │
│ • Shape Annotator     │ • Shape/text commentary     │ • Table edit prompts  │
└───────────────────────┴─────────────────────────────┴───────────────────────┘
```

---

## 2. Phased Roadmap

### Phase 1: PowerPoint Preview Polish (Completed)

- [x] **REA Analysis**: Reverse-engineer ChatGPT's presentation layout, notes placement, and zoom math.
- [x] **Speaker Notes Extraction**: Parse `ppt/notesSlides/notesSlide*.xml` directly from the PPTX buffer via `extractPptxSpeakerNotes` (`JSZip` + XML parsing) in `usePptxDocument`.
- [x] **Slide Thumbnail Rail**: Collapsible left sidebar (`SlideThumbnailRail.tsx`) displaying slide count, thumbnail cards, and active selection ring.
- [x] **Single-Slide Stage Viewport**: Replace vertical scroll stack with a focused, centered slide stage in `PptxFilePreview.tsx`.
- [x] **Attached Speaker Notes Pane**: Auto-sizing pane anchored below the active slide (`SpeakerNotesPane.tsx`), matching ChatGPT's typography and dimensions.
- [x] **ChatGPT-Style Toolbar**:
  - File name + PPTX badge.
  - `Request edits` action button (arms shape commentary).
  - Navigation pager (`Previous slide`, `Slide N of M`, `Next slide`).
  - Zoom controls (`Fit width`, `Fit page`, steppers).
  - Fullscreen slideshow mode (Play icon).
  - Open in editor & reload controls.
- [x] **Fullscreen Presenter Mode**: Fullscreen slideshow presentation mode (`PptxPresentationModal.tsx`) with arrow key navigation (`←`, `→`, `Space`, `Escape`) and notes drawer (`N`).

### Phase 2: Word Preview (`.docx`)

- [ ] Install and configure `docx-preview` in `apps/web`.
- [ ] Create `DocxFilePreview.tsx` adopting the unified Mimir viewer chrome.
- [ ] Implement paginated sheet layout with realistic paper shadows and margins.
- [ ] Connect selection/commenting workflow for agent prompt feedback.

### Phase 3: Excel & Spreadsheet Preview (`.xlsx`, `.csv`, `.tsv`)

- [ ] Integrate lightweight virtualized canvas spreadsheet engine.
- [ ] Support multi-sheet tabs (`Sheet1`, `Sheet2`, etc.) at the bottom.
- [ ] Include top formula bar with active cell coordinate (`B4`) and formula editor.
- [ ] Enable cell and range selection with copy and prompt injection (`"Update B2:B10"`).

---

## 3. Phase 1 Implementation Specification

### 3.1 Speaker Notes Schema

```typescript
export interface PptxSlideNotes {
  slideNumber: number;
  text: string;
}

export interface PptxDocumentState {
  status: PptxDocumentStatus;
  numSlides: number;
  slideSize: ViewerContentSize | null;
  slideShapes: PptxSlideShapeIndex[];
  slideNotes: Map<number, string>; // 1-based slide index -> speaker notes text
  renderedWidth: number | null;
  error: string | null;
}
```

### 3.2 Thumbnail Rail Specifications

- **Header**: Text badge `"{N} slides"` with collapse icon toggle (`lucide-panel-left-close` / `lucide-panel-left`).
- **Cards**: Fixed aspect ratio $(16:9 \text{ or } 4:3)$, rounded border (`rounded-md`), slide number badge at the top-left corner (`1`, `2`, ...).
- **Active State**: Highlight ring (`ring-2 ring-primary border-primary`).

### 3.3 Stage & Attached Speaker Notes Layout

- Active slide centered horizontally and vertically in stage.
- Attached notes container positioned immediately below slide:
  - Header label: `Speaker notes` (`text-ui-xs font-semibold text-muted-foreground uppercase`).
  - Content: `whitespace-pre-wrap text-ui text-foreground/90`.
  - Placeholder: `"No speaker notes for this slide."` when empty.
