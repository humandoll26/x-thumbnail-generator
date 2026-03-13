import React, { useEffect, useMemo, useRef, useState } from "react";

type ThemeKey = "ink" | "sunset" | "forest" | "plum" | "paper";
type PresetKey = "standard" | "wide" | "square";
type LayoutKey = "left" | "center" | "split";

type Theme = {
  name: string;
  bg: [string, string];
  accent: string;
  text: string;
  sub: string;
  badgeBg: string;
  line: string;
};

type Preset = {
  label: string;
  width: number;
  height: number;
};

type State = {
  badge: string;
  title: string;
  subtitle: string;
  preset: PresetKey;
  layout: LayoutKey;
  theme: ThemeKey;
  titleSize: number;
  subSize: number;
  badgeSize: number;
  overlay: number;
  padding: number;
};

const THEMES: Record<ThemeKey, Theme> = {
  ink: {
    name: "Ink",
    bg: ["#0f172a", "#111827"],
    accent: "#38bdf8",
    text: "#f8fafc",
    sub: "#cbd5e1",
    badgeBg: "rgba(56, 189, 248, 0.18)",
    line: "rgba(255,255,255,0.10)",
  },
  sunset: {
    name: "Sunset",
    bg: ["#7c2d12", "#1f2937"],
    accent: "#fb7185",
    text: "#fff7ed",
    sub: "#fed7aa",
    badgeBg: "rgba(251, 113, 133, 0.18)",
    line: "rgba(255,255,255,0.12)",
  },
  forest: {
    name: "Forest",
    bg: ["#052e16", "#14532d"],
    accent: "#4ade80",
    text: "#f0fdf4",
    sub: "#dcfce7",
    badgeBg: "rgba(74, 222, 128, 0.18)",
    line: "rgba(255,255,255,0.10)",
  },
  plum: {
    name: "Plum",
    bg: ["#3b0764", "#1e1b4b"],
    accent: "#c084fc",
    text: "#faf5ff",
    sub: "#e9d5ff",
    badgeBg: "rgba(192, 132, 252, 0.18)",
    line: "rgba(255,255,255,0.10)",
  },
  paper: {
    name: "Paper",
    bg: ["#f8fafc", "#e2e8f0"],
    accent: "#0f172a",
    text: "#0f172a",
    sub: "#334155",
    badgeBg: "rgba(15, 23, 42, 0.08)",
    line: "rgba(15,23,42,0.08)",
  },
};

const PRESETS: Record<PresetKey, Preset> = {
  standard: { label: "X横長 1200×675", width: 1200, height: 675 },
  wide: { label: "ワイド 1600×900", width: 1600, height: 900 },
  square: { label: "正方形 1080×1080", width: 1080, height: 1080 },
};

const DEFAULTS: State = {
  badge: "WEB TOOL",
  title: "X用サムネイルを\nすばやく作る",
  subtitle: "タイトル・帯・背景色を変えて、そのままPNG保存",
  preset: "standard",
  layout: "left",
  theme: "ink",
  titleSize: 72,
  subSize: 28,
  badgeSize: 20,
  overlay: 35,
  padding: 72,
};

const DEFAULT_POINT_BOX = {
  title: "POINT",
  item1: "PNG保存できる",
  item2: "背景画像も使える",
  item3: "X向けサイズを選べる",
};

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = String(text || "").split("\n");
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      allLines.push("");
      continue;
    }

    const chars = paragraph.split("");
    let line = "";

    for (const ch of chars) {
      const test = line + ch;
      if (context.measureText(test).width > maxWidth && line) {
        allLines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }

    if (line) allLines.push(line);
  }

  return allLines;
}

function getPreviewScale(viewportWidth: number, presetWidth: number): number {
  const maxPreviewWidth = Math.min(920, Math.max(320, viewportWidth - 90));
  return Math.min(1, maxPreviewWidth / presetWidth);
}

function getVisibleBullets(items: string[]): string[] {
  return items.filter((item) => item.trim() !== "");
}

