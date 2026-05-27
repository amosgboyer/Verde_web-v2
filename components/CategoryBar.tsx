"use client";

const CATS = [
  { label: "Verde y Solo Verde", id: "cat-verde" },
  { label: "Para los amantes del Maduro", id: "cat-maduro" },
  { label: "Otros productos", id: "cat-otros" },
];

export default function CategoryBar() {
  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 58 + 46 + 16; // nav + category bar + margen
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <div
      className="sticky z-40 border-b overflow-x-auto flex whitespace-nowrap"
      style={{
        top: "60px",
        background: "rgba(242,234,216,0.97)",
        backdropFilter: "blur(10px)",
        borderColor: "rgba(44,90,27,0.13)",
        scrollbarWidth: "none",
      }}
    >
      {CATS.map((cat) => (
        <button
          key={cat.id}
          onClick={() => goTo(cat.id)}
          className="px-4 py-3 text-xs font-medium border-b-2 border-transparent transition-colors duration-200 shrink-0"
          style={{ color: "#6e6e5a", fontFamily: "inherit" }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = "#2d5a1b";
            (e.target as HTMLButtonElement).style.borderBottomColor = "#4a7c2f";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color = "#6e6e5a";
            (e.target as HTMLButtonElement).style.borderBottomColor = "transparent";
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
