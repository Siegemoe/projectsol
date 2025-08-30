import SolChat from "@/components/SolChat";

export default function ChatPage() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950">
      {/* background art to match home aesthetics */}
      <div className="pointer-events-none absolute inset-0">
        <img src="/hero-grid.svg?v=1" alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/40 to-neutral-950/80" />
      </div>

      {/* content */}
      <div className="relative px-2 py-2 sm:px-4 sm:py-4">
        {/* Constrain height so it fits within our layout's container */}
        <div className="h-[70vh]">
          <SolChat title="Sol" apiPath="/api/chat" />
        </div>
      </div>
    </div>
  );
}
