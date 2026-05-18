const CANVAS = { width: 1080, height: 1350 };
const SCALE = 0.22;
const STORAGE_KEY = "luxury-carousel-studio-v5";

const $ = (id) => document.getElementById(id);

const dom = {
  brandName: $("brandName"),
  brandHandle: $("brandHandle"),
  slideCount: $("slideCount"),
  templateSetSelect: $("templateSetSelect"),
  imageUpload: $("imageUpload"),
  assetGrid: $("assetGrid"),
  generateBtn: $("generateBtn"),
  exportCurrentBtn: $("exportCurrentBtn"),
  exportAllBtn: $("exportAllBtn"),
  projectTitle: $("projectTitle"),
  saveState: $("saveState"),
  canvasGrid: $("canvasGrid"),
  activeSlideLabel: $("activeSlideLabel"),
  headlineInput: $("headlineInput"),
  bodyInput: $("bodyInput"),
  lockTemplateBtn: $("lockTemplateBtn"),
  restoreTemplateBtn: $("restoreTemplateBtn"),
  textElementList: $("textElementList"),
  selectedHint: $("selectedHint"),
  elementContent: $("elementContent"),
  elementX: $("elementX"),
  elementY: $("elementY"),
  elementW: $("elementW"),
  elementH: $("elementH"),
  fontFamily: $("fontFamily"),
  fontSize: $("fontSize"),
  elementColor: $("elementColor"),
  deleteElementBtn: $("deleteElementBtn")
};

const templates = [
  { id: "figma-button-cover", name: "피그마 버튼 커버" },
  { id: "figma-button-grid", name: "버튼 컴포넌트 그리드" },
  { id: "figma-button-detail", name: "버튼 상세 카드" },
  { id: "torn-paper-hook", name: "찢은 종이 후킹" },
  { id: "photo-overlay-hook", name: "사진 오버레이" },
  { id: "instagram-mockup", name: "인스타 목업" },
  { id: "luxury-minimal", name: "럭셔리 미니멀" },
  { id: "editorial-split", name: "에디토리얼 분할" },
  { id: "boutique-note", name: "편집샵 노트" },
  { id: "notebook-page", name: "공책 메모" },
  { id: "soft-sale", name: "소프트 세일" },
  { id: "detail-card", name: "디테일 카드" }
];

const templateSets = {
  viral: {
    name: "유튜브형 바이럴 세트",
    sequence: ["torn-paper-hook", "photo-overlay-hook", "instagram-mockup", "notebook-page", "detail-card", "soft-sale"]
  },
  luxury: {
    name: "명품 편집샵 세트",
    sequence: ["luxury-minimal", "editorial-split", "boutique-note", "detail-card", "soft-sale", "notebook-page"]
  },
  notebook: {
    name: "공책/메모 세트",
    sequence: ["notebook-page", "boutique-note", "torn-paper-hook", "detail-card", "instagram-mockup", "soft-sale"]
  },
  product: {
    name: "제품 홍보 세트",
    sequence: ["detail-card", "photo-overlay-hook", "luxury-minimal", "editorial-split", "soft-sale", "instagram-mockup"]
  },
  figma: {
    name: "피그마 버튼 스타일",
    sequence: ["figma-button-cover", "figma-button-grid", "figma-button-detail", "photo-overlay-hook", "detail-card", "instagram-mockup"]
  }
};

const templateName = (templateId) => templates.find((template) => template.id === templateId)?.name || "템플릿";
const templateSequenceFor = (setId) => templateSets[setId]?.sequence || templateSets.viral.sequence;

const FONTS = {
  ui: '"Noto Sans KR", Arial, sans-serif',
  hook: '"Black Han Sans", "Noto Sans KR", Arial, sans-serif',
  round: '"Jua", "Noto Sans KR", Arial, sans-serif',
  hand: '"Poor Story", "Noto Sans KR", Arial, sans-serif'
};

const fontFamilyFor = (key) => FONTS[key] || FONTS.ui;
const fontKeyFor = (fontFamily) => Object.keys(FONTS).find((key) => FONTS[key] === fontFamily) || "ui";

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

let focusTarget = null;
let dragSession = null;

const defaultState = () => ({
  brand: {
    id: "brand_demo",
    name: "Maison Select",
    handle: "@maison.select",
    primaryColor: "#211c17",
    accentColor: "#ad8750"
  },
  project: {
    id: "project_demo",
    title: "Maison Select 캐러셀",
    slideCount: 4,
    templateSet: "figma",
    status: "draft"
  },
  assets: [],
  activeSlideId: "slide_1",
  selectedElementId: null,
  slides: buildSlides({
    brandName: "Maison Select",
    brandHandle: "@maison.select",
    count: 4,
    templateSet: "figma",
    image: null
  })
});

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    if (saved?.slides?.length) return normalizeState(saved);
  } catch {
    // Ignore broken drafts.
  }
  return defaultState();
}