function runSelfTests() {
  const bullets = getVisibleBullets(["A", " ", "B"]);
  const tests = [
    {
      name: "standard preset exists",
      pass: PRESETS.standard.width === 1200 && PRESETS.standard.height === 675,
    },
    {
      name: "default theme exists",
      pass: Boolean(THEMES[DEFAULTS.theme]),
    },
    {
      name: "preview scale stays within bounds",
      pass: getPreviewScale(500, 1200) > 0 && getPreviewScale(500, 1200) <= 1,
    },
    {
      name: "paper theme uses dark text",
      pass: THEMES.paper.text === "#0f172a",
    },
    {
      name: "blank bullets are removed",
      pass: bullets.length === 2 && bullets[0] === "A" && bullets[1] === "B",
    },
    {
      name: "default split box has title",
      pass: DEFAULT_POINT_BOX.title === "POINT",
    },
    {
      name: "square preset exists",
      pass: PRESETS.square.width === 1080 && PRESETS.square.height === 1080,
    },
  ];

  return {
    total: tests.length,
    passed: tests.filter((test) => test.pass).length,
    tests,
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{children}</label>;
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)",
        borderRadius: 28,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        border: "1px solid #d5dde8",
        borderRadius: 16,
        background: "rgba(255,255,255,0.95)",
        padding: "12px 14px",
        font: "inherit",
        color: "#1e293b",
        ...(props.style || {}),
      }}
    />
  );
}

function TextareaBase(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        border: "1px solid #d5dde8",
        borderRadius: 16,
        background: "rgba(255,255,255,0.95)",
        padding: "12px 14px",
        font: "inherit",
        color: "#1e293b",
        minHeight: 110,
        resize: "vertical",
        lineHeight: 1.6,
        ...(props.style || {}),
      }}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        border: "1px solid #d5dde8",
        borderRadius: 16,
        background: "rgba(255,255,255,0.95)",
        padding: "12px 14px",
        font: "inherit",
        color: "#1e293b",
        ...(props.style || {}),
      }}
    />
  );
}

