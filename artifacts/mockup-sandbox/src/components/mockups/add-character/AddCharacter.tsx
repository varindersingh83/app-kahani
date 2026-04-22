import { useState } from "react";

export function AddCharacter() {
  const [name, setName] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: "#FFFCF6", fontFamily: "'Georgia', serif" }}
    >
      {/* Watercolor background blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 280, height: 210, borderRadius: "44% 56% 62% 38% / 42% 38% 62% 58%",
          background: "rgba(191,216,196,0.45)",
          top: -50, left: -60,
          transform: "rotate(-12deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 240, height: 180, borderRadius: "60% 40% 38% 62% / 58% 64% 36% 42%",
          background: "rgba(242,201,183,0.38)",
          top: -20, right: -40,
          transform: "rotate(15deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 260, height: 200, borderRadius: "40% 60% 55% 45% / 50% 40% 60% 50%",
          background: "rgba(207,228,201,0.35)",
          bottom: 60, left: -70,
          transform: "rotate(8deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 200, height: 160, borderRadius: "55% 45% 40% 60% / 45% 55% 45% 55%",
          background: "rgba(255,230,195,0.42)",
          bottom: 20, right: -50,
          transform: "rotate(-18deg)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center px-5 pt-14 pb-2">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ background: "rgba(244,238,228,0.9)", border: "1px solid #E5D9C8" }}
        >
          <svg width="18" height="18" fill="none" stroke="#7B6A42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 9H3M8 4l-5 5 5 5"/>
          </svg>
        </button>
        <span
          className="ml-4 text-lg"
          style={{ color: "#5C4A2A", fontFamily: "'Georgia', serif", fontWeight: 700, letterSpacing: -0.3 }}
        >
          Add a little one
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center flex-1 px-7 pt-6 pb-10 gap-6">

        {/* Photo area */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Avatar circle */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 148, height: 148,
              borderRadius: 42,
              background: hasPhoto
                ? "linear-gradient(135deg, #BFD8C4 0%, #F2C9B7 100%)"
                : "rgba(244,238,228,0.95)",
              border: "2.5px dashed #C8B89A",
              boxShadow: "0 4px 24px rgba(139,119,74,0.10)",
            }}
          >
            {hasPhoto ? (
              <>
                {/* Simulated photo */}
                <div className="w-full h-full rounded-[38px] overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #BFD8C4 0%, #F9D4C0 100%)" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <ellipse cx="28" cy="22" rx="13" ry="13" fill="rgba(255,255,255,0.7)" />
                    <ellipse cx="28" cy="46" rx="20" ry="14" fill="rgba(255,255,255,0.5)" />
                  </svg>
                </div>
                {/* Edit badge */}
                <div
                  className="absolute -bottom-2 -right-2 w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ background: "#8B7B5A", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
                >
                  <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2 2-9 9H3v-2l9-9z"/>
                  </svg>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg width="36" height="36" fill="none" stroke="#B8A882" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="14" r="8" />
                  <path d="M4 34c0-8 7-14 14-14s14 6 14 14" />
                </svg>
                <span style={{ color: "#B8A882", fontSize: 12, fontFamily: "system-ui", fontWeight: 600 }}>
                  Add photo
                </span>
              </div>
            )}
          </div>

          {/* Watercolor tag */}
          <div
            className="px-4 py-1 rounded-full"
            style={{ background: "rgba(191,216,196,0.45)", border: "1px solid rgba(144,183,151,0.4)" }}
          >
            <span style={{ color: "#5E7A60", fontSize: 12, fontFamily: "system-ui", fontWeight: 600 }}>
              {hasPhoto ? "Looking great! ✨" : "A selfie or photo works perfectly"}
            </span>
          </div>
        </div>

        {/* Photo action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setHasPhoto(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-opacity active:opacity-70"
            style={{
              background: "#FFF2EC",
              border: "1.5px solid #EBC8B8",
              boxShadow: "0 2px 8px rgba(235,163,135,0.12)",
            }}
          >
            {/* Camera icon */}
            <svg width="20" height="20" fill="none" stroke="#9F6B54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span style={{ color: "#9F6B54", fontSize: 14, fontFamily: "system-ui", fontWeight: 700 }}>
              Take photo
            </span>
          </button>

          <button
            onClick={() => setHasPhoto(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-opacity active:opacity-70"
            style={{
              background: "#EEF8FA",
              border: "1.5px solid #BFDDE5",
              boxShadow: "0 2px 8px rgba(111,176,195,0.12)",
            }}
          >
            {/* Upload icon */}
            <svg width="20" height="20" fill="none" stroke="#517A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span style={{ color: "#517A8C", fontSize: 14, fontFamily: "system-ui", fontWeight: 700 }}>
              Upload
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center w-full gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(200,184,154,0.4)" }} />
          <span style={{ color: "#B8A882", fontSize: 12, fontFamily: "system-ui" }}>then</span>
          <div className="flex-1 h-px" style={{ background: "rgba(200,184,154,0.4)" }} />
        </div>

        {/* Name input */}
        <div className="w-full flex flex-col gap-2">
          <label style={{ color: "#7B6A42", fontSize: 13, fontFamily: "system-ui", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Their name
          </label>
          <div className="relative w-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mia, Zayan, Lily…"
              className="w-full rounded-2xl px-5 py-4 outline-none transition-all"
              style={{
                background: "rgba(255,252,246,0.95)",
                border: "1.5px solid #DDD1BC",
                color: "#5C4A2A",
                fontSize: 17,
                fontFamily: "system-ui",
                fontWeight: 500,
                boxShadow: name ? "0 0 0 3px rgba(191,216,196,0.35)" : "none",
              }}
            />
            {name.length > 0 && (
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(191,216,196,0.5)" }}
              >
                <svg width="14" height="14" fill="none" stroke="#5E7A60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 7 6 11 12 3"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save button */}
        <button
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl transition-opacity"
          style={{
            background: name && hasPhoto
              ? "linear-gradient(135deg, #8B7B5A 0%, #A08B68 100%)"
              : "rgba(200,184,154,0.45)",
            opacity: name && hasPhoto ? 1 : 0.75,
            boxShadow: name && hasPhoto ? "0 6px 20px rgba(139,123,90,0.28)" : "none",
          }}
        >
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l10 10-10 10M22 12H2"/>
          </svg>
          <span style={{ color: "white", fontSize: 16, fontFamily: "system-ui", fontWeight: 700 }}>
            {name && hasPhoto ? `Add ${name} to Kahani` : "Add to Kahani"}
          </span>
        </button>

        {/* Footnote */}
        <p style={{ color: "#B8A882", fontSize: 12, fontFamily: "system-ui", textAlign: "center", lineHeight: 1.5 }}>
          Stories will be personalised for this little one.<br/>You can always edit or remove them later.
        </p>
      </div>
    </div>
  );
}
