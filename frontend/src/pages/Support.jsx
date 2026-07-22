import { useState } from "react";
import Tickets from "./Tickets";
import Blogs from "./Blogs";
import { ChatCircle, Newspaper } from "@phosphor-icons/react";

export default function Support() {
  const [tab, setTab] = useState("tickets");
  return (
    <div data-testid="support-page">
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-neutral-200 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setTab("tickets")}
          className={`flex min-h-[44px] shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider sm:px-4 ${tab === "tickets" ? "border-[#E60000] text-[#E60000]" : "border-transparent text-neutral-500"}`}
          data-testid="tab-tickets"
        >
          <ChatCircle size={14} /> Support Tickets
        </button>
        <button
          type="button"
          onClick={() => setTab("blogs")}
          className={`flex min-h-[44px] shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider sm:px-4 ${tab === "blogs" ? "border-[#E60000] text-[#E60000]" : "border-transparent text-neutral-500"}`}
          data-testid="tab-blogs"
        >
          <Newspaper size={14} /> Blog Posts
        </button>
      </div>
      {tab === "tickets" ? <Tickets /> : <Blogs />}
    </div>
  );
}