export default function XThumbnailGenerator(): JSX.Element {
  const [state, setState] = useState<State>(DEFAULTS);
  const [pointTitle, setPointTitle] = useState<string>(DEFAULT_POINT_BOX.title);
  const [point1, setPoint1] = useState<string>(DEFAULT_POINT_BOX.item1);
  const [point2, setPoint2] = useState<string>(DEFAULT_POINT_BOX.item2);
  const [point3, setPoint3] = useState<string>(DEFAULT_POINT_BOX.item3);
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string>("");
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window === "undefined" ? 1400 : window.innerWidth);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const preset = PRESETS[state.preset];
  const theme = THEMES[state.theme];
  const scale = useMemo(() => getPreviewScale(viewportWidth, preset.width), [viewportWidth, preset.width]);
  const testSummary = useMemo(() => runSelfTests(), []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      if (bgImageUrl) {
        URL.revokeObjectURL(bgImageUrl);
      }
    };
  }, [bgImageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = preset.width;
    canvas.height = preset.height;

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.bg[0]);
    gradient.addColorStop(1, theme.bg[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (bgImage) {
      const coverScale = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height);
      const drawWidth = bgImage.width * coverScale;
      const drawHeight = bgImage.height * coverScale;
      const dx = (canvas.width - drawWidth) / 2;
      const dy = (canvas.height - drawHeight) / 2;
      context.save();
      context.globalAlpha = 1;
      context.drawImage(bgImage, dx, dy, drawWidth, drawHeight);
      context.restore();
    }

    context.fillStyle = `rgba(0,0,0,${state.overlay / 100})`;
    if (state.theme === "paper") {
      context.fillStyle = `rgba(255,255,255,${Math.max(0, state.overlay - 10) / 100})`;
    }
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = theme.line;
    context.lineWidth = 2;
    drawRoundedRect(context, 28, 28, canvas.width - 56, canvas.height - 56, 26);
    context.stroke();

    const safeX = state.padding;
    const safeY = state.padding;
    const safeW = canvas.width - state.padding * 2;
    const safeH = canvas.height - state.padding * 2;

    let contentX = safeX;
    let contentWidth = safeW;
    let align: CanvasTextAlign = "left";

    if (state.layout === "center") {
      align = "center";
      contentX = safeX + safeW / 2;
      contentWidth = safeW * 0.78;
    }

    if (state.layout === "split") {
      contentWidth = safeW * 0.54;
    }

    const badgePadX = 18;
    const badgePadY = 12;
    context.font = `700 ${state.badgeSize}px system-ui, sans-serif`;
    const badgeWidth = Math.max(120, context.measureText(state.badge || "").width + badgePadX * 2);
    const badgeHeight = state.badgeSize + badgePadY * 2;
    const badgeX = state.layout === "center" ? contentX - badgeWidth / 2 : contentX;
    const badgeY = safeY;

    context.fillStyle = theme.badgeBg;
    drawRoundedRect(context, badgeX, badgeY, badgeWidth, badgeHeight, 999);
    context.fill();
    context.fillStyle = theme.accent;
    context.textAlign = state.layout === "center" ? "center" : "left";
    context.textBaseline = "middle";
    context.fillText(
      state.badge || "",
      state.layout === "center" ? badgeX + badgeWidth / 2 : badgeX + badgePadX,
      badgeY + badgeHeight / 2 + 1,
    );

    const titleY = badgeY + badgeHeight + 34;
    context.fillStyle = theme.text;
    context.textAlign = align;
    context.textBaseline = "top";
    context.font = `800 ${state.titleSize}px system-ui, sans-serif`;

    const titleLines = wrapLines(context, state.title, contentWidth);
    const titleLineHeight = Math.round(state.titleSize * 1.15);
    titleLines.forEach((line, index) => {
      context.fillText(line, contentX, titleY + index * titleLineHeight);
    });

    const subY = titleY + titleLines.length * titleLineHeight + 22;
    context.fillStyle = theme.sub;
    context.font = `500 ${state.subSize}px system-ui, sans-serif`;
    const subLines = wrapLines(context, state.subtitle, contentWidth);
    const subLineHeight = Math.round(state.subSize * 1.45);
    subLines.forEach((line, index) => {
      context.fillText(line, contentX, subY + index * subLineHeight);
    });

    if (state.layout === "split") {
      const boxW = safeW * 0.28;
      const boxH = safeH * 0.64;
      const boxX = safeX + safeW - boxW;
      const boxY = safeY + safeH / 2 - boxH / 2;

      context.fillStyle = theme.badgeBg;
      drawRoundedRect(context, boxX, boxY, boxW, boxH, 28);
      context.fill();

      context.strokeStyle = theme.line;
      context.lineWidth = 2;
      context.stroke();

      context.fillStyle = theme.accent;
      context.font = `700 ${Math.max(20, state.subSize * 0.9)}px system-ui, sans-serif`;
      context.textAlign = "left";
      context.fillText(pointTitle || DEFAULT_POINT_BOX.title, boxX + 26, boxY + 28);

      const bullets = getVisibleBullets([point1, point2, point3]);
      context.fillStyle = theme.text;
      context.font = `600 ${Math.max(22, state.subSize * 0.95)}px system-ui, sans-serif`;
      bullets.forEach((bullet, index) => {
        context.beginPath();
        context.fillStyle = theme.accent;
        context.arc(boxX + 34, boxY + 86 + index * 74, 6, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = theme.text;
        context.fillText(bullet, boxX + 52, boxY + 72 + index * 74);
      });
    }

    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.font = `600 ${Math.max(16, state.badgeSize * 0.95)}px system-ui, sans-serif`;
    context.fillStyle = theme.sub;
    context.fillText("made with X Thumbnail Generator", canvas.width - 40, canvas.height - 36);
  }, [bgImage, point1, point2, point3, pointTitle, preset.height, preset.width, state, theme]);

  const setField = <K extends keyof State,>(key: K, value: State[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    if (bgImageUrl) {
      URL.revokeObjectURL(bgImageUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setBgImage(image);
      setBgImageUrl(objectUrl);
    };
    image.src = objectUrl;
  };

  const resetAll = () => {
    setState(DEFAULTS);
    setPointTitle(DEFAULT_POINT_BOX.title);
    setPoint1(DEFAULT_POINT_BOX.item1);
    setPoint2(DEFAULT_POINT_BOX.item2);
    setPoint3(DEFAULT_POINT_BOX.item3);

    if (bgImageUrl) {
      URL.revokeObjectURL(bgImageUrl);
    }

    setBgImage(null);
    setBgImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `x-thumbnail-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    border: 0,
    background: isActive ? "#ffffff" : "transparent",
    color: isActive ? "#1e293b" : "#64748b",
    boxShadow: isActive ? "0 6px 18px rgba(15, 23, 42, 0.08)" : "none",
    borderRadius: 14,
    padding: "12px 10px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  });

  const isMobile = viewportWidth <= 1080;

  return (
    <div
      style={{
        margin: 0,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#1e293b",
        background:
          "radial-gradient(circle at top left, rgba(148, 163, 184, 0.22), transparent 28%), linear-gradient(180deg, #f6f8fb 0%, #e5ebf3 100%)",
        minHeight: "100vh",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(1400px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: 24,
          gridTemplateColumns: isMobile ? "1fr" : "420px minmax(0, 1fr)",
          alignItems: "start",
        }}
      >
        <Panel style={{ padding: 24, position: isMobile ? "static" : "sticky", top: 24 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px" }}>X用サムネイル生成ツール</h1>
          <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: "0.94rem", lineHeight: 1.6 }}>
            タイトル・見た目・背景をまとめて調整して、そのままPNG保存できます。
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              background: "#eef2f7",
              padding: 6,
              borderRadius: 18,
              marginBottom: 20,
            }}
          >
            <button style={tabButtonStyle(activeTab === "text")} onClick={() => setActiveTab("text")}>
              文字・見た目
            </button>
            <button style={tabButtonStyle(activeTab === "image")} onClick={() => setActiveTab("image")}>
              背景
            </button>
          </div>

          {activeTab === "text" && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <FieldLabel>帯テキスト</FieldLabel>
                <InputBase value={state.badge} onChange={(e) => setField("badge", e.target.value)} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <FieldLabel>タイトル</FieldLabel>
                <TextareaBase value={state.title} onChange={(e) => setField("title", e.target.value)} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <FieldLabel>サブタイトル</FieldLabel>
                <TextareaBase value={state.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
              </div>

              <div
                style={{
                  marginBottom: 18,
                  padding: 14,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>見た目</div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>画像サイズ</FieldLabel>
                  <SelectBase value={state.preset} onChange={(e) => setField("preset", e.target.value as PresetKey)}>
                    {Object.entries(PRESETS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </SelectBase>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>レイアウト</FieldLabel>
                  <SelectBase value={state.layout} onChange={(e) => setField("layout", e.target.value as LayoutKey)}>
                    <option value="left">左寄せ</option>
                    <option value="center">中央寄せ</option>
                    <option value="split">分割</option>
                  </SelectBase>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>テーマ</FieldLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    {Object.entries(THEMES).map(([key, currentTheme]) => {
                      const active = state.theme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setField("theme", key as ThemeKey)}
                          style={{
                            border: `1px solid ${active ? "#0f172a" : "#d5dde8"}`,
                            borderRadius: 18,
                            padding: 12,
                            background: "#fff",
                            cursor: "pointer",
                            textAlign: "left",
                            boxShadow: active ? "0 0 0 2px rgba(15,23,42,0.12)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                display: "block",
                                background: currentTheme.bg[0],
                              }}
                            />
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                display: "block",
                                background: currentTheme.bg[1],
                              }}
                            />
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                display: "block",
                                background: currentTheme.accent,
                              }}
                            />
                          </div>
                          <strong>{currentTheme.name}</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 12 }}>
                  {[
                    { key: "titleSize", label: "タイトルサイズ", min: 42, max: 110, step: 1, value: state.titleSize },
                    { key: "subSize", label: "サブタイトルサイズ", min: 18, max: 42, step: 1, value: state.subSize },
                    { key: "badgeSize", label: "帯サイズ", min: 14, max: 30, step: 1, value: state.badgeSize },
                    { key: "padding", label: "余白", min: 40, max: 120, step: 2, value: state.padding },
                  ].map((item, index) => (
                    <div key={item.key} style={{ marginBottom: index === 3 ? 0 : 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          marginBottom: 8,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        <span>{item.label}</span>
                        <strong>{item.value}px</strong>
                      </div>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        value={item.value}
                        onChange={(e) => setField(item.key as keyof State, Number(e.target.value) as never)}
                        style={{ width: "100%" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginBottom: 18,
                  padding: 14,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>分割レイアウト用ボックス</div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>見出し</FieldLabel>
                  <InputBase value={pointTitle} onChange={(e) => setPointTitle(e.target.value)} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>項目1</FieldLabel>
                  <InputBase value={point1} onChange={(e) => setPoint1(e.target.value)} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>項目2</FieldLabel>
                  <InputBase value={point2} onChange={(e) => setPoint2(e.target.value)} />
                </div>

                <div style={{ marginBottom: 0 }}>
                  <FieldLabel>項目3</FieldLabel>
                  <InputBase value={point3} onChange={(e) => setPoint3(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "image" && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <FieldLabel>背景画像をアップロード</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                  style={{
                    width: "100%",
                    border: "1px solid #d5dde8",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.95)",
                    padding: "12px 14px",
                    font: "inherit",
                    color: "#1e293b",
                  }}
                />
                <div style={{ marginTop: 6, color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                  画像を敷いた上からオーバーレイをかけます。
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  padding: 14,
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <span>オーバーレイ濃さ</span>
                  <strong>{state.overlay}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={1}
                  value={state.overlay}
                  onChange={(e) => setField("overlay", Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              {bgImageUrl && (
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid #d5dde8",
                    background: "#fff",
                  }}
                >
                  <img
                    src={bgImageUrl}
                    alt="アップロード画像プレビュー"
                    style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
            <button
              onClick={downloadPng}
              style={{
                border: 0,
                borderRadius: 16,
                padding: "13px 18px",
                font: "inherit",
                fontWeight: 800,
                cursor: "pointer",
                background: "#0f172a",
                color: "#fff",
              }}
            >
              PNG保存
            </button>
            <button
              onClick={resetAll}
              style={{
                border: 0,
                borderRadius: 16,
                padding: "13px 18px",
                font: "inherit",
                fontWeight: 800,
                cursor: "pointer",
                background: "#e2e8f0",
                color: "#0f172a",
              }}
            >
              リセット
            </button>
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: viewportWidth <= 720 ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {[
              ["レイアウト3種", "左寄せ・中央・分割"],
              ["カラーテーマ切替", "濃色・淡色をすぐ変更"],
              ["背景画像対応", "写真ベースのサムネも作れる"],
            ].map(([title, sub]) => (
              <Panel key={title} style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "0.98rem", fontWeight: 800 }}>{title}</div>
                <div style={{ marginTop: 4, color: "#64748b", fontSize: "0.88rem" }}>{sub}</div>
              </Panel>
            ))}
          </div>

          <Panel style={{ padding: 22 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.15rem", fontWeight: 800 }}>プレビュー</h2>
            <div
              style={{
                overflow: "auto",
                borderRadius: 24,
                background: "linear-gradient(180deg, #dbe4ef 0%, #cfd9e6 100%)",
                padding: 18,
                minHeight: 420,
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  margin: "0 auto",
                  borderRadius: 20,
                  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.2)",
                  background: "#fff",
                  width: `${preset.width * scale}px`,
                  height: `${preset.height * scale}px`,
                }}
              />
            </div>
          </Panel>

          <Panel style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Self-check</div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
              {testSummary.passed}/{testSummary.total} tests passed
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {testSummary.tests.map((test) => (
                <div key={test.name} style={{ fontSize: 13, color: test.pass ? "#166534" : "#991b1b" }}>
                  {test.pass ? "✓" : "✗"} {test.name}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
