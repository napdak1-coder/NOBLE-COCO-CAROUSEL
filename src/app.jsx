const { useContext, useEffect, useMemo, useRef, useState } = React;

const CANVAS = { width: 1080, height: 1350 };
const MAX_SLIDES = 6;
const MAX_UPLOAD_IMAGE_EDGE = 1920;
const UPLOAD_JPEG_QUALITY = 0.84;
const PHOTO_SIZE_STEPS = [10, 20, 30, 40, 50];
const TEXT_ALIGN_OPTIONS = [
  ["left", "왼쪽"],
  ["center", "가운데"],
  ["right", "오른쪽"]
];
const samplePhotos = [
  "./src/assets/optimized/noblecoco-store-01-fast.jpg",
  "./src/assets/optimized/noblecoco-store-02-fast.jpg",
  "./src/assets/optimized/noblecoco-store-03-fast.jpg",
  "./src/assets/optimized/noblecoco-store-04-fast.jpg"
];

const defaultLayer = {
  coverBrand: { x: 50, y: 8.4, size: 23, color: "#f8f5ef" },
  subtitle: { x: 50, y: 42.8, size: 32, color: "#f8f5ef" },
  title: { x: 50, y: 48.2, size: 54, color: "#f8f5ef" },
  englishTitle: { x: 8.4, y: 72.6, size: 82, color: "#ffffff" },
  script: { x: 53, y: 69.8, size: 185, color: "#ffd9bd" },
  url: { x: 50, y: 95.3, size: 23, color: "#f8f5ef" },
  tipLabel: { x: 50, y: 11, size: 136, color: "#ffd9bd" },
  inset: { x: 50, y: 23.2, width: 56, height: 36 },
  bullets: { x: 12.6, y: 63.2, size: 31, color: "#f8f5ef" }
};

const COPY_PREFIX = "copy:";

const layerCatalog = {
  coverBrand: { label: "브랜드", kind: "text", field: "brand", className: "cover-brand centered" },
  subtitle: { label: "서브카피", kind: "text", field: "subtitle", className: "korean-subtitle centered" },
  title: { label: "한글 제목", kind: "text", field: "title", className: "korean-title centered" },
  englishTitle: { label: "영문 타이틀", kind: "text", field: "englishTitle", className: "english-title" },
  script: { label: "손글씨 포인트", kind: "text", field: "scriptText", className: "script-text" },
  url: { label: "URL", kind: "text", field: "url", className: "url-text centered" },
  tipLabel: { label: "Tip 라벨", kind: "text", field: "tipLabel", className: "script-text centered" },
  inset: { label: "삽입 사진", kind: "photo", imageField: "insetImage" },
  bullets: { label: "본문 bullet", kind: "bullets" }
};

const baseLayerKeysByType = {
  cover: ["coverBrand", "subtitle", "title", "englishTitle", "script", "url"],
  tip: ["tipLabel", "inset", "bullets", "url"]
};

const LayerControlsContext = React.createContext(null);

function copyLayerKey(id) {
  return `${COPY_PREFIX}${id}`;
}

function isCopyLayerKey(layerKey) {
  return String(layerKey).startsWith(COPY_PREFIX);
}

function copyIdFromLayerKey(layerKey) {
  return String(layerKey).slice(COPY_PREFIX.length);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function clampPhotoWidth(value) {
  return Math.max(18, Math.min(88, value));
}

function clampPhotoHeight(value) {
  return Math.max(12, Math.min(62, value));
}

function createLayers(overrides = {}) {
  const layers = structuredClone(defaultLayer);
  Object.entries(overrides).forEach(([key, value]) => {
    layers[key] = { ...layers[key], ...value };
  });
  return layers;
}

function getDefaultTextAlign(layerKey, layerMeta = {}) {
  const key = isCopyLayerKey(layerKey) ? layerMeta.sourceKey : layerKey;
  if (["coverBrand", "subtitle", "title", "url", "tipLabel"].includes(key)) return "center";
  return "left";
}

function makeNobleCocoSeedSlides() {
  return [
    {
      id: crypto.randomUUID(),
      type: "cover",
      name: "매장 소개",
      brand: "NOBLE COCO APGUJEONG",
      title: "압구정에 이런 편집샵 있었어?",
      subtitle: "스톤 아일랜드 보러 온다면",
      englishTitle: "APGUJEONG",
      scriptText: "Noble Coco",
      url: "@NOBLECOCO",
      overlay: 0.52,
      grain: true,
      bgImage: samplePhotos[1],
      bgPosition: "center 58%",
      insetImage: samplePhotos[0],
      layers: createLayers({
        coverBrand: { y: 8.2, size: 24 },
        subtitle: { y: 38.8, size: 36 },
        title: { y: 46.2, size: 56 },
        englishTitle: { x: 7.4, y: 74.4, size: 62 },
        script: { x: 58, y: 75.2, size: 110 },
        url: { y: 95.3, size: 22 }
      })
    },
    {
      id: crypto.randomUUID(),
      type: "tip",
      name: "스톤 아일랜드 입고",
      tipLabel: "Stone",
      bullets: [
        "압구정에서 스톤 아일랜드 찾는다면, 노블코코에서 먼저 확인해보세요.",
        "아우터, 니트, 팬츠까지 실제로 보고 비교하기 좋게 정리해뒀습니다.",
        "사진으로 애매했던 컬러감과 소재는 매장에서 보는 게 훨씬 정확해요."
      ],
      url: "@NOBLECOCO",
      overlay: 0.48,
      grain: true,
      bgImage: samplePhotos[3],
      bgPosition: "center 50%",
      insetImage: samplePhotos[0],
      layers: createLayers({
        tipLabel: { y: 11.2, size: 126 },
        inset: { x: 50, y: 23.8, width: 64, height: 35 },
        bullets: { x: 11.4, y: 63.4, size: 29 },
        url: { y: 95.2, size: 22 }
      })
    },
    {
      id: crypto.randomUUID(),
      type: "tip",
      name: "매장 탐색",
      tipLabel: "Shop",
      bullets: [
        "압구정 로데오 근처, 조용히 둘러보기 좋은 프리미엄 편집샵입니다.",
        "의류, 슈즈, 가방까지 한 동선에서 자연스럽게 맞춰볼 수 있어요.",
        "부담 없이 둘러보다가 마음에 드는 제품만 편하게 물어보시면 됩니다."
      ],
      url: "@NOBLECOCO",
      overlay: 0.5,
      grain: true,
      bgImage: samplePhotos[2],
      bgPosition: "center 50%",
      insetImage: samplePhotos[3],
      layers: createLayers({
        tipLabel: { y: 11.2, size: 126 },
        inset: { x: 50, y: 23.8, width: 64, height: 35 },
        bullets: { x: 11.4, y: 63.2, size: 28 },
        url: { y: 95.2, size: 22 }
      })
    },
    {
      id: crypto.randomUUID(),
      type: "tip",
      name: "방문 안내",
      tipLabel: "Visit",
      bullets: [
        "압구정 편집샵 찾고 있었다면 이 카드 저장해두세요.",
        "스톤 아일랜드 입고 문의는 DM으로 편하게 보내주시면 됩니다.",
        "댓글에 ‘위치’ 남겨주시면 방문 전 확인 포인트를 알려드릴게요."
      ],
      url: "@NOBLECOCO",
      overlay: 0.48,
      grain: true,
      bgImage: samplePhotos[0],
      bgPosition: "center 52%",
      insetImage: samplePhotos[1],
      layers: createLayers({
        tipLabel: { y: 11.2, size: 126 },
        inset: { x: 50, y: 23.8, width: 64, height: 35 },
        bullets: { x: 11.4, y: 63.4, size: 29 },
        url: { y: 95.2, size: 22 }
      })
    }
  ];
}

const seedSlides = makeNobleCocoSeedSlides();

const legacySeedSlides = [
  {
    id: crypto.randomUUID(),
    type: "cover",
    name: "표지",
    brand: "@REALLYGREATSITE",
    title: "여름 스타일링 A TO Z",
    subtitle: "옷장 속 잠자던 패셔니스타 깨우기!",
    englishTitle: "SUMMER",
    scriptText: "Styling",
    url: "WWW.REALLYGREATSITE.COM",
    overlay: 0.46,
    grain: true,
    bgImage: samplePhotos[0],
    insetImage: samplePhotos[1],
    layers: structuredClone(defaultLayer)
  },
  {
    id: crypto.randomUUID(),
    type: "tip",
    name: "Tip 1",
    tipLabel: "Tip 1",
    bullets: [
      "여름엔 린넨, 코튼, 시어서커, 레이온 등 통기성 좋은 소재를 선택하세요.",
      "시원하고 쾌적한 착용감은 물론, 자연스러운 멋까지 더해줍니다.",
      "소재 하나로 여름 스타일 지수를 UP! 시켜보세요."
    ],
    url: "WWW.REALLYGREATSITE.COM",
    overlay: 0.5,
    grain: true,
    bgImage: samplePhotos[1],
    insetImage: samplePhotos[2],
    layers: structuredClone(defaultLayer)
  },
  {
    id: crypto.randomUUID(),
    type: "tip",
    name: "Tip 2",
    tipLabel: "Tip 2",
    bullets: [
      "파스텔, 비비드, 뉴트럴 톤 등 다양한 여름 컬러로 룩에 생기를 더하세요.",
      "칙칙함은 벗어던지고, 컬러풀한 아이템으로 나만의 개성을 표현해 보세요.",
      "컬러 조합만으로도 여름 무드를 완벽하게 연출할 수 있습니다."
    ],
    url: "WWW.REALLYGREATSITE.COM",
    overlay: 0.5,
    grain: true,
    bgImage: samplePhotos[2],
    insetImage: samplePhotos[3],
    layers: structuredClone(defaultLayer)
  },
  {
    id: crypto.randomUUID(),
    type: "tip",
    name: "Tip 3",
    tipLabel: "Tip 3",
    bullets: [
      "선글라스, 모자, 가벼운 가방, 오픈 슈즈 등 여름 액세서리는 필수!",
      "작은 소품 하나로 전체적인 룩에 포인트를 더하고 스타일을 완성하세요.",
      "액세서리는 당신의 여름 스타일을 한층 더 빛내줄 마법 같은 아이템입니다."
    ],
    url: "WWW.REALLYGREATSITE.COM",
    overlay: 0.5,
    grain: true,
    bgImage: samplePhotos[3],
    insetImage: samplePhotos[0],
    layers: structuredClone(defaultLayer)
  }
];

function makeInitialSlideMap() {
  return Object.fromEntries(seedSlides.map((slide) => [slide.id, structuredClone(slide)]));
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readOptimizedImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const scale = Math.min(1, MAX_UPLOAD_IMAGE_EDGE / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d", { alpha: false });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", UPLOAD_JPEG_QUALITY));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 불러오지 못했습니다."));
    };
    image.src = objectUrl;
  });
}