function normalizeState(saved) {
  saved.brand ||= {};
  saved.brand.name ||= "Maison Select";
  saved.brand.handle ||= "@maison.select";
  saved.project ||= {};
  saved.project.slideCount = clamp(Number(saved.project.slideCount || saved.slides.length || 4), 3, 6);
  saved.project.templateSet = templateSets[saved.project.templateSet] ? saved.project.templateSet : "viral";
  saved.project.title = `${saved.brand.name} 캐러셀`;
  saved.slides.forEach((slide, index) => {
    slide.slideIndex = index + 1;
    slide.lockTemplate = Boolean(slide.lockTemplate);
    slide.elements ||= [];
    slide.elements.forEach((element) => {
      element.style ||= {};
      element.style.fontKey ||= fontKeyFor(element.style.fontFamily);
      element.style.fontFamily ||= fontFamilyFor(element.style.fontKey);
      element.locked = Boolean(element.locked);
      element.template = Boolean(element.template);
    });
  });
  return saved;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  dom.saveState.textContent = "자동 저장됨";
  window.clearTimeout(persist.timer);
  persist.timer = window.setTimeout(() => {
    dom.saveState.textContent = "편집 가능";
  }, 900);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getSlide(slideId = state.activeSlideId) {
  return state.slides.find((slide) => slide.id === slideId) || state.slides[0];
}

function selectedElement() {
  const slide = getSlide();
  return slide?.elements.find((element) => element.id === state.selectedElementId) || null;
}

function defaultCopies({ brandName, brandHandle, count }) {
  const all = [
    {
      role: "hook",
      headline: "조용한 존재감",
      body: "오늘 입고된 셀렉션을 가장 먼저 만나보세요.",
      visual: "첫 장은 제품 무드와 후킹 문구 중심"
    },
    {
      role: "product_highlight",
      headline: "디테일 포인트",
      body: "균형 잡힌 실루엣과 은은한 포인트가 매일의 룩을 정리합니다.",
      visual: "사진과 짧은 설명을 나란히 배치"
    },
    {
      role: "styling",
      headline: "어울리는 순간",
      body: "출근 룩부터 주말 약속까지, 과하지 않게 존재감을 더합니다.",
      visual: "공책 스타일 메모 카드"
    },
    {
      role: "reason_to_buy",
      headline: "지금 보는 이유",
      body: "문의가 빠른 라인은 좋은 컨디션부터 먼저 소진됩니다.",
      visual: "구매 이유를 정리한 텍스트 카드"
    },
    {
      role: "proof",
      headline: "확인 포인트",
      body: "상세 사진, 컨디션, 구성품은 문의 시 카드별로 안내드립니다.",
      visual: "체크리스트 느낌의 증거 카드"
    },
    {
      role: "cta",
      headline: "상세 문의",
      body: `${brandName} ${brandHandle}\n상세 사진과 가격은 DM으로 안내드립니다.`,
      visual: "브랜드명과 CTA를 절제해서 마무리"
    }
  ];

  return all.slice(0, count);
}

function figmaButtonCopies({ brandName, brandHandle, count }) {
  const all = [
    {
      role: "figma_hook",
      headline: "피그마 버튼 스타일",
      body: "사진을 올리면 버튼형 카드 안에 자동으로 정리됩니다.",
      visual: "Figma 컴포넌트 느낌의 커버 카드"
    },
    {
      role: "figma_grid",
      headline: "버튼처럼 고르는 피드",
      body: "Primary, Soft, Ghost 버튼처럼 상품 포인트를 한눈에 나눠 보여줍니다.",
      visual: "버튼 상태를 나열한 컴포넌트 그리드"
    },
    {
      role: "figma_detail",
      headline: "사진이 컴포넌트가 됩니다",
      body: "업로드한 사진을 라운드 카드와 CTA 버튼 구조에 맞춰 배치합니다.",
      visual: "제품 사진과 버튼 CTA를 결합한 상세 카드"
    },
    {
      role: "figma_proof",
      headline: "저장되는 정보 구조",
      body: "가격, 상태, 구성품, 문의 버튼을 깔끔한 인터페이스처럼 정리하세요.",
      visual: "피그마 UI 스타일 정보 카드"
    },
    {
      role: "figma_cta",
      headline: "DM 문의 버튼",
      body: `${brandName} ${brandHandle}\n원하는 상품을 누르듯 DM으로 문의하세요.`,
      visual: "강한 CTA 버튼 중심 카드"
    },
    {
      role: "figma_finish",
      headline: "셀렉션 보러가기",
      body: "하나의 피드가 작은 쇼룸 인터페이스처럼 보이게 마무리합니다.",
      visual: "인스타 목업과 버튼형 마무리 카드"
    }
  ];

  return all.slice(0, count);
}

function buildSlides({ brandName, brandHandle, count, image, templateSet = "viral" }) {
  const cycle = templateSequenceFor(templateSet);
  const copies = templateSet === "figma"
    ? figmaButtonCopies({ brandName, brandHandle, count })
    : defaultCopies({ brandName, brandHandle, count });
  return copies.map((copy, index) => {
    const slide = {
      id: `slide_${index + 1}`,
      slideIndex: index + 1,
      role: copy.role,
      templateId: cycle[index],
      lockTemplate: false,
      headline: copy.headline,
      body: copy.body,
      visualDirection: copy.visual,
      backgroundColor: "#fffaf0",
      elements: []
    };
    applyTemplate(slide, image, { brandName, brandHandle });
    return slide;
  });
}

function applyTemplate(slide, image, brand) {
  const imageContent = image?.dataUrl || image?.content || null;
  const template = slide.templateId;
  const dark = template === "soft-sale";
  slide.backgroundColor = dark ? "#282019" : template === "notebook-page" ? "#fffdf4" : "#fffaf0";

  const elements = [
    elShape("background", 0, 0, CANVAS.width, CANVAS.height, { fill: slide.backgroundColor, radius: 0 }, 0, true)
  ];

  if (template === "notebook-page") {
    elements.push(elShape("paper_margin", 120, 0, 3, CANVAS.height, { fill: "#e7b6a8" }, 1, true));
    for (let y = 170; y < 1210; y += 58) {
      elements.push(elShape("notebook_line", 0, y, CANVAS.width, 2, { fill: "#d9e2df" }, 1, true));
    }
    elements.push(elShape("tape", 690, 82, 190, 54, { fill: "rgba(190,160,106,0.34)", radius: 3 }, 4, true));
  }

  if (template === "figma-button-cover") {
    slide.backgroundColor = "#f5f7fb";
    elements[0].style.fill = slide.backgroundColor;
    addFigmaGrid(elements, "#dde4f0");
    elements.push(elShape("window", 74, 80, 932, 1135, { fill: "#ffffff", radius: 42, boxShadow: "0 26px 70px rgba(27,39,65,0.16)" }, 1, true));
    elements.push(elShape("window_top", 74, 80, 932, 116, { fill: "#f0f3f9", radius: 42 }, 2, true));
    elements.push(elShape("dot_red", 126, 122, 24, 24, { fill: "#ff6b6b", radius: 999 }, 3, true));
    elements.push(elShape("dot_yellow", 166, 122, 24, 24, { fill: "#ffd166", radius: 999 }, 3, true));
    elements.push(elShape("dot_green", 206, 122, 24, 24, { fill: "#5dd39e", radius: 999 }, 3, true));
    elements.push(styledText("paper_label", "FIGMA BUTTON SYSTEM", 282, 116, 520, 42, 27, "#526071", 900, 4, true, null, 0, {
      align: "center",
      fontFamily: FONTS.round,
      valign: "center"
    }));
    elements.push(styledText("headline", slide.headline, 130, 250, 820, 170, 74, "#111827", 900, 5, true, null, 0, {
      align: "center",
      fontFamily: FONTS.hook,
      valign: "center"
    }));
    elements.push(styledText("body", slide.body, 185, 426, 710, 112, 36, "#526071", 700, 5, true, null, 0, {
      align: "center",
      valign: "center"
    }));
    elements.push(photoElement(imageContent, 162, 595, 756, 420, 34, 4, true));
    elements.push(styledText("keyword_badge", "Primary", 206, 1070, 210, 74, 32, "#ffffff", 900, 7, true, "#2563eb", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(styledText("comment_prompt", "Hover", 448, 1070, 170, 74, 32, "#1f2937", 900, 7, true, "#e5edff", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(styledText("subtitle_bar", "DM 문의", 650, 1070, 220, 74, 32, "#111827", 900, 7, true, "#facc15", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(brandMark(brand, slide, 132, 1238, 470, false));
    slide.elements = elements;
    return;
  }

  if (template === "figma-button-grid") {
    slide.backgroundColor = "#111827";
    elements[0].style.fill = slide.backgroundColor;
    addFigmaGrid(elements, "rgba(255,255,255,0.06)");
    elements.push(styledText("paper_label", "COMPONENTS", 88, 88, 250, 58, 28, "#93c5fd", 900, 4, true, "rgba(37,99,235,0.18)", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(styledText("headline", slide.headline, 88, 185, 840, 130, 76, "#ffffff", 900, 4, true, null, 0, {
      fontFamily: FONTS.hook,
      valign: "center"
    }));
    elements.push(styledText("body", slide.body, 92, 338, 780, 120, 35, "#cbd5e1", 600, 4, true, null, 0, {
      valign: "center"
    }));
    elements.push(buttonChip("Primary", 92, 520, 250, "#2563eb", "#ffffff", 5));
    elements.push(buttonChip("Secondary", 374, 520, 290, "#ffffff", "#111827", 5));
    elements.push(buttonChip("Ghost", 696, 520, 230, "rgba(255,255,255,0.08)", "#f8fafc", 5));
    elements.push(buttonChip("New Arrival", 92, 640, 320, "#facc15", "#1f2937", 5));
    elements.push(buttonChip("Sold Out", 444, 640, 240, "#334155", "#94a3b8", 5));
    elements.push(buttonChip("DM", 716, 640, 160, "#fb7185", "#ffffff", 5));
    elements.push(elShape("component_card", 92, 790, 896, 360, { fill: "#f8fafc", radius: 34, boxShadow: "0 26px 64px rgba(0,0,0,0.28)" }, 4, true));
    elements.push(photoElement(imageContent, 126, 824, 330, 292, 24, 5, true));
    elements.push(styledText("mockup_header", "Button / Product Card", 500, 842, 370, 52, 30, "#111827", 900, 6, true, null, 0, {
      fontFamily: FONTS.round,
      valign: "center"
    }));
    elements.push(styledText("subtitle_bar", "상태값과 사진이 한 카드에 정리됩니다.", 500, 924, 380, 88, 32, "#475569", 700, 6, true, null, 0, {
      valign: "center"
    }));
    elements.push(styledText("comment_prompt", "선택하기", 500, 1040, 250, 70, 31, "#ffffff", 900, 7, true, "#111827", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(brandMark(brand, slide, 92, 1235, 470, true));
    slide.elements = elements;
    return;
  }

  if (template === "figma-button-detail") {
    slide.backgroundColor = "#eef2ff";
    elements[0].style.fill = slide.backgroundColor;
    addFigmaGrid(elements, "#d7def5");
    elements.push(elShape("main_panel", 78, 90, 924, 1160, { fill: "#ffffff", radius: 38, boxShadow: "0 28px 80px rgba(53,74,119,0.18)" }, 1, true));
    elements.push(styledText("paper_label", "AUTO LAYOUT", 132, 142, 240, 58, 28, "#3730a3", 900, 4, true, "#e0e7ff", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(styledText("headline", slide.headline, 132, 238, 720, 140, 68, "#111827", 900, 4, true, null, 0, {
      fontFamily: FONTS.hook,
      valign: "center"
    }));
    elements.push(photoElement(imageContent, 132, 430, 816, 470, 36, 3, true));
    elements.push(styledText("body", slide.body, 132, 940, 545, 115, 34, "#4b5563", 700, 4, true, null, 0, {
      valign: "center"
    }));
    elements.push(styledText("keyword_badge", "상태 확인", 700, 938, 210, 64, 29, "#166534", 900, 5, true, "#dcfce7", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 10,
      valign: "center"
    }));
    elements.push(styledText("comment_prompt", "DM으로 가격 받기", 132, 1100, 392, 82, 34, "#ffffff", 900, 6, true, "#111827", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 14,
      valign: "center"
    }));
    elements.push(styledText("subtitle_bar", "저장", 548, 1100, 150, 82, 34, "#111827", 900, 6, true, "#f3f4f6", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 14,
      valign: "center"
    }));
    elements.push(styledText("mockup_header", "공유", 722, 1100, 150, 82, 34, "#111827", 900, 6, true, "#f3f4f6", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 14,
      valign: "center"
    }));
    elements.push(brandMark(brand, slide, 132, 1235, 470, false));
    slide.elements = elements;
    return;
  }

  if (template === "torn-paper-hook") {
    slide.backgroundColor = "#b8833b";
    elements[0].style.fill = slide.backgroundColor;
    elements.push(elShape("paper_shadow", 112, 98, 866, 1040, { fill: "rgba(54,38,24,0.16)", radius: 26 }, 1, true));
    elements.push(elShape("paper_sheet", 78, 70, 918, 1068, { fill: "#fff9e9", radius: 24, boxShadow: "0 28px 60px rgba(40,27,15,0.22)" }, 2, true));
    addTornEdge(elements, 78, 70, 918, slide.backgroundColor, 3, "top");
    addTornEdge(elements, 78, 1138, 918, slide.backgroundColor, 3, "bottom");
    addPaperTexture(elements, 126, 120, 820, 760, 3);
    elements.push(styledText("paper_label", "LIMITED SELECTION", 160, 156, 760, 46, 25, "#8a6841", 800, 5, true, null, 0, {
      align: "center",
      fontFamily: FONTS.round
    }));
    elements.push(styledText("headline", slide.headline, 144, 270, 790, 230, 90, "#24201b", 900, 5, true, null, 0, {
      align: "center",
      fontFamily: FONTS.hook,
      valign: "center"
    }));
    elements.push(styledText("body", slide.body, 190, 520, 700, 135, 38, "#5d5044", 700, 5, true, null, 0, {
      align: "center",
      fontFamily: FONTS.hand,
      valign: "center"
    }));
    const badge = styledText("keyword_badge", "DM", 706, 690, 190, 120, 82, "#fff9e9", 900, 8, true, "#2b2119", 999, {
      align: "center",
      fontFamily: FONTS.round,
      valign: "center"
    });
    badge.rotation = -5;
    elements.push(badge);
    elements.push(styledText("comment_prompt", "입고 리스트 받기", 210, 700, 430, 76, 34, "#2d2319", 900, 6, true, "#f0ddbd", 999, {
      align: "center",
      fontFamily: FONTS.round,
      valign: "center",
      padding: 12
    }));
    elements.push(rotatedPhoto(imageContent, 132, 845, 270, 330, 14, 5, -8));
    elements.push(rotatedPhoto(imageContent, 342, 812, 270, 330, 14, 6, 4));
    elements.push(rotatedPhoto(imageContent, 552, 856, 270, 330, 14, 5, 9));
    elements.push(brandMark(brand, slide, 150, 1212, 460, false));
    slide.elements = elements;
    return;
  }

  if (template === "photo-overlay-hook") {
    slide.backgroundColor = "#161310";
    elements[0].style.fill = slide.backgroundColor;
    elements.push(photoElement(imageContent, 0, 0, CANVAS.width, CANVAS.height, 0, 1, true));
    elements.push(elShape("cinema_overlay", 0, 0, CANVAS.width, CANVAS.height, { fill: "rgba(18,14,10,0.54)" }, 2, true));
    elements.push(elShape("top_fade", 0, 0, CANVAS.width, 230, { fill: "rgba(0,0,0,0.28)" }, 3, true));
    elements.push(styledText("paper_label", brand.brandName || "Maison Select", 70, 78, 350, 70, 30, "#fff7e7", 900, 4, true, "rgba(0,0,0,0.48)", 999, {
      fontFamily: FONTS.round,
      padding: 18,
      valign: "center"
    }));
    elements.push(styledText("headline", slide.headline, 105, 465, 870, 280, 92, "#fffaf0", 900, 5, true, null, 0, {
      align: "center",
      fontFamily: FONTS.hook,
      textShadow: "0 5px 22px rgba(0,0,0,0.55)",
      valign: "center"
    }));
    elements.push(styledText("body", slide.body, 150, 760, 780, 150, 40, "#f1dfc4", 700, 5, true, null, 0, {
      align: "center",
      valign: "center"
    }));
    elements.push(styledText("subtitle_bar", "매일 올리는 게 아니라\n선택되는 피드처럼", 188, 1072, 704, 122, 48, "#ffffff", 800, 8, true, "rgba(0,0,0,0.72)", 16, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 16,
      valign: "center"
    }));
    elements.push(styledText("comment_prompt", "지금 보기", 725, 84, 210, 70, 34, "#2b2119", 900, 5, true, "#fffaf0", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(brandMark(brand, slide, 70, 1248, 460, true));
    slide.elements = elements;
    return;
  }

  if (template === "instagram-mockup") {
    slide.backgroundColor = "#121315";
    elements[0].style.fill = slide.backgroundColor;
    elements.push(elShape("warm_side", 0, 0, 70, CANVAS.height, { fill: "#c99741" }, 1, true));
    elements.push(elShape("paper_post", 95, 105, 500, 1110, { fill: "#fff6e4", radius: 14, boxShadow: "0 22px 48px rgba(0,0,0,0.28)" }, 2, true));
    elements.push(styledText("paper_label", "TREND CHECK", 138, 150, 250, 42, 25, "#8d6a3c", 900, 4, true, null, 0, {
      fontFamily: FONTS.round,
      valign: "center"
    }));
    elements.push(rotatedPhoto(imageContent, 150, 230, 300, 380, 10, 5, -5));
    elements.push(rotatedPhoto(imageContent, 262, 345, 250, 330, 10, 6, 7));
    elements.push(styledText("headline", slide.headline, 138, 735, 405, 160, 64, "#24201b", 900, 6, true, null, 0, {
      fontFamily: FONTS.hook,
      valign: "center"
    }));
    elements.push(styledText("comment_prompt", "댓글 대신 DM으로", 138, 925, 340, 64, 30, "#fff7e7", 900, 6, true, "#2b2119", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(elShape("mockup_panel", 575, 96, 430, 1120, { fill: "#1b1d21", radius: 20, boxShadow: "0 22px 54px rgba(0,0,0,0.34)" }, 2, true));
    elements.push(elShape("profile_dot", 620, 140, 58, 58, { fill: "#d0a85c", radius: 999 }, 4, true));
    elements.push(styledText("mockup_header", brand.brandHandle || "@maison.select", 696, 138, 230, 58, 27, "#fff8ea", 800, 5, true, null, 0, {
      fontFamily: FONTS.round,
      valign: "center"
    }));
    elements.push(styledText("body", slide.body, 630, 250, 315, 250, 34, "#f2e5cf", 500, 5, true, null, 0, {
      valign: "top"
    }));
    elements.push(elShape("comment_line_1", 630, 570, 280, 18, { fill: "rgba(255,255,255,0.16)", radius: 999 }, 4, true));
    elements.push(elShape("comment_line_2", 630, 618, 220, 18, { fill: "rgba(255,255,255,0.11)", radius: 999 }, 4, true));
    elements.push(elShape("comment_line_3", 630, 666, 310, 18, { fill: "rgba(255,255,255,0.14)", radius: 999 }, 4, true));
    elements.push(styledText("keyword_badge", "SAVE", 630, 760, 155, 62, 30, "#1b1d21", 900, 5, true, "#fff8ea", 999, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 12,
      valign: "center"
    }));
    elements.push(styledText("subtitle_bar", "고객이 저장하는 카드뉴스 흐름", 630, 875, 300, 110, 38, "#ffffff", 900, 5, true, "rgba(0,0,0,0.48)", 14, {
      align: "center",
      fontFamily: FONTS.round,
      padding: 14,
      valign: "center"
    }));
    elements.push(brandMark(brand, slide, 630, 1135, 300, true));
    slide.elements = elements;
    return;
  }

  if (template === "editorial-split") {
    elements.push(photoElement(imageContent, 0, 0, 530, 1350, 0, 1, true));
    elements.push(elShape("warm_panel", 530, 0, 550, CANVAS.height, { fill: "#f6ead8" }, 1, true));
    elements.push(textElement("headline", slide.headline, 600, 240, 390, 230, 74, "#1f1a16", 800, 4, true));
    elements.push(textElement("body", slide.body, 600, 510, 380, 240, 34, "#695848", 400, 4, true));
    elements.push(brandMark(brand, slide, 600, 1215, 390, dark));
    slide.elements = elements;
    return;
  }

  if (template === "notebook-page") {
    elements.push(photoElement(imageContent, 160, 110, 760, 560, 18, 3, true));
    elements.push(textElement("headline", slide.headline, 150, 730, 800, 150, 76, "#2f2a24", 800, 5, true));
    elements.push(textElement("body", slide.body, 150, 900, 790, 190, 36, "#5e5247", 400, 5, true));
    elements.push(textElement("note_badge", "SELECT NOTE", 150, 1168, 260, 48, 24, "#8e6a3f", 800, 5, true));
    elements.push(brandMark(brand, slide, 720, 1204, 270, false));
    slide.elements = elements;
    return;
  }

  if (template === "boutique-note") {
    elements.push(elShape("soft_block", 64, 76, 952, 1166, { fill: "#f3e6d3", radius: 18 }, 1, true));
    elements.push(photoElement(imageContent, 118, 128, 844, 600, 14, 2, true));
    elements.push(textElement("headline", slide.headline, 120, 800, 820, 150, 78, "#211c17", 800, 4, true));
    elements.push(textElement("body", slide.body, 124, 968, 800, 170, 36, "#6b5b4b", 400, 4, true));
    elements.push(brandMark(brand, slide, 124, 1194, 450, false));
    slide.elements = elements;
    return;
  }

  if (template === "detail-card") {
    elements.push(elShape("left_bar", 74, 94, 12, 1110, { fill: "#ad8750", radius: 6 }, 2, true));
    elements.push(photoElement(imageContent, 130, 120, 820, 650, 9, 1, true));
    elements.push(textElement("headline", slide.headline, 130, 845, 820, 130, 72, "#20201b", 800, 3, true));
    elements.push(textElement("body", slide.body, 130, 1000, 780, 160, 34, "#625849", 400, 3, true));
    elements.push(textElement("detail_label", "CHECK", 760, 112, 160, 52, 24, "#fffaf0", 800, 4, true, "#ad8750", 999));
    elements.push(brandMark(brand, slide, 130, 1208, 420, false));
    slide.elements = elements;
    return;
  }

  if (template === "soft-sale") {
    elements.push(elShape("gold_plate", 80, 86, 920, 1178, { fill: "#34291e", radius: 16 }, 1, true));
    elements.push(photoElement(imageContent, 128, 132, 824, 590, 10, 2, true));
    elements.push(textElement("headline", slide.headline, 128, 802, 820, 145, 76, "#fff8ea", 800, 3, true));
    elements.push(textElement("body", slide.body, 132, 968, 790, 180, 34, "#dac7a8", 400, 3, true));
    elements.push(brandMark(brand, slide, 132, 1190, 470, true));
    slide.elements = elements;
    return;
  }

  elements.push(photoElement(imageContent, 90, 106, 900, 760, 12, 1, true));
  elements.push(textElement("headline", slide.headline, 94, 938, 900, 145, 82, "#211c17", 800, 3, true));
  elements.push(textElement("body", slide.body, 98, 1100, 850, 150, 34, "#665749", 400, 3, true));
  elements.push(brandMark(brand, slide, 98, 1260, 440, false));
  slide.elements = elements;
}

function elShape(name, x, y, width, height, style, zIndex, isTemplate = false) {
  return {
    id: uid("el"),
    type: "shape",
    name,
    content: "",
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex,
    template: isTemplate,
    locked: name === "background",
    style
  };
}

function photoElement(content, x, y, width, height, radius, zIndex, isTemplate = false) {
  if (content) {
    return {
      id: uid("el"),
      type: "image",
      name: "product_photo",
      content,
      x,
      y,
      width,
      height,
      rotation: 0,
      zIndex,
      template: isTemplate,
      locked: false,
      style: { radius }
    };
  }

  return elShape("photo_placeholder", x, y, width, height, { fill: "#e8dccb", radius }, zIndex, isTemplate);
}

function textElement(name, content, x, y, width, height, fontSize, color, fontWeight, zIndex, isTemplate = false, fill = null, radius = 0) {
  return {
    id: uid("el"),
    type: "text",
    name,
    content,
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex,
    template: isTemplate,
      locked: false,
      style: {
        color,
        fontSize,
        fontWeight,
        fontKey: "ui",
        fontFamily: FONTS.ui,
        align: "left",
        fill,
        radius,
      padding: fill ? 20 : 0
    }
  };
}

function brandMark(brand, slide, x, y, width, dark) {
  return textElement(
    "brand_mark",
    `${brand.brandName} / ${String(slide.slideIndex).padStart(2, "0")}`,
    x,
    y,
    width,
    44,
    23,
    dark ? "#caa96d" : "#8f7044",
    800,
    6,
    true
  );
}

function styledText(name, content, x, y, width, height, fontSize, color, fontWeight, zIndex, isTemplate, fill, radius, extra = {}) {
  const element = textElement(name, content, x, y, width, height, fontSize, color, fontWeight, zIndex, isTemplate, fill, radius);
  element.style = { ...element.style, ...extra };
  element.style.fontKey = extra.fontKey || fontKeyFor(element.style.fontFamily);
  element.style.fontFamily = fontFamilyFor(element.style.fontKey);
  return element;
}

function rotatedPhoto(content, x, y, width, height, radius, zIndex, rotation) {
  const element = photoElement(content, x, y, width, height, radius, zIndex, true);
  element.rotation = rotation;
  element.style = {
    ...element.style,
    boxShadow: "0 18px 38px rgba(48,34,20,0.24)",
    border: "10px solid #fffaf0"
  };
  return element;
}

function addTornEdge(elements, x, y, width, fill, zIndex, edge) {
  const sizes = [34, 52, 28, 44, 36, 58, 32, 46, 38, 54, 30, 42, 36, 50, 28, 40];
  const step = width / sizes.length;
  sizes.forEach((size, index) => {
    const cx = x + index * step + step * 0.45;
    const cy = edge === "top" ? y - size * 0.48 : y - size * 0.52;
    elements.push(elShape(`torn_${edge}_${index}`, cx - size / 2, cy, size, size, { fill, radius: 999 }, zIndex, true));
  });
}

function addPaperTexture(elements, x, y, width, height, zIndex) {
  const dots = [
    [0.12, 0.08], [0.28, 0.16], [0.46, 0.06], [0.62, 0.21], [0.8, 0.12],
    [0.18, 0.38], [0.36, 0.31], [0.54, 0.42], [0.74, 0.33], [0.9, 0.45],
    [0.1, 0.68], [0.32, 0.74], [0.58, 0.63], [0.78, 0.82], [0.92, 0.7]
  ];
  dots.forEach(([dx, dy], index) => {
    const size = index % 3 === 0 ? 8 : 5;
    elements.push(elShape(`paper_grain_${index}`, x + width * dx, y + height * dy, size, size, {
      fill: "rgba(96,72,44,0.08)",
      radius: 999
    }, zIndex, true));
  });
}

function addFigmaGrid(elements, color) {
  for (let x = 0; x <= CANVAS.width; x += 80) {
    elements.push(elShape(`figma_grid_v_${x}`, x, 0, 2, CANVAS.height, { fill: color }, 1, true));
  }
  for (let y = 0; y <= CANVAS.height; y += 80) {
    elements.push(elShape(`figma_grid_h_${y}`, 0, y, CANVAS.width, 2, { fill: color }, 1, true));
  }
}

function buttonChip(content, x, y, width, fill, color, zIndex) {
  return styledText("keyword_badge", content, x, y, width, 74, 31, color, 900, zIndex, true, fill, 999, {
    align: "center",
    fontFamily: FONTS.round,
    padding: 12,
    valign: "center"
  });
}

function render() {
  syncForm();
  renderAssets();
  renderCanvasGrid();
  renderInspector();
  persist();
  runFocusTarget();
}

function syncForm() {
  dom.brandName.value = state.brand.name;
  dom.brandHandle.value = state.brand.handle;
  dom.slideCount.value = String(state.project.slideCount);
  dom.templateSetSelect.value = state.project.templateSet || "viral";
  dom.projectTitle.textContent = state.project.title;

  const slide = getSlide();
  if (slide) {
    dom.activeSlideLabel.textContent = `${slide.slideIndex}번 카드 편집 중`;
    dom.headlineInput.value = slide.headline;
    dom.bodyInput.value = slide.body;
    dom.lockTemplateBtn.textContent = slide.lockTemplate ? "템플릿 고정 해제" : "템플릿 고정";
    dom.lockTemplateBtn.classList.toggle("locked", slide.lockTemplate);
  }
}

function renderAssets() {
  dom.assetGrid.innerHTML = "";
  state.assets.forEach((asset) => {
    const button = document.createElement("button");
    button.className = "asset-tile";
    button.title = "선택 카드에 이미지 적용";
    button.innerHTML = `<img alt="${escapeHtml(asset.name)}" src="${asset.dataUrl}" />`;
    button.addEventListener("click", () => applyAssetToSlide(asset, state.activeSlideId));
    dom.assetGrid.appendChild(button);
  });
}

function renderCanvasGrid() {
  dom.canvasGrid.innerHTML = "";
  state.slides.forEach((slide) => {
    const card = document.createElement("article");
    card.className = `slide-card${slide.id === state.activeSlideId ? " active" : ""}`;

    card.innerHTML = `
      <div class="slide-toolbar">
        <span class="slide-number">${slide.slideIndex}</span>
        <div>
          <strong>${escapeHtml(slide.headline)}</strong>
          <span>${escapeHtml(templateName(slide.templateId))} · ${escapeHtml(slide.visualDirection || slide.role)}</span>
        </div>
        <div class="template-row">
          <button class="mini-lock${slide.lockTemplate ? " locked" : ""}" data-action="lock" data-slide-id="${slide.id}">
            ${slide.lockTemplate ? "고정됨" : "고정"}
          </button>
          <button data-action="restore" data-slide-id="${slide.id}">기본값</button>
        </div>
      </div>
      <div class="card-canvas" data-slide-id="${slide.id}" data-testid="card-canvas-${slide.slideIndex}"></div>
    `;

    const canvas = card.querySelector(".card-canvas");
    canvas.style.background = slide.backgroundColor;
    canvas.addEventListener("pointerdown", () => selectSlide(slide.id, "headline"));
    renderCanvasElements(canvas, slide);

    card.querySelector('[data-action="lock"]').addEventListener("click", () => {
      toggleTemplateLock(slide.id);
    });
    card.querySelector('[data-action="restore"]').addEventListener("click", () => {
      restoreSlideDefaults(slide.id);
    });

    dom.canvasGrid.appendChild(card);
  });
}

function renderCanvasElements(canvas, slide) {
  slide.elements
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach((element) => {
      const node = document.createElement("div");
      const locked = isElementLocked(slide, element);
      node.className = `canvas-element ${element.type}${element.id === state.selectedElementId ? " selected" : ""}${locked ? " locked" : ""}`;
      node.dataset.id = element.id;
      Object.assign(node.style, scaledBox(element));

      if (element.type === "text") {
        node.textContent = element.content;
        node.style.color = element.style.color;
        node.style.fontSize = `${element.style.fontSize * SCALE}px`;
        node.style.fontWeight = element.style.fontWeight;
        node.style.fontFamily = element.style.fontFamily || "Arial, sans-serif";
        node.style.textAlign = element.style.align || "left";
        node.style.justifyContent = element.style.align === "center" ? "center" : "flex-start";
        node.style.alignItems = element.style.valign === "top" ? "flex-start" : "center";
        node.style.background = element.style.fill || "transparent";
        node.style.borderRadius = `${(element.style.radius || 0) * SCALE}px`;
        node.style.padding = `${(element.style.padding || 0) * SCALE}px`;
        node.style.textShadow = element.style.textShadow || "none";
        node.style.boxShadow = element.style.boxShadow || "none";
      }

      if (element.type === "image") {
        node.style.borderRadius = `${(element.style.radius || 0) * SCALE}px`;
        node.style.boxShadow = element.style.boxShadow || "none";
        node.style.border = element.style.border ? `${parseFloat(element.style.border) * SCALE}px solid #fffaf0` : "0";
        node.innerHTML = `<img alt="" src="${element.content}" />`;
      }

      if (element.type === "shape") {
        node.style.background = element.style.fill || "transparent";
        node.style.borderRadius = `${(element.style.radius || 0) * SCALE}px`;
        node.style.boxShadow = element.style.boxShadow || "none";
        node.style.border = element.style.border ? `${Number.parseFloat(element.style.border) * SCALE}px solid #fffaf0` : "0";
      }

      node.addEventListener("pointerdown", (event) => beginDrag(event, slide.id, element.id, "move"));

      if (element.id === state.selectedElementId && !locked) {
        const handle = document.createElement("span");
        handle.className = "resize-handle";
        handle.addEventListener("pointerdown", (event) => beginDrag(event, slide.id, element.id, "resize"));
        node.appendChild(handle);
      }

      canvas.appendChild(node);
    });
}

function renderInspector() {
  const slide = getSlide();
  renderTextList(slide);

  const element = selectedElement();
  const locked = element ? isElementLocked(slide, element) : false;
  const disabled = !element || locked;
  dom.selectedHint.textContent = element
    ? locked
      ? `${displayElementName(element)} / 템플릿 고정 중`
      : `${displayElementName(element)} / ${element.type}`
    : "카드 안의 문구나 사진을 선택하세요.";

  [dom.elementContent, dom.elementX, dom.elementY, dom.elementW, dom.elementH, dom.elementColor, dom.deleteElementBtn].forEach((node) => {
    node.disabled = disabled;
  });
  dom.fontFamily.disabled = disabled || element?.type !== "text";
  dom.fontSize.disabled = disabled || element?.type !== "text";

  if (!element) {
    dom.elementContent.value = "";
    dom.elementX.value = "";
    dom.elementY.value = "";
    dom.elementW.value = "";
    dom.elementH.value = "";
    dom.fontFamily.value = "ui";
    dom.fontSize.value = "";
    dom.elementColor.value = "#211c17";
    return;
  }

  dom.elementContent.value = element.content || "";
  dom.elementX.value = Math.round(element.x);
  dom.elementY.value = Math.round(element.y);
  dom.elementW.value = Math.round(element.width);
  dom.elementH.value = Math.round(element.height);
  dom.fontFamily.value = element.type === "text" ? element.style.fontKey || fontKeyFor(element.style.fontFamily) : "ui";
  dom.fontSize.value = element.style.fontSize || "";
  dom.elementColor.value = element.style.color || element.style.fill || "#211c17";
}

function renderTextList(slide) {
  dom.textElementList.innerHTML = "";
  slide.elements
    .filter((element) => element.type === "text")
    .sort((a, b) => a.y - b.y)
    .forEach((element) => {
      const label = document.createElement("label");
      label.className = "text-editor-row";
      label.innerHTML = `
        <span>${displayElementName(element)}</span>
        <textarea rows="2" data-text-id="${element.id}">${escapeHtml(element.content || "")}</textarea>
      `;

      const input = label.querySelector("textarea");
      input.disabled = isElementLocked(slide, element);
      input.addEventListener("focus", () => {
        state.selectedElementId = element.id;
        dom.selectedHint.textContent = `${displayElementName(element)} / ${element.type}`;
        dom.elementContent.value = element.content || "";
        dom.elementX.value = Math.round(element.x);
        dom.elementY.value = Math.round(element.y);
        dom.elementW.value = Math.round(element.width);
        dom.elementH.value = Math.round(element.height);
        dom.fontFamily.value = element.style.fontKey || fontKeyFor(element.style.fontFamily);
        dom.fontSize.value = element.style.fontSize || "";
        dom.elementColor.value = element.style.color || element.style.fill || "#211c17";
        renderCanvasGrid();
        persist();
      });
      input.addEventListener("input", () => {
        updateTextElementContent(slide, element, input.value);
      });
      dom.textElementList.appendChild(label);
    });
}

function displayElementName(element) {
  const names = {
    headline: "헤드라인",
    body: "본문",
    brand_mark: "브랜드 표기",
    note_badge: "노트 라벨",
    detail_label: "확인 라벨",
    paper_label: "상단 라벨",
    keyword_badge: "강조 키워드",
    comment_prompt: "DM 유도 문구",
    subtitle_bar: "자막 바",
    mockup_header: "계정 헤더",
    product_photo: "제품 사진",
    photo_placeholder: "사진 자리"
  };
  return names[element.name] || element.name.replaceAll("_", " ");
}

function scaledBox(element) {
  return {
    left: `${element.x * SCALE}px`,
    top: `${element.y * SCALE}px`,
    width: `${element.width * SCALE}px`,
    height: `${element.height * SCALE}px`,
    zIndex: String(element.zIndex),
    transform: `rotate(${element.rotation || 0}deg)`
  };
}

function isElementLocked(slide, element) {
  return element.locked || (slide.lockTemplate && element.template);
}

function selectSlide(slideId, focus = null) {
  state.activeSlideId = slideId;
  state.selectedElementId = null;
  focusTarget = focus ? { type: focus } : null;
  render();
}

function beginDrag(event, slideId, elementId, mode) {
  event.stopPropagation();
  const slide = getSlide(slideId);
  const element = slide.elements.find((item) => item.id === elementId);
  if (!element) return;

  state.activeSlideId = slideId;
  state.selectedElementId = elementId;

  if (element.type === "text") {
    focusTarget = { type: "elementContent" };
  } else {
    focusTarget = { type: "headline" };
  }

  if (isElementLocked(slide, element)) {
    render();
    return;
  }

  dragSession = {
    mode,
    slideId,
    elementId,
    startX: event.clientX,
    startY: event.clientY,
    origin: { x: element.x, y: element.y, width: element.width, height: element.height }
  };

  event.currentTarget.setPointerCapture(event.pointerId);
  render();
}

function updateDrag(event) {
  if (!dragSession) return;
  const slide = getSlide(dragSession.slideId);
  const element = slide.elements.find((item) => item.id === dragSession.elementId);
  if (!element || isElementLocked(slide, element)) return;

  const dx = (event.clientX - dragSession.startX) / SCALE;
  const dy = (event.clientY - dragSession.startY) / SCALE;

  if (dragSession.mode === "move") {
    element.x = clamp(dragSession.origin.x + dx, -element.width + 40, CANVAS.width - 40);
    element.y = clamp(dragSession.origin.y + dy, -element.height + 40, CANVAS.height - 40);
  } else {
    element.width = clamp(dragSession.origin.width + dx, 60, CANVAS.width);
    element.height = clamp(dragSession.origin.height + dy, 40, CANVAS.height);
  }

  renderCanvasGrid();
  renderInspector();
  persist();
}

function endDrag() {
  dragSession = null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateBrandFromForm() {
  state.brand.name = dom.brandName.value.trim() || "Maison Select";
  state.brand.handle = dom.brandHandle.value.trim() || "@maison.select";
  state.project.title = `${state.brand.name} 캐러셀`;
  updateBrandMarks();
  render();
}

function updateBrandMarks() {
  state.slides.forEach((slide) => {
    const mark = slide.elements.find((element) => element.name === "brand_mark");
    if (mark) mark.content = `${state.brand.name} / ${String(slide.slideIndex).padStart(2, "0")}`;
    if (slide.role === "cta") {
      slide.body = `${state.brand.name} ${state.brand.handle}\n상세 사진과 가격은 DM으로 안내드립니다.`;
      const body = slide.elements.find((element) => element.name === "body");
      if (body) body.content = slide.body;
    }
  });
}

function updateSlideCountFromForm() {
  state.project.slideCount = clamp(Number(dom.slideCount.value || 4), 3, 6);
  generateSlides();
}

function generateSlides() {
  const firstImage = state.assets[0] || null;
  state.slides = buildSlides({
    brandName: state.brand.name,
    brandHandle: state.brand.handle,
    count: state.project.slideCount,
    templateSet: state.project.templateSet || "viral",
    image: firstImage
  });
  state.activeSlideId = state.slides[0].id;
  state.selectedElementId = null;
  render();
}

function updateTemplateSetFromForm() {
  applyTemplateSet(dom.templateSetSelect.value || "viral");
}

function applyTemplateSet(templateSetId) {
  state.project.templateSet = templateSets[templateSetId] ? templateSetId : "viral";
  const sequence = templateSequenceFor(state.project.templateSet);
  const copyFactory = state.project.templateSet === "figma" ? figmaButtonCopies : defaultCopies;
  const copies = copyFactory({
    brandName: state.brand.name,
    brandHandle: state.brand.handle,
    count: state.project.slideCount
  });
  state.slides.forEach((slide, index) => {
    const image = slide.elements.find((element) => element.type === "image");
    const copy = copies[index] || copies[0];
    slide.role = copy.role;
    slide.headline = copy.headline;
    slide.body = copy.body;
    slide.visualDirection = copy.visual;
    slide.templateId = sequence[index % sequence.length];
    applyTemplate(slide, image ? { content: image.content } : null, {
      brandName: state.brand.name,
      brandHandle: state.brand.handle
    });
  });
  state.selectedElementId = null;
  render();
}

function restoreSlideDefaults(slideId = state.activeSlideId) {
  const oldSlide = getSlide(slideId);
  const image = oldSlide.elements.find((element) => element.type === "image");
  const copyFactory = state.project.templateSet === "figma" ? figmaButtonCopies : defaultCopies;
  const copies = copyFactory({
    brandName: state.brand.name,
    brandHandle: state.brand.handle,
    count: state.project.slideCount
  });
  const copy = copies[oldSlide.slideIndex - 1] || copies[0];

  oldSlide.role = copy.role;
  oldSlide.headline = copy.headline;
  oldSlide.body = copy.body;
  oldSlide.visualDirection = copy.visual;
  applyTemplate(oldSlide, image ? { content: image.content } : null, {
    brandName: state.brand.name,
    brandHandle: state.brand.handle
  });

  state.activeSlideId = slideId;
  state.selectedElementId = null;
  render();
}

function applyAssetToSlide(asset, slideId) {
  const slide = getSlide(slideId);
  const imageElements = slide.elements.filter((element) => element.name === "product_photo" || element.name === "photo_placeholder");
  if (!imageElements.length) return;
  imageElements.forEach((imageElement) => {
    imageElement.type = "image";
    imageElement.name = "product_photo";
    imageElement.content = asset.dataUrl;
    imageElement.style = { ...imageElement.style, radius: imageElement.style.radius || 10 };
    imageElement.locked = false;
  });
  render();
}

async function handleUpload(event) {
  const files = Array.from(event.target.files || []);
  for (const file of files) {
    const dataUrl = await readFileAsDataUrl(file);
    state.assets.push({
      id: uid("asset"),
      kind: "image",
      name: file.name,
      mimeType: file.type,
      dataUrl,
      createdAt: new Date().toISOString()
    });
  }
  if (files.length) applyAssetToSlide(state.assets[state.assets.length - files.length], state.activeSlideId);
  render();
  event.target.value = "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateSlideText() {
  const slide = getSlide();
  slide.headline = dom.headlineInput.value;
  slide.body = dom.bodyInput.value;
  const headline = slide.elements.find((element) => element.name === "headline");
  const body = slide.elements.find((element) => element.name === "body");
  if (headline) headline.content = slide.headline;
  if (body) body.content = slide.body;
  render();
}

function updateTextElementContent(slide, element, value) {
  if (isElementLocked(slide, element)) return;
  element.content = value;
  if (element.name === "headline") {
    slide.headline = value;
    dom.headlineInput.value = value;
  }
  if (element.name === "body") {
    slide.body = value;
    dom.bodyInput.value = value;
  }
  if (element.name === "brand_mark") {
    state.brand.name = value.split("/")[0]?.trim() || state.brand.name;
  }
  state.selectedElementId = element.id;
  renderCanvasGrid();
  persist();
}

function changeSlideTemplate(slideId, templateId) {
  const slide = getSlide(slideId);
  const image = slide.elements.find((element) => element.type === "image");
  slide.templateId = templateId;
  applyTemplate(slide, image ? { content: image.content } : null, {
    brandName: state.brand.name,
    brandHandle: state.brand.handle
  });
  state.activeSlideId = slideId;
  state.selectedElementId = null;
  render();
}

function toggleTemplateLock(slideId = state.activeSlideId) {
  const slide = getSlide(slideId);
  slide.lockTemplate = !slide.lockTemplate;
  state.activeSlideId = slideId;
  if (selectedElement() && isElementLocked(slide, selectedElement())) state.selectedElementId = null;
  render();
}

function updateElementFromInspector() {
  const element = selectedElement();
  const slide = getSlide();
  if (!element || isElementLocked(slide, element)) return;

  element.content = dom.elementContent.value;
  element.x = Number(dom.elementX.value || 0);
  element.y = Number(dom.elementY.value || 0);
  element.width = Number(dom.elementW.value || 60);
  element.height = Number(dom.elementH.value || 40);
  if (element.type === "text") {
    element.style.fontKey = dom.fontFamily.value || "ui";
    element.style.fontFamily = fontFamilyFor(element.style.fontKey);
    element.style.fontSize = Number(dom.fontSize.value || element.style.fontSize || 28);
    element.style.color = dom.elementColor.value;
    if (element.name === "headline") slide.headline = element.content;
    if (element.name === "body") slide.body = element.content;
  } else if (element.type === "shape") {
    element.style.fill = dom.elementColor.value;
  }
  render();
}

function deleteElement() {
  const slide = getSlide();
  const element = selectedElement();
  if (!element || isElementLocked(slide, element)) return;
  slide.elements = slide.elements.filter((item) => item.id !== element.id);
  state.selectedElementId = null;
  render();
}

async function exportSlide(slide) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS.width;
  canvas.height = CANVAS.height;
  const ctx = canvas.getContext("2d");

  for (const element of slide.elements.slice().sort((a, b) => a.zIndex - b.zIndex)) {
    ctx.save();
    if (element.rotation) {
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));
    }

    if (element.type === "shape") {
      drawRoundedRect(ctx, element.x, element.y, element.width, element.height, element.style.radius || 0, element.style.fill || "transparent");
    }

    if (element.type === "image") {
      await drawImageCover(ctx, element);
    }

    if (element.type === "text") {
      if (element.style.fill) {
        drawRoundedRect(ctx, element.x, element.y, element.width, element.height, element.style.radius || 0, element.style.fill);
      }
      drawTextBox(ctx, element);
    }

    ctx.restore();
  }

  return new Promise((resolve) => {
    canvas.toBlob((pngBlob) => resolve(pngBlob), "image/png");
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

async function drawImageCover(ctx, element) {
  const img = await loadImage(element.content);
  const sourceRatio = img.width / img.height;
  const targetRatio = element.width / element.height;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.save();
  const borderWidth = Number.parseFloat(element.style.border || "0") || 0;
  if (borderWidth) {
    drawRoundedRect(
      ctx,
      element.x - borderWidth,
      element.y - borderWidth,
      element.width + borderWidth * 2,
      element.height + borderWidth * 2,
      (element.style.radius || 0) + borderWidth,
      "#fffaf0"
    );
  }
  roundedClip(ctx, element.x, element.y, element.width, element.height, element.style.radius || 0);
  ctx.drawImage(img, sx, sy, sw, sh, element.x, element.y, element.width, element.height);
  ctx.restore();
}

function roundedClip(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.clip();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawTextBox(ctx, element) {
  const padding = element.style.padding || 0;
  const fontSize = element.style.fontSize || 32;
  const lineHeight = fontSize * 1.18;
  const maxWidth = Math.max(10, element.width - padding * 2);
  const lines = wrapText(ctx, element.content || "", maxWidth, element.style.fontWeight || 400, fontSize, element.style.fontFamily || FONTS.ui);
  const maxLines = Math.max(1, Math.floor((element.height - padding * 2) / lineHeight));
  const drawLines = lines.slice(0, maxLines);

  ctx.fillStyle = element.style.color || "#211c17";
  ctx.font = `${element.style.fontWeight || 400} ${fontSize}px ${element.style.fontFamily || "Arial, sans-serif"}`;
  ctx.textBaseline = "top";
  ctx.textAlign = element.style.align === "center" ? "center" : "left";

  const x = element.style.align === "center" ? element.x + element.width / 2 : element.x + padding;
  let y = element.y + padding;
  if (element.style.valign === "center") {
    y = element.y + (element.height - drawLines.length * lineHeight) / 2;
  }
  drawLines.forEach((line) => {
    ctx.fillText(line, x, y);
    y += lineHeight;
  });
}

function wrapText(ctx, text, maxWidth, fontWeight, fontSize, fontFamily = FONTS.ui) {
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const lines = [];
  String(text)
    .split("\n")
    .forEach((paragraph) => {
      const chars = Array.from(paragraph);
      let line = "";
      chars.forEach((char) => {
        const test = line + char;
        if (line && ctx.measureText(test).width > maxWidth) {
          lines.push(line);
          line = char.trimStart();
        } else {
          line = test;
        }
      });
      lines.push(line);
    });
  return lines;
}

async function downloadSlide(slide) {
  const blob = await exportSlide(slide);
  const link = document.createElement("a");
  link.download = `${state.brand.name.replace(/[\\/:*?"<>|]/g, "_")}-${slide.slideIndex}.png`;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function downloadAll() {
  for (const slide of state.slides) {
    await downloadSlide(slide);
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
}

function runFocusTarget() {
  if (!focusTarget) return;
  const target = focusTarget;
  focusTarget = null;

  const applyFocus = () => {
    if (target.type === "headline") {
      dom.headlineInput.focus();
      dom.headlineInput.select();
    }
    if (target.type === "elementContent") {
      dom.elementContent.focus();
      dom.elementContent.select();
    }
    if (target.type === "textList") {
      const input = dom.textElementList.querySelector(`[data-text-id="${target.id}"]`);
      input?.focus();
      input?.select();
    }
  };

  applyFocus();
  requestAnimationFrame(applyFocus);
}

function bindEvents() {
  dom.brandName.addEventListener("input", updateBrandFromForm);
  dom.brandHandle.addEventListener("input", updateBrandFromForm);
  dom.slideCount.addEventListener("change", updateSlideCountFromForm);
  dom.templateSetSelect.addEventListener("change", updateTemplateSetFromForm);
  dom.imageUpload.addEventListener("change", handleUpload);
  dom.generateBtn.addEventListener("click", generateSlides);
  dom.exportCurrentBtn.addEventListener("click", () => downloadSlide(getSlide()));
  dom.exportAllBtn.addEventListener("click", downloadAll);
  dom.headlineInput.addEventListener("input", updateSlideText);
  dom.bodyInput.addEventListener("input", updateSlideText);
  dom.lockTemplateBtn.addEventListener("click", () => toggleTemplateLock());
  dom.restoreTemplateBtn.addEventListener("click", () => restoreSlideDefaults());
  [dom.elementContent, dom.elementX, dom.elementY, dom.elementW, dom.elementH, dom.fontFamily, dom.fontSize, dom.elementColor].forEach((node) => {
    node.addEventListener("input", updateElementFromInspector);
  });
  dom.fontFamily.addEventListener("change", updateElementFromInspector);
  dom.deleteElementBtn.addEventListener("click", deleteElement);
  window.addEventListener("pointermove", updateDrag);
  window.addEventListener("pointerup", endDrag);
}

bindEvents();
render();