async function readImageFiles(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  return Promise.all(
    files.map((file) =>
      readOptimizedImage(file).catch(() => readFile(file))
    )
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function useEditableTextSync(value) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || document.activeElement === node) return;
    const nextValue = value ?? "";
    if (node.textContent !== nextValue) {
      node.textContent = nextValue;
    }
  }, [value]);

  return ref;
}

function App() {
  const [slides, setSlides] = useState(seedSlides);
  const [activeId, setActiveId] = useState(seedSlides[0].id);
  const [activeLayer, setActiveLayer] = useState("title");
  const [applyPhotoScaleToAll, setApplyPhotoScaleToAll] = useState(false);
  const slideRefs = useRef({});
  const initialSlidesRef = useRef(null);

  if (!initialSlidesRef.current) {
    initialSlidesRef.current = makeInitialSlideMap();
  }

  const activeSlide = useMemo(
    () => slides.find((slide) => slide.id === activeId) || slides[0],
    [slides, activeId]
  );

  const setActiveSlide = (updater) => {
    setSlides((current) =>
      current.map((slide) => (slide.id === activeSlide.id ? updater(slide) : slide))
    );
  };

  const updateSlide = (patch) => {
    setActiveSlide((slide) => ({ ...slide, ...patch }));
  };

  const updateSlideById = (slideId, patch) => {
    setSlides((current) =>
      current.map((slide) => (slide.id === slideId ? { ...slide, ...patch } : slide))
    );
  };

  const getLayerCopy = (slide, layerKey) => {
    if (!isCopyLayerKey(layerKey)) return null;
    return (slide.layerCopies || []).find((copy) => copy.id === copyIdFromLayerKey(layerKey)) || null;
  };

  const getLayerState = (slide, layerKey) => {
    const copy = getLayerCopy(slide, layerKey);
    return copy?.layer || slide.layers[layerKey] || slide.layers.title;
  };

  const isLayerLocked = (slide, layerKey) => {
    const copy = getLayerCopy(slide, layerKey);
    return copy ? copy.locked : Boolean(slide.lockedLayers?.[layerKey]);
  };

  const updateLayerForSlide = (slideId, layerKey, patch) => {
    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) return slide;
        if (isCopyLayerKey(layerKey)) {
          return {
            ...slide,
            layerCopies: (slide.layerCopies || []).map((copy) =>
              copy.id === copyIdFromLayerKey(layerKey)
                ? { ...copy, layer: { ...copy.layer, ...patch } }
                : copy
            )
          };
        }
        return {
          ...slide,
          layers: {
            ...slide.layers,
            [layerKey]: {
              ...slide.layers[layerKey],
              ...patch
            }
          }
        };
      })
    );
  };

  const selectCanvasLayer = (slideId, layerKey) => {
    setActiveId(slideId);
    setActiveLayer(layerKey);
  };

  const updateSlideText = (slideId, layerKey, patch) => {
    selectCanvasLayer(slideId, layerKey);
    if (isCopyLayerKey(layerKey)) {
      const value = Object.values(patch)[0] ?? "";
      setSlides((current) =>
        current.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                layerCopies: (slide.layerCopies || []).map((copy) =>
                  copy.id === copyIdFromLayerKey(layerKey) ? { ...copy, value } : copy
                )
              }
            : slide
        )
      );
      return;
    }
    updateSlideById(slideId, patch);
  };

  const updateSlideBullet = (slideId, layerKey, index, value) => {
    selectCanvasLayer(slideId, layerKey);
    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) return slide;
        if (isCopyLayerKey(layerKey)) {
          return {
            ...slide,
            layerCopies: (slide.layerCopies || []).map((copy) => {
              if (copy.id !== copyIdFromLayerKey(layerKey)) return copy;
              const bullets = [...copy.bullets];
              bullets[index] = value;
              return { ...copy, bullets };
            })
          };
        }
        const bullets = [...slide.bullets];
        bullets[index] = value;
        return { ...slide, bullets };
      })
    );
  };

  const updateLayer = (layerKey, patch) => {
    updateLayerForSlide(activeSlide.id, layerKey, patch);
  };

  const updateLayerValue = (field, value) => {
    const numericFields = new Set(["x", "y", "size", "width", "height"]);
    if (field === "width") {
      updateLayer(activeLayer, { width: Number(clampPhotoWidth(Number(value)).toFixed(2)) });
      return;
    }
    if (field === "height") {
      updateLayer(activeLayer, { height: Number(clampPhotoHeight(Number(value)).toFixed(2)) });
      return;
    }
    updateLayer(activeLayer, {
      [field]: numericFields.has(field) ? Number(value) : value
    });
  };

  const startLayerDrag = (event, slideId, layerKey) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest(".layer-toolbar, .photo-edit-button, .photo-resize-handle, input, button, label")) return;

    const slide = slides.find((item) => item.id === slideId);
    if (!slide || isLayerLocked(slide, layerKey)) return;

    const canvas = event.currentTarget.closest(".slide-canvas");
    if (!canvas) return;

    const targetLayer = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const layer = getLayerState(slide, layerKey);
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = layer.x;
    const originY = layer.y;
    const editableTarget = event.target.closest("[contenteditable='true']");
    let moved = false;
    let finalX = originX;
    let finalY = originY;
    let frame = null;

    selectCanvasLayer(slideId, layerKey);
    try {
      targetLayer.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic/browser-specific pointer events may not be capturable, but real drags still work.
    }

    const applyImmediatePosition = () => {
      targetLayer.style.left = `${finalX}%`;
      targetLayer.style.top = `${finalY}%`;
      frame = null;
    };

    const moveLayer = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      moveEvent.preventDefault();
      document.getSelection()?.removeAllRanges();
      editableTarget?.blur?.();
      document.body.classList.add("is-layer-dragging");
      targetLayer.classList.add("is-dragging-layer");
      finalX = Number(clampPercent(originX + (dx / rect.width) * 100).toFixed(2));
      finalY = Number(clampPercent(originY + (dy / rect.height) * 100).toFixed(2));
      if (!frame) frame = requestAnimationFrame(applyImmediatePosition);
    };

    const stopDrag = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        applyImmediatePosition();
      }
      document.body.classList.remove("is-layer-dragging");
      targetLayer.classList.remove("is-dragging-layer");
      window.removeEventListener("pointermove", moveLayer);
      window.removeEventListener("pointerup", stopDrag);
      try {
        targetLayer.releasePointerCapture?.(event.pointerId);
      } catch {
        // Ignore release errors when the pointer was not captured.
      }
      if (moved) {
        updateLayerForSlide(slideId, layerKey, { x: finalX, y: finalY });
      }
    };

    window.addEventListener("pointermove", moveLayer);
    window.addEventListener("pointerup", stopDrag);
  };

  const startPhotoResize = (event, slideId, layerKey) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const slide = slides.find((item) => item.id === slideId);
    if (!slide || isLayerLocked(slide, layerKey)) return;

    const canvas = event.currentTarget.closest(".slide-canvas");
    const targetLayer = event.currentTarget.closest(".editable-photo");
    if (!canvas || !targetLayer) return;

    const rect = canvas.getBoundingClientRect();
    const layer = getLayerState(slide, layerKey);
    const startX = event.clientX;
    const startY = event.clientY;
    const originWidth = layer.width || defaultLayer.inset.width;
    const originHeight = layer.height || defaultLayer.inset.height;
    let finalWidth = originWidth;
    let finalHeight = originHeight;
    let moved = false;
    let frame = null;

    selectCanvasLayer(slideId, layerKey);
    document.body.classList.add("is-layer-resizing");
    targetLayer.classList.add("is-resizing-layer");

    const applyImmediateSize = () => {
      targetLayer.style.width = `${finalWidth}%`;
      targetLayer.style.height = `${finalHeight}%`;
      frame = null;
    };

    const resizeLayer = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      finalWidth = Number(clampPhotoWidth(originWidth + (dx / rect.width) * 100).toFixed(2));
      finalHeight = Number(clampPhotoHeight(originHeight + (dy / rect.height) * 100).toFixed(2));
      if (!frame) frame = requestAnimationFrame(applyImmediateSize);
    };

    const stopResize = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        applyImmediateSize();
      }
      document.body.classList.remove("is-layer-resizing");
      targetLayer.classList.remove("is-resizing-layer");
      window.removeEventListener("pointermove", resizeLayer);
      window.removeEventListener("pointerup", stopResize);
      if (moved) {
        updateLayerForSlide(slideId, layerKey, { width: finalWidth, height: finalHeight });
      }
    };

    window.addEventListener("pointermove", resizeLayer);
    window.addEventListener("pointerup", stopResize);
  };

  const resetLayerPosition = (slideId, layerKey) => {
    const slide = slides.find((item) => item.id === slideId);
    if (!slide) return;

    if (isCopyLayerKey(layerKey)) {
      const copy = getLayerCopy(slide, layerKey);
      if (!copy?.initialLayer) return;
      const patch = {
        x: copy.initialLayer.x,
        y: copy.initialLayer.y
      };
      if ("width" in copy.initialLayer) patch.width = copy.initialLayer.width;
      if ("height" in copy.initialLayer) patch.height = copy.initialLayer.height;
      updateLayerForSlide(slideId, layerKey, patch);
      return;
    }

    const initial = initialSlidesRef.current[slideId]?.layers?.[layerKey] || defaultLayer[layerKey];
    if (!initial) return;
    const patch = { x: initial.x, y: initial.y };
    if ("width" in initial) patch.width = initial.width;
    if ("height" in initial) patch.height = initial.height;
    updateLayerForSlide(slideId, layerKey, patch);
  };

  const toggleLayerLock = (slideId, layerKey) => {
    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) return slide;
        if (isCopyLayerKey(layerKey)) {
          return {
            ...slide,
            layerCopies: (slide.layerCopies || []).map((copy) =>
              copy.id === copyIdFromLayerKey(layerKey) ? { ...copy, locked: !copy.locked } : copy
            )
          };
        }
        return {
          ...slide,
          lockedLayers: {
            ...slide.lockedLayers,
            [layerKey]: !slide.lockedLayers?.[layerKey]
          }
        };
      })
    );
  };

  const duplicateLayer = (slideId, layerKey) => {
    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) return slide;

        const sourceCopy = getLayerCopy(slide, layerKey);
        const sourceKey = sourceCopy?.sourceKey || layerKey;
        const meta = sourceCopy || layerCatalog[sourceKey];
        const sourceLayer = structuredClone(sourceCopy?.layer || slide.layers[sourceKey]);
        const layer = {
          ...sourceLayer,
          x: clampPercent(sourceLayer.x + 4),
          y: clampPercent(sourceLayer.y + 4)
        };
        const copy = {
          id: crypto.randomUUID(),
          sourceKey,
          kind: meta.kind,
          label: `${meta.label || layerCatalog[sourceKey]?.label || "레이어"} 복제`,
          className: meta.className || layerCatalog[sourceKey]?.className,
          field: meta.field || layerCatalog[sourceKey]?.field,
          imageField: meta.imageField || layerCatalog[sourceKey]?.imageField,
          value: sourceCopy?.value ?? (meta.field ? slide[meta.field] : ""),
          bullets: structuredClone(sourceCopy?.bullets || slide.bullets || []),
          image: sourceCopy?.image ?? (meta.imageField ? slide[meta.imageField] : ""),
          layer,
          initialLayer: structuredClone(layer),
          locked: false
        };

        setActiveLayer(copyLayerKey(copy.id));
        return {
          ...slide,
          layerCopies: [...(slide.layerCopies || []), copy]
        };
      })
    );
    setActiveId(slideId);
  };

  const deleteLayer = (slideId, layerKey) => {
    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) return slide;
        if (isCopyLayerKey(layerKey)) {
          const deletedCopy = (slide.layerCopies || []).find((copy) => copy.id === copyIdFromLayerKey(layerKey));
          return {
            ...slide,
            layerCopies: (slide.layerCopies || []).filter((copy) => copy.id !== copyIdFromLayerKey(layerKey)),
            deletedLayerCopies: deletedCopy
              ? [
                  ...(slide.deletedLayerCopies || []).filter((copy) => copy.id !== deletedCopy.id),
                  structuredClone(deletedCopy)
                ]
              : slide.deletedLayerCopies
          };
        }
        return {
          ...slide,
          hiddenLayers: {
            ...slide.hiddenLayers,
            [layerKey]: true
          }
        };
      })
    );

    const slide = slides.find((item) => item.id === slideId);
    const firstCopy = (slide?.layerCopies || [])[0];
    const fallbackLayer =
      baseLayerKeysByType[slide?.type || "cover"].find((key) => key !== layerKey && !slide?.hiddenLayers?.[key]) ||
      (firstCopy ? copyLayerKey(firstCopy.id) : slide?.type === "tip" ? "tipLabel" : "title");
    setActiveLayer(fallbackLayer);
  };

  const restoreLayer = (slideId, restoreKey) => {
    let nextActiveLayer = restoreKey;

    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) return slide;

        if (isCopyLayerKey(restoreKey)) {
          const copyId = copyIdFromLayerKey(restoreKey);
          const restoredCopy = (slide.deletedLayerCopies || []).find((copy) => copy.id === copyId);
          if (!restoredCopy) return slide;
          nextActiveLayer = copyLayerKey(restoredCopy.id);
          return {
            ...slide,
            layerCopies: [...(slide.layerCopies || []), structuredClone(restoredCopy)],
            deletedLayerCopies: (slide.deletedLayerCopies || []).filter((copy) => copy.id !== copyId)
          };
        }

        const hiddenLayers = { ...slide.hiddenLayers };
        delete hiddenLayers[restoreKey];
        nextActiveLayer = restoreKey;
        return {
          ...slide,
          hiddenLayers
        };
      })
    );

    setActiveId(slideId);
    setActiveLayer(nextActiveLayer);
  };

  const uploadImage = async (event, field) => {
    const [dataUrl] = await readImageFiles(event.target.files);
    if (!dataUrl) return;
    updateSlide({ [field]: dataUrl });
    event.target.value = "";
  };

  const uploadDroppedImage = async (event, field) => {
    event.preventDefault();
    const [dataUrl] = await readImageFiles(event.dataTransfer.files);
    if (!dataUrl) return;
    updateSlide({ [field]: dataUrl });
  };

  const uploadSlideImage = async (event, slideId, field, layerKey) => {
    const [dataUrl] = await readImageFiles(event.target.files);
    if (!dataUrl) return;
    selectCanvasLayer(slideId, layerKey);
    if (isCopyLayerKey(layerKey)) {
      setSlides((current) =>
        current.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                layerCopies: (slide.layerCopies || []).map((copy) =>
                  copy.id === copyIdFromLayerKey(layerKey) ? { ...copy, image: dataUrl } : copy
                )
              }
            : slide
        )
      );
      event.target.value = "";
      return;
    }
    updateSlideById(slideId, { [field]: dataUrl });
    event.target.value = "";
  };

  const uploadDroppedSlideImage = async (event, slideId, field, layerKey) => {
    event.preventDefault();
    const [dataUrl] = await readImageFiles(event.dataTransfer.files);
    if (!dataUrl) return;
    selectCanvasLayer(slideId, layerKey);
    if (isCopyLayerKey(layerKey)) {
      setSlides((current) =>
        current.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                layerCopies: (slide.layerCopies || []).map((copy) =>
                  copy.id === copyIdFromLayerKey(layerKey) ? { ...copy, image: dataUrl } : copy
                )
              }
            : slide
        )
      );
      return;
    }
    updateSlideById(slideId, { [field]: dataUrl });
  };

  const uploadBatchImages = async (event) => {
    const dataUrls = await readImageFiles(event.target.files);
    event.target.value = "";
    applyBatchImages(dataUrls);
  };

  const uploadDroppedBatch = async (event) => {
    event.preventDefault();
    const dataUrls = await readImageFiles(event.dataTransfer.files);
    applyBatchImages(dataUrls);
  };

  const applyBatchImages = (dataUrls) => {
    if (!dataUrls.length) return;
    setSlides((current) =>
      current.map((slide, index) => ({
        ...slide,
        bgImage: dataUrls[index % dataUrls.length],
        insetImage: slide.type === "tip" ? dataUrls[(index + 1) % dataUrls.length] : slide.insetImage
      }))
    );
  };

  const applyCurrentImageToAll = (field) => {
    const value = activeSlide[field];
    if (!value) return;
    setSlides((current) => current.map((slide) => ({ ...slide, [field]: value })));
  };

  const duplicateSlide = () => {
    if (slides.length >= MAX_SLIDES) return;
    const clone = {
      ...structuredClone(activeSlide),
      id: crypto.randomUUID(),
      name: `${activeSlide.name} 복제`
    };
    initialSlidesRef.current[clone.id] = structuredClone(clone);
    const index = slides.findIndex((slide) => slide.id === activeSlide.id);
    const next = [...slides.slice(0, index + 1), clone, ...slides.slice(index + 1)];
    setSlides(next);
    setActiveId(clone.id);
  };

  const resetActiveSlide = () => {
    const initialSlide = initialSlidesRef.current[activeSlide.id];
    if (!initialSlide) return;
    setActiveSlide(() => structuredClone(initialSlide));
    setActiveLayer(initialSlide.type === "cover" ? "title" : "tipLabel");
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const index = slides.findIndex((slide) => slide.id === activeSlide.id);
    const next = slides.filter((slide) => slide.id !== activeSlide.id);
    delete initialSlidesRef.current[activeSlide.id];
    setSlides(next);
    setActiveId(next[Math.max(0, index - 1)].id);
  };

  const makeCanvas = async (slideId) => {
    const node = slideRefs.current[slideId];
    if (!node) throw new Error("슬라이드를 찾을 수 없습니다.");
    if (document.fonts?.ready) await document.fonts.ready;

    const host = document.createElement("div");
    host.className = "export-host";
    const clone = node.cloneNode(true);
    host.appendChild(clone);
    document.body.appendChild(host);

    const canvas = await html2canvas(clone, {
      scale: 1,
      width: CANVAS.width,
      height: CANVAS.height,
      useCORS: true,
      backgroundColor: null,
      logging: false
    });
    host.remove();
    return canvas;
  };

  const exportSlide = async (slide = activeSlide) => {
    const canvas = await makeCanvas(slide.id);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `street-lookbook-${slides.indexOf(slide) + 1}.png`);
    }, "image/png");
  };

  const exportZip = async () => {
    const zip = new JSZip();
    for (let index = 0; index < slides.length; index += 1) {
      const canvas = await makeCanvas(slides[index].id);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      zip.file(`street-lookbook-${String(index + 1).padStart(2, "0")}.png`, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    downloadBlob(content, "street-lookbook-carousel.zip");
  };

  const legacyLayerOptions = activeSlide.type === "cover"
    ? [
        ["coverBrand", "상단 브랜드"],
        ["subtitle", "서브카피"],
        ["title", "한글 제목"],
        ["englishTitle", "영어 타이틀"],
        ["script", "손글씨 포인트"],
        ["url", "URL"]
      ]
    : [
        ["tipLabel", "Tip 라벨"],
        ["inset", "삽입 사진"],
        ["bullets", "본문 bullet"],
        ["url", "URL"]
      ];

  const layerOptions = [
    ...baseLayerKeysByType[activeSlide.type]
      .filter((key) => !activeSlide.hiddenLayers?.[key])
      .map((key) => [key, layerCatalog[key].label]),
    ...(activeSlide.layerCopies || []).map((copy) => [copyLayerKey(copy.id), copy.label])
  ];

  const deletedLayerOptions = [
    ...baseLayerKeysByType[activeSlide.type]
      .filter((key) => activeSlide.hiddenLayers?.[key])
      .map((key) => [key, layerCatalog[key].label]),
    ...(activeSlide.deletedLayerCopies || []).map((copy) => [copyLayerKey(copy.id), copy.label])
  ];

  const activeLayerState = getLayerState(activeSlide, activeLayer);
  const activeLayerCopy = getLayerCopy(activeSlide, activeLayer);
  const activeLayerAlign = activeLayerState.align || getDefaultTextAlign(activeLayer, activeLayerCopy || {});
  const canAlignActiveLayer = "size" in activeLayerState && !("width" in activeLayerState);
  const copiedTextLayers = (activeSlide.layerCopies || []).filter((copy) => copy.kind === "text");
  const copiedBulletLayers = (activeSlide.layerCopies || []).filter((copy) => copy.kind === "bullets");
  const hasActivePhotoLayer = "width" in activeLayerState && "height" in activeLayerState;
  const hasAnyPhotoLayer = slides.some((slide) =>
    (slide.type === "tip" && !slide.hiddenLayers?.inset && "width" in slide.layers.inset) ||
    (slide.layerCopies || []).some((copy) => copy.kind === "photo")
  );
  const canUsePhotoScale = applyPhotoScaleToAll ? hasAnyPhotoLayer : hasActivePhotoLayer;

  const scalePhotoLayer = (layer, scale) => ({
    ...layer,
    width: Number(clampPhotoWidth(layer.width * scale).toFixed(2)),
    height: Number(clampPhotoHeight(layer.height * scale).toFixed(2))
  });

  const getInitialPhotoSize = (slide, layerKey) => {
    if (isCopyLayerKey(layerKey)) {
      const copy = getLayerCopy(slide, layerKey);
      return copy?.initialLayer || copy?.layer;
    }
    return initialSlidesRef.current[slide.id]?.layers?.[layerKey] || defaultLayer[layerKey];
  };

  const resetActivePhotoSize = () => {
    if (!canUsePhotoScale) return;

    if (applyPhotoScaleToAll) {
      setSlides((current) =>
        current.map((slide) => {
          const shouldResetInset = slide.type === "tip" && !slide.hiddenLayers?.inset && "width" in slide.layers.inset;
          const hasPhotoCopies = (slide.layerCopies || []).some((copy) => copy.kind === "photo");
          if (!shouldResetInset && !hasPhotoCopies) return slide;

          const initialInset = initialSlidesRef.current[slide.id]?.layers?.inset || defaultLayer.inset;
          return {
            ...slide,
            layers: shouldResetInset
              ? {
                  ...slide.layers,
                  inset: {
                    ...slide.layers.inset,
                    width: initialInset.width,
                    height: initialInset.height
                  }
                }
              : slide.layers,
            layerCopies: hasPhotoCopies
              ? (slide.layerCopies || []).map((copy) => {
                  if (copy.kind !== "photo") return copy;
                  const initial = copy.initialLayer || copy.layer;
                  return {
                    ...copy,
                    layer: {
                      ...copy.layer,
                      width: initial.width,
                      height: initial.height
                    }
                  };
                })
              : slide.layerCopies
          };
        })
      );
      return;
    }

    const initial = getInitialPhotoSize(activeSlide, activeLayer);
    if (!initial || !("width" in initial)) return;
    updateLayerForSlide(activeSlide.id, activeLayer, {
      width: initial.width,
      height: initial.height
    });
  };

  const pinActivePhotoSize = () => {
    if (!canUsePhotoScale) return;

    if (applyPhotoScaleToAll) {
      slides.forEach((slide) => {
        if (slide.type !== "tip" || slide.hiddenLayers?.inset) return;
        const initialSlide = initialSlidesRef.current[slide.id];
        if (!initialSlide?.layers?.inset) return;
        initialSlide.layers.inset = {
          ...initialSlide.layers.inset,
          width: slide.layers.inset.width,
          height: slide.layers.inset.height
        };
      });
      setSlides((current) =>
        current.map((slide) => ({
          ...slide,
          layerCopies: (slide.layerCopies || []).map((copy) =>
            copy.kind === "photo"
              ? {
                  ...copy,
                  initialLayer: {
                    ...(copy.initialLayer || copy.layer),
                    width: copy.layer.width,
                    height: copy.layer.height
                  }
                }
              : copy
          )
        }))
      );
      return;
    }

    if (isCopyLayerKey(activeLayer)) {
      setSlides((current) =>
        current.map((slide) => {
          if (slide.id !== activeSlide.id) return slide;
          return {
            ...slide,
            layerCopies: (slide.layerCopies || []).map((copy) =>
              copy.id === copyIdFromLayerKey(activeLayer)
                ? {
                    ...copy,
                    initialLayer: {
                      ...(copy.initialLayer || copy.layer),
                      width: copy.layer.width,
                      height: copy.layer.height
                    }
                  }
                : copy
            )
          };
        })
      );
      return;
    }

    const initialSlide = initialSlidesRef.current[activeSlide.id];
    if (!initialSlide?.layers?.[activeLayer]) return;
    initialSlide.layers[activeLayer] = {
      ...initialSlide.layers[activeLayer],
      width: activeLayerState.width,
      height: activeLayerState.height
    };
  };

  const increaseActivePhotoSize = (amount) => {
    if (!canUsePhotoScale) return;
    const scale = 1 + amount / 100;
    if (applyPhotoScaleToAll) {
      setSlides((current) =>
        current.map((slide) => {
          const shouldScaleInset = slide.type === "tip" && !slide.hiddenLayers?.inset && "width" in slide.layers.inset;
          const hasPhotoCopies = (slide.layerCopies || []).some((copy) => copy.kind === "photo");
          if (!shouldScaleInset && !hasPhotoCopies) return slide;

          return {
            ...slide,
            layers: shouldScaleInset
              ? { ...slide.layers, inset: scalePhotoLayer(slide.layers.inset, scale) }
              : slide.layers,
            layerCopies: hasPhotoCopies
              ? (slide.layerCopies || []).map((copy) =>
                  copy.kind === "photo" ? { ...copy, layer: scalePhotoLayer(copy.layer, scale) } : copy
                )
              : slide.layerCopies
          };
        })
      );
      return;
    }
    updateLayerForSlide(activeSlide.id, activeLayer, {
      width: Number(clampPhotoWidth(activeLayerState.width * scale).toFixed(2)),
      height: Number(clampPhotoHeight(activeLayerState.height * scale).toFixed(2))
    });
  };

  useEffect(() => {
    const moveActiveLayerWithKeyboard = (event) => {
      const arrowDeltas = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
      };
      const delta = arrowDeltas[event.key];
      if (!delta || event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      if (event.target?.closest?.("input, textarea, select, button, label, [contenteditable='true']")) return;

      const slide = slides.find((item) => item.id === activeSlide?.id);
      if (!slide || isLayerLocked(slide, activeLayer)) return;

      const layer = getLayerState(slide, activeLayer);
      if (!layer || !("x" in layer) || !("y" in layer)) return;

      event.preventDefault();
      const stepPx = event.shiftKey ? 10 : 1;
      const xStep = (stepPx / CANVAS.width) * 100;
      const yStep = (stepPx / CANVAS.height) * 100;

      updateLayerForSlide(slide.id, activeLayer, {
        x: Number(clampPercent(layer.x + delta[0] * xStep).toFixed(2)),
        y: Number(clampPercent(layer.y + delta[1] * yStep).toFixed(2))
      });
    };

    window.addEventListener("keydown", moveActiveLayerWithKeyboard);
    return () => window.removeEventListener("keydown", moveActiveLayerWithKeyboard);
  }, [activeLayer, activeSlide?.id, slides]);

  return (
    <main className="studio-shell">
      <section className="preview-pane">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a86f45]">
              NOBLE COCO CAROUSEL
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#241e18]">
              노블코코 매장 소개 카드
            </h1>
            <p className="mt-2 text-sm text-[#6d6256]">
              매장 사진과 소개 문구를 카드별로 바로 다듬어보세요.
            </p>
          </div>
          <div className="top-action-bar">
            <div className="quick-scale-panel" aria-label="선택 사진 크기 빠른 확대">
              <span>사진 크기</span>
              <label className={`scale-apply-toggle ${applyPhotoScaleToAll ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={applyPhotoScaleToAll}
                  onChange={(event) => setApplyPhotoScaleToAll(event.target.checked)}
                />
                전체 적용
              </label>
              <button
                className="scale-btn scale-action-btn"
                disabled={!canUsePhotoScale}
                onClick={resetActivePhotoSize}
                type="button"
              >
                원래 크기
              </button>
              <button
                className="scale-btn scale-action-btn"
                disabled={!canUsePhotoScale}
                onClick={pinActivePhotoSize}
                type="button"
              >
                현재값 고정
              </button>
              {PHOTO_SIZE_STEPS.map((amount) => (
                <button
                  className="scale-btn"
                  disabled={!canUsePhotoScale}
                  key={amount}
                  onClick={() => increaseActivePhotoSize(amount)}
                  type="button"
                >
                  +{amount}%
                </button>
              ))}
            </div>
            <button className="btn" onClick={() => exportSlide(activeSlide)}>선택 PNG</button>
            <button className="btn btn-primary" onClick={exportZip}>전체 ZIP</button>
          </div>
        </div>

        <div className="preview-grid">
          {slides.map((slide, index) => (
            <div className="slide-shell" key={slide.id}>
              <div className="slide-caption">
                <button
                  className={`slide-tab w-full ${slide.id === activeId ? "active" : ""}`}
                  onClick={() => {
                    setActiveId(slide.id);
                    setActiveLayer(slide.type === "cover" ? "title" : "tipLabel");
                  }}
                >
                  {index + 1}. {slide.name}
                </button>
              </div>
              <div className="slide-preview-frame">
                <CarouselSlide
                  slide={slide}
                  isActive={slide.id === activeId}
                  activeLayer={activeLayer}
                  onSelectLayer={selectCanvasLayer}
                  onTextChange={updateSlideText}
                  onBulletChange={updateSlideBullet}
                  onLayerDragStart={startLayerDrag}
                  onPhotoResizeStart={startPhotoResize}
                  onLayerReset={resetLayerPosition}
                  onLayerLockToggle={toggleLayerLock}
                  onLayerDuplicate={duplicateLayer}
                  onLayerDelete={deleteLayer}
                  isLayerLocked={isLayerLocked}
                  onImageUpload={uploadSlideImage}
                  onImageDrop={uploadDroppedSlideImage}
                  refCallback={(node) => {
                    slideRefs.current[slide.id] = node;
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="editor-panel">
        <div className="editor-panel-head">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a86f45]">Editor</p>
          <h2 className="mt-1 text-xl font-black text-[#241e18]">{activeSlide.name} 편집</h2>
        </div>

        <div className="tool-card editor-card-slides">
          <p className="tool-title">슬라이드</p>
          <div className="slide-selector">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                className={`slide-tab ${slide.id === activeId ? "active" : ""}`}
                onClick={() => {
                  setActiveId(slide.id);
                  setActiveLayer(slide.type === "cover" ? "title" : "tipLabel");
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn" onClick={duplicateSlide} disabled={slides.length >= MAX_SLIDES}>복제</button>
            <button className="btn btn-danger" onClick={deleteSlide}>삭제</button>
          </div>
          <button className="btn mt-2 w-full" onClick={resetActiveSlide}>
            현재 카드 기본값 복원
          </button>
        </div>

        <div className="tool-card editor-card-photo">
          <p className="tool-title">사진</p>
          <div className="grid gap-3">
            <label
              className="upload-zone upload-zone-strong"
              onDragOver={(event) => event.preventDefault()}
              onDrop={uploadDroppedBatch}
            >
              <span>여러 사진 한번에 업로드</span>
              <small>여러 장을 선택하면 카드 순서대로 배경/삽입 사진이 자동 배치됩니다.</small>
              <input type="file" accept="image/*" multiple onChange={uploadBatchImages} />
            </label>
            <div className="upload-preview-row">
              <ImagePreview label="현재 배경" src={activeSlide.bgImage} />
              {activeSlide.type === "tip" && <ImagePreview label="삽입 사진" src={activeSlide.insetImage} />}
            </div>
            <label
              className="upload-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => uploadDroppedImage(event, "bgImage")}
            >
              <span>선택 카드 배경 업로드</span>
              <small>이 카드의 전체 배경 사진만 교체합니다.</small>
              <input type="file" accept="image/*" onChange={(event) => uploadImage(event, "bgImage")} />
            </label>
            <button className="btn" onClick={() => applyCurrentImageToAll("bgImage")}>
              현재 배경을 전체 적용
            </button>
            {activeSlide.type === "tip" && (
              <>
                <label
                  className="upload-zone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => uploadDroppedImage(event, "insetImage")}
                >
                  <span>선택 카드 삽입 사진 업로드</span>
                  <small>Tip 카드 중앙 사진만 교체합니다.</small>
                  <input type="file" accept="image/*" onChange={(event) => uploadImage(event, "insetImage")} />
                </label>
                <button className="btn" onClick={() => applyCurrentImageToAll("insetImage")}>
                  현재 삽입 사진을 전체 적용
                </button>
              </>
            )}
          </div>
        </div>

        <div className="tool-card editor-card-copy">
          <p className="tool-title">문구</p>
          <div className="grid gap-3">
            {activeSlide.type === "cover" ? (
              <>
                <label className="field">
                  브랜드명 / 인스타 핸들
                  <input value={activeSlide.brand} onChange={(event) => updateSlide({ brand: event.target.value })} />
                </label>
                <label className="field">
                  서브카피
                  <input value={activeSlide.subtitle} onChange={(event) => updateSlide({ subtitle: event.target.value })} />
                </label>
                <label className="field">
                  한글 제목
                  <input value={activeSlide.title} onChange={(event) => updateSlide({ title: event.target.value })} />
                </label>
                <label className="field">
                  큰 영어 타이틀
                  <input value={activeSlide.englishTitle} onChange={(event) => updateSlide({ englishTitle: event.target.value })} />
                </label>
                <label className="field">
                  손글씨 포인트
                  <input value={activeSlide.scriptText} onChange={(event) => updateSlide({ scriptText: event.target.value })} />
                </label>
                <label className="field">
                  URL
                  <input value={activeSlide.url} onChange={(event) => updateSlide({ url: event.target.value })} />
                </label>
                {copiedTextLayers.map((copy) => (
                  <label className="field copied-field" key={copy.id}>
                    복제 문구 · {copy.label}
                    <input
                      value={copy.value}
                      onChange={(event) => updateSlideText(activeSlide.id, copyLayerKey(copy.id), { value: event.target.value })}
                      onFocus={() => setActiveLayer(copyLayerKey(copy.id))}
                    />
                  </label>
                ))}
              </>
            ) : (
              <>
                <label className="field">
                  Tip 라벨
                  <input value={activeSlide.tipLabel} onChange={(event) => updateSlide({ tipLabel: event.target.value })} />
                </label>
                {activeSlide.bullets.map((bullet, index) => (
                  <label className="field" key={index}>
                    Bullet {index + 1}
                    <textarea
                      value={bullet}
                      onChange={(event) => {
                        const bullets = [...activeSlide.bullets];
                        bullets[index] = event.target.value;
                        updateSlide({ bullets });
                      }}
                    />
                  </label>
                ))}
                <label className="field">
                  URL
                  <input value={activeSlide.url} onChange={(event) => updateSlide({ url: event.target.value })} />
                </label>
                {copiedTextLayers.map((copy) => (
                  <label className="field copied-field" key={copy.id}>
                    복제 문구 · {copy.label}
                    <input
                      value={copy.value}
                      onChange={(event) => updateSlideText(activeSlide.id, copyLayerKey(copy.id), { value: event.target.value })}
                      onFocus={() => setActiveLayer(copyLayerKey(copy.id))}
                    />
                  </label>
                ))}
                {copiedBulletLayers.map((copy) => (
                  <div className="copied-field copied-bullet-field" key={copy.id}>
                    <span>복제 bullet · {copy.label}</span>
                    {copy.bullets.map((bullet, index) => (
                      <textarea
                        key={index}
                        value={bullet}
                        onChange={(event) => updateSlideBullet(activeSlide.id, copyLayerKey(copy.id), index, event.target.value)}
                        onFocus={() => setActiveLayer(copyLayerKey(copy.id))}
                      />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="tool-card editor-card-effects">
          <p className="tool-title">톤 / 효과</p>
          <div className="grid gap-3">
            <label className="field">
              오버레이 강도 {activeSlide.overlay.toFixed(2)}
              <input
                type="range"
                min="0.35"
                max="0.55"
                step="0.01"
                value={activeSlide.overlay}
                onChange={(event) => updateSlide({ overlay: Number(event.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-[#6d6256]">
              <input
                type="checkbox"
                checked={activeSlide.grain}
                onChange={(event) => updateSlide({ grain: event.target.checked })}
              />
              필름 그레인 사용
            </label>
          </div>
        </div>

        <div className="tool-card editor-card-layer">
          <p className="tool-title">레이어 위치 / 스타일</p>
          <div className="grid gap-3">
            <label className="field">
              편집 레이어
              <select value={activeLayer} onChange={(event) => setActiveLayer(event.target.value)}>
                {deletedLayerOptions.length > 0 && (
                  <option value="" disabled>
                    삭제한 레이어는 아래 복구 버튼에서 복구하세요
                  </option>
                )}
                {layerOptions.map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
            {deletedLayerOptions.length > 0 && (
              <div className="restore-panel">
                <span>삭제한 레이어 복구</span>
                <div className="restore-list">
                  {deletedLayerOptions.map(([value, label]) => (
                    <button type="button" key={value} onClick={() => restoreLayer(activeSlide.id, value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="field">
                X
                <input type="number" value={activeLayerState.x} onChange={(event) => updateLayerValue("x", event.target.value)} />
              </label>
              <label className="field">
                Y
                <input type="number" value={activeLayerState.y} onChange={(event) => updateLayerValue("y", event.target.value)} />
              </label>
            </div>
            {"size" in activeLayerState && (
              <label className="field">
                글자 크기
                <input type="number" value={activeLayerState.size} onChange={(event) => updateLayerValue("size", event.target.value)} />
              </label>
            )}
            {canAlignActiveLayer && (
              <div className="field">
                <span>문구 정렬</span>
                <div className="align-button-row" role="group" aria-label="선택 문구 정렬">
                  {TEXT_ALIGN_OPTIONS.map(([value, label]) => (
                    <button
                      className={`align-button ${activeLayerAlign === value ? "active" : ""}`}
                      key={value}
                      onClick={() => updateLayerValue("align", value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {"width" in activeLayerState && (
              <div className="grid grid-cols-2 gap-2">
                <label className="field">
                  사진 너비 %
                  <input type="number" min="18" max="88" value={activeLayerState.width} onChange={(event) => updateLayerValue("width", event.target.value)} />
                  <input type="range" min="18" max="88" step="0.5" value={activeLayerState.width} onChange={(event) => updateLayerValue("width", event.target.value)} />
                </label>
                <label className="field">
                  사진 높이 %
                  <input type="number" min="12" max="62" value={activeLayerState.height} onChange={(event) => updateLayerValue("height", event.target.value)} />
                  <input type="range" min="12" max="62" step="0.5" value={activeLayerState.height} onChange={(event) => updateLayerValue("height", event.target.value)} />
                </label>
              </div>
            )}
            {"color" in activeLayerState && (
              <label className="field">
                색상
                <input type="color" value={activeLayerState.color} onChange={(event) => updateLayerValue("color", event.target.value)} />
              </label>
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}

const CarouselSlide = React.memo(function CarouselSlide({
  slide,
  refCallback,
  isActive,
  activeLayer,
  onSelectLayer,
  onTextChange,
  onBulletChange,
  onLayerDragStart,
  onPhotoResizeStart,
  onLayerReset,
  onLayerLockToggle,
  onLayerDuplicate,
  onLayerDelete,
  isLayerLocked,
  onImageUpload,
  onImageDrop
}) {
  const vars = {
    "--overlay-opacity": slide.overlay,
    "--text-color": slide.layers.title?.color || "#f8f5ef",
    "--accent-color": slide.layers.script?.color || slide.layers.tipLabel?.color || "#ffd9bd",
    "--bg-position": slide.bgPosition || "center center"
  };
  const backgroundFocusLayer = slide.type === "cover" ? "title" : "tipLabel";
  const layerControls = {
    onLayerDragStart,
    onPhotoResizeStart,
    onLayerReset,
    onLayerLockToggle,
    onLayerDuplicate,
    onLayerDelete,
    isLayerLocked
  };

  return (
    <div className="slide-canvas" ref={refCallback} style={vars}>
      {slide.bgImage ? (
        <img
          className="slide-bg"
          decoding="async"
          draggable="false"
          fetchPriority={isActive ? "high" : "low"}
          loading={isActive ? "eager" : "lazy"}
          src={slide.bgImage}
          alt=""
        />
      ) : (
        <div className="fallback-bg" />
      )}
      <div className="dark-overlay" />
      <div className="warm-wash" />
      {slide.grain && <div className="film-grain" />}
      <label
        className="canvas-upload-pill"
        onMouseDown={(event) => {
          event.stopPropagation();
          onSelectLayer(slide.id, backgroundFocusLayer);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => onImageDrop(event, slide.id, "bgImage", backgroundFocusLayer)}
      >
        배경 교체
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onImageUpload(event, slide.id, "bgImage", backgroundFocusLayer)}
        />
      </label>
      <LayerControlsContext.Provider value={layerControls}>
        {slide.type === "cover" ? (
          <CoverTemplate
            slide={slide}
            isActive={isActive}
            activeLayer={activeLayer}
            onSelectLayer={onSelectLayer}
            onTextChange={onTextChange}
          />
        ) : (
          <TipTemplate
            slide={slide}
            isActive={isActive}
            activeLayer={activeLayer}
            onSelectLayer={onSelectLayer}
            onTextChange={onTextChange}
            onBulletChange={onBulletChange}
            onImageUpload={onImageUpload}
            onImageDrop={onImageDrop}
          />
        )}
        <LayerCopies
          slide={slide}
          isActive={isActive}
          activeLayer={activeLayer}
          onSelectLayer={onSelectLayer}
          onTextChange={onTextChange}
          onBulletChange={onBulletChange}
          onImageUpload={onImageUpload}
          onImageDrop={onImageDrop}
        />
      </LayerControlsContext.Provider>
    </div>
  );
}, (previous, next) => {
  const inactiveLayersUnchanged = !previous.isActive && !next.isActive;
  const activeLayerUnchanged = previous.activeLayer === next.activeLayer;
  return (
    previous.slide === next.slide &&
    previous.isActive === next.isActive &&
    (inactiveLayersUnchanged || activeLayerUnchanged)
  );
});

function CoverTemplate({
  slide,
  isActive,
  activeLayer,
  onSelectLayer,
  onTextChange,
  onLayerDragStart,
  onLayerReset,
  onLayerLockToggle,
  onLayerDuplicate,
  onLayerDelete,
  isLayerLocked
}) {
  const layer = slide.layers;
  return (
    <>
      <EditableTextLayer
        className="cover-brand centered"
        field="brand"
        label="브랜드"
        layer={layer.coverBrand}
        layerKey="coverBrand"
        slide={slide}
        value={slide.brand}
        isSelected={isActive && activeLayer === "coverBrand"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
      <EditableTextLayer
        className="korean-subtitle centered"
        field="subtitle"
        label="서브카피"
        layer={layer.subtitle}
        layerKey="subtitle"
        slide={slide}
        value={slide.subtitle}
        isSelected={isActive && activeLayer === "subtitle"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
      <EditableTextLayer
        className="korean-title centered"
        field="title"
        label="한글 제목"
        layer={layer.title}
        layerKey="title"
        slide={slide}
        value={slide.title}
        isSelected={isActive && activeLayer === "title"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
      <EditableTextLayer
        className="english-title"
        field="englishTitle"
        label="영문 타이틀"
        layer={layer.englishTitle}
        layerKey="englishTitle"
        slide={slide}
        value={slide.englishTitle}
        isSelected={isActive && activeLayer === "englishTitle"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
      <EditableTextLayer
        className="script-text"
        field="scriptText"
        label="손글씨 포인트"
        layer={layer.script}
        layerKey="script"
        slide={slide}
        value={slide.scriptText}
        isSelected={isActive && activeLayer === "script"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
      <EditableTextLayer
        className="url-text centered"
        field="url"
        label="URL"
        layer={layer.url}
        layerKey="url"
        slide={slide}
        value={slide.url}
        isSelected={isActive && activeLayer === "url"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
    </>
  );
}

function TipTemplate({
  slide,
  isActive,
  activeLayer,
  onSelectLayer,
  onTextChange,
  onBulletChange,
  onImageUpload,
  onImageDrop
}) {
  const layer = slide.layers;
  const controls = useContext(LayerControlsContext);
  const insetLocked = controls?.isLayerLocked(slide, "inset");
  const bulletsLocked = controls?.isLayerLocked(slide, "bullets");
  const bulletAlign = layer.bullets.align || getDefaultTextAlign("bullets");
  const insetStyle = {
    left: `${layer.inset.x}%`,
    top: `${layer.inset.y}%`,
    width: `${layer.inset.width}%`,
    height: `${layer.inset.height}%`,
    transform: "translateX(-50%)"
  };

  return (
    <>
      <EditableTextLayer
        className="script-text centered"
        field="tipLabel"
        label="Tip 라벨"
        layer={layer.tipLabel}
        layerKey="tipLabel"
        slide={slide}
        value={slide.tipLabel}
        isSelected={isActive && activeLayer === "tipLabel"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
      <div
        className={`tip-photo editable-photo ${isActive && activeLayer === "inset" ? "is-selected" : ""} ${insetLocked ? "is-locked" : ""} ${slide.hiddenLayers?.inset ? "is-hidden-layer" : ""}`}
        data-layer-label="삽입 사진"
        style={insetStyle}
        onPointerDown={(event) => controls?.onLayerDragStart(event, slide.id, "inset")}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => onImageDrop(event, slide.id, "insetImage", "inset")}
      >
        <LayerToolbar
          layerKey="inset"
          locked={insetLocked}
          slide={slide}
          onLayerDelete={controls?.onLayerDelete}
          onLayerDuplicate={controls?.onLayerDuplicate}
          onLayerLockToggle={controls?.onLayerLockToggle}
          onLayerReset={controls?.onLayerReset}
        />
        {slide.insetImage ? <img src={slide.insetImage} alt="" decoding="async" draggable="false" loading="lazy" /> : <div className="tip-placeholder">INSERT PHOTO</div>}
        <label className="photo-edit-button">
          사진 교체
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onImageUpload(event, slide.id, "insetImage", "inset")}
          />
        </label>
        <button
          type="button"
          className="photo-resize-handle"
          aria-label="사진 크기 조절"
          onPointerDown={(event) => controls?.onPhotoResizeStart(event, slide.id, "inset")}
        />
      </div>
      <div
        className={`layer editable-group ${isActive && activeLayer === "bullets" ? "is-selected" : ""} ${bulletsLocked ? "is-locked" : ""} ${slide.hiddenLayers?.bullets ? "is-hidden-layer" : ""}`}
        data-layer-label="본문 bullet"
        data-align={bulletAlign}
        onPointerDown={(event) => controls?.onLayerDragStart(event, slide.id, "bullets")}
        style={{
          left: `${layer.bullets.x}%`,
          top: `${layer.bullets.y}%`,
          width: "76%",
          color: layer.bullets.color,
          fontSize: `${layer.bullets.size}px`,
          textAlign: bulletAlign
        }}
      >
        <LayerToolbar
          layerKey="bullets"
          locked={bulletsLocked}
          slide={slide}
          onLayerDelete={controls?.onLayerDelete}
          onLayerDuplicate={controls?.onLayerDuplicate}
          onLayerLockToggle={controls?.onLayerLockToggle}
          onLayerReset={controls?.onLayerReset}
        />
        <ul className="bullet-list">
          {slide.bullets.map((bullet, index) => (
            <EditableBulletItem
              bullet={bullet}
              index={index}
              key={index}
              layerKey="bullets"
              onBulletChange={onBulletChange}
              onSelectLayer={onSelectLayer}
              slide={slide}
            />
          ))}
        </ul>
      </div>
      <EditableTextLayer
        className="url-text centered"
        field="url"
        label="URL"
        layer={layer.url}
        layerKey="url"
        slide={slide}
        value={slide.url}
        isSelected={isActive && activeLayer === "url"}
        onSelectLayer={onSelectLayer}
        onTextChange={onTextChange}
      />
    </>
  );
}

function LayerCopies({
  slide,
  isActive,
  activeLayer,
  onSelectLayer,
  onTextChange,
  onBulletChange,
  onImageUpload,
  onImageDrop
}) {
  const controls = useContext(LayerControlsContext);

  return (
    <>
      {(slide.layerCopies || []).map((copy) => {
        const layerKey = copyLayerKey(copy.id);
        const locked = controls?.isLayerLocked(slide, layerKey);

        if (copy.kind === "text") {
          return (
            <EditableTextLayer
              className={copy.className}
              field={copy.field || "value"}
              isSelected={isActive && activeLayer === layerKey}
              key={copy.id}
              label={copy.label}
              layer={copy.layer}
              layerKey={layerKey}
              onSelectLayer={onSelectLayer}
              onTextChange={onTextChange}
              slide={slide}
              value={copy.value}
            />
          );
        }

        if (copy.kind === "photo") {
          return (
            <div
              className={`tip-photo editable-photo ${isActive && activeLayer === layerKey ? "is-selected" : ""} ${locked ? "is-locked" : ""}`}
              data-layer-label={copy.label}
              key={copy.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onImageDrop(event, slide.id, "image", layerKey)}
              onPointerDown={(event) => controls?.onLayerDragStart(event, slide.id, layerKey)}
              style={{
                left: `${copy.layer.x}%`,
                top: `${copy.layer.y}%`,
                width: `${copy.layer.width}%`,
                height: `${copy.layer.height}%`,
                transform: "translateX(-50%)"
              }}
            >
              <LayerToolbar
                layerKey={layerKey}
                locked={locked}
                slide={slide}
                onLayerDelete={controls?.onLayerDelete}
                onLayerDuplicate={controls?.onLayerDuplicate}
                onLayerLockToggle={controls?.onLayerLockToggle}
                onLayerReset={controls?.onLayerReset}
              />
              {copy.image ? <img src={copy.image} alt="" decoding="async" draggable="false" loading="lazy" /> : <div className="tip-placeholder">INSERT PHOTO</div>}
              <label className="photo-edit-button">
                사진 교체
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onImageUpload(event, slide.id, "image", layerKey)}
                />
              </label>
              <button
                type="button"
                className="photo-resize-handle"
                aria-label="사진 크기 조절"
                onPointerDown={(event) => controls?.onPhotoResizeStart(event, slide.id, layerKey)}
              />
            </div>
          );
        }

        const copyAlign = copy.layer.align || getDefaultTextAlign(layerKey, copy);
        return (
          <div
            className={`layer editable-group ${isActive && activeLayer === layerKey ? "is-selected" : ""} ${locked ? "is-locked" : ""}`}
            data-layer-label={copy.label}
            data-align={copyAlign}
            key={copy.id}
            onPointerDown={(event) => controls?.onLayerDragStart(event, slide.id, layerKey)}
            style={{
              left: `${copy.layer.x}%`,
              top: `${copy.layer.y}%`,
              width: "76%",
              color: copy.layer.color,
              fontSize: `${copy.layer.size}px`,
              textAlign: copyAlign
            }}
          >
            <LayerToolbar
              layerKey={layerKey}
              locked={locked}
              slide={slide}
              onLayerDelete={controls?.onLayerDelete}
              onLayerDuplicate={controls?.onLayerDuplicate}
              onLayerLockToggle={controls?.onLayerLockToggle}
              onLayerReset={controls?.onLayerReset}
            />
            <ul className="bullet-list">
              {copy.bullets.map((bullet, index) => (
                <EditableBulletItem
                  bullet={bullet}
                  index={index}
                  key={index}
                  layerKey={layerKey}
                  onBulletChange={onBulletChange}
                  onSelectLayer={onSelectLayer}
                  slide={slide}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function EditableBulletItem({
  bullet,
  index,
  layerKey,
  slide,
  onSelectLayer,
  onBulletChange
}) {
  const textRef = useEditableTextSync(bullet);

  return (
    <li
      className="editable-bullet"
      contentEditable
      data-layer-label={`Bullet ${index + 1}`}
      key={index}
      onFocus={() => onSelectLayer(slide.id, layerKey)}
      onInput={(event) => onBulletChange(slide.id, layerKey, index, event.currentTarget.textContent)}
      onKeyDown={finishSingleLineEdit}
      onPaste={pastePlainText}
      ref={textRef}
      suppressContentEditableWarning
    />
  );
}

function EditableTextLayer({
  className,
  field,
  label,
  layer,
  layerKey,
  slide,
  value,
  isSelected,
  onSelectLayer,
  onTextChange
}) {
  const controls = useContext(LayerControlsContext);
  const locked = controls?.isLayerLocked(slide, layerKey);
  const textRef = useEditableTextSync(value);
  const textAlign = layer.align || getDefaultTextAlign(layerKey, { className });

  if (!isCopyLayerKey(layerKey) && slide.hiddenLayers?.[layerKey]) {
    return null;
  }

  return (
    <div
      className={`layer editable-layer ${className} ${isSelected ? "is-selected" : ""} ${locked ? "is-locked" : ""}`}
      data-layer-label={label}
      onPointerDown={(event) => controls?.onLayerDragStart(event, slide.id, layerKey)}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        color: layer.color,
        fontSize: `${layer.size}px`,
        textAlign
      }}
    >
      <LayerToolbar
        layerKey={layerKey}
        locked={locked}
        slide={slide}
        onLayerDelete={controls?.onLayerDelete}
        onLayerDuplicate={controls?.onLayerDuplicate}
        onLayerLockToggle={controls?.onLayerLockToggle}
        onLayerReset={controls?.onLayerReset}
      />
      <span
        className="editable-text-content"
        contentEditable
        onFocus={() => onSelectLayer(slide.id, layerKey)}
        onInput={(event) => onTextChange(slide.id, layerKey, { [field]: event.currentTarget.textContent })}
        onKeyDown={finishSingleLineEdit}
        onMouseDown={() => onSelectLayer(slide.id, layerKey)}
        onPaste={pastePlainText}
        ref={textRef}
        role="textbox"
        spellCheck="false"
        suppressContentEditableWarning
      />
    </div>
  );
}

function LayerToolbar({
  slide,
  layerKey,
  locked,
  onLayerReset,
  onLayerLockToggle,
  onLayerDuplicate,
  onLayerDelete
}) {
  return (
    <div className="layer-toolbar" onPointerDown={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => onLayerReset?.(slide.id, layerKey)}>초기화</button>
      <button type="button" onClick={() => onLayerLockToggle?.(slide.id, layerKey)}>
        {locked ? "해제" : "고정"}
      </button>
      <button type="button" onClick={() => onLayerDuplicate?.(slide.id, layerKey)}>복제</button>
      <button type="button" onClick={() => onLayerDelete?.(slide.id, layerKey)}>삭제</button>
    </div>
  );
}

function finishSingleLineEdit(event) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  event.currentTarget.blur();
}

function pastePlainText(event) {
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
}

function ImagePreview({ label, src }) {
  return (
    <div className="image-preview">
      {src ? <img src={src} alt="" decoding="async" draggable="false" loading="lazy" /> : <div className="image-preview-empty" />}
      <span>{label}</span>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
