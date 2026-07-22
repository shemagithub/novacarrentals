import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api, { formatAxiosError } from "@/lib/api";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { useConfirm } from "@/components/ConfirmProvider";
import { Eye, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

const RESOURCE = "contact-messages";

export default function ContactSubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const confirm = useConfirm();

  const fetchItems = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/${RESOURCE}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) {
        setItems([]);
        toast.error(formatAxiosError(err));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useAdminBackgroundPoll(() => {
    fetchItems({ silent: true });
  }, [fetchItems]);

  useEffect(() => {
    if (!viewing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewing]);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete this message?",
      message: "This contact submission will be permanently removed.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/${RESOURCE}/${encodeURIComponent(id)}`);
      toast.success("Message deleted");
      setViewing((v) => (v && v.id === id ? null : v));
      fetchItems();
    } catch (err) {
      toast.error(formatAxiosError(err));
    }
  };

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(i.name || "")
        .toLowerCase()
        .includes(q) ||
      String(i.email || "")
        .toLowerCase()
        .includes(q) ||
      String(i.subject || "")
        .toLowerCase()
        .includes(q) ||
      String(i.message || "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <div data-testid="contact-submissions-page">
      <PageHeader
        title="Contacts"
        description="Messages sent from the marketing site contact form (name, email, subject, message). View details or remove entries."
      >
        <div className="relative w-full min-w-0 sm:w-auto">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] w-full rounded-sm border border-neutral-300 bg-white py-2 pl-9 pr-4 text-xs focus:border-[#E60000] focus:outline-none sm:min-h-0 sm:w-56"
            data-testid="contact-messages-search"
          />
        </div>
      </PageHeader>

      <div className="sharp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="whitespace-nowrap px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3">
                  Date
                </th>
                <th className="whitespace-nowrap px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3">
                  Name
                </th>
                <th className="whitespace-nowrap px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3">
                  Email
                </th>
                <th className="whitespace-nowrap px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3">
                  Subject
                </th>
                <th className="w-[1%] whitespace-nowrap px-2 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center font-mono text-xs text-neutral-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      message={items.length === 0 ? "No contact messages yet" : "No matches"}
                      testId="contact-messages-empty"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                    data-testid={`contact-messages-row-${row.id}`}
                  >
                    <td className="whitespace-nowrap px-2 py-2.5 font-mono text-[11px] text-neutral-700 sm:px-4 sm:py-3">
                      {(row.created_at || "").slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="max-w-[10rem] truncate px-2 py-2.5 text-xs text-neutral-900 sm:max-w-xs sm:px-4 sm:py-3">
                      {row.name || "—"}
                    </td>
                    <td className="max-w-[12rem] truncate px-2 py-2.5 font-mono text-[11px] text-neutral-800 sm:max-w-md sm:px-4 sm:py-3">
                      {row.email || "—"}
                    </td>
                    <td className="max-w-[min(20rem,40vw)] truncate px-2 py-2.5 text-xs text-neutral-800 sm:px-4 sm:py-3">
                      {row.subject || "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(row)}
                          className="flex min-h-[40px] min-w-[40px] items-center justify-center p-1.5 transition-colors hover:bg-neutral-200"
                          title="View message"
                          data-testid={`contact-messages-view-${row.id}`}
                        >
                          <Eye size={14} className="text-neutral-700" weight="regular" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="group flex min-h-[40px] min-w-[40px] items-center justify-center p-1.5 transition-colors hover:bg-red-50"
                          title="Delete"
                          data-testid={`contact-messages-delete-${row.id}`}
                        >
                          <Trash size={14} className="text-neutral-700 group-hover:text-[#E60000]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing &&
        createPortal(
          <div
            className="fixed inset-0 z-[6000] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-2 pt-4 pb-10 backdrop-blur-[2px] sm:p-4 sm:pt-6 sm:pb-12 md:p-6"
            data-testid="contact-messages-view-modal"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-view-title"
              className="my-1 flex max-h-[calc(100svh-2.5rem)] w-full min-h-0 max-w-2xl flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/[0.04] sm:my-2 sm:max-h-[min(92svh,900px)]"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Message</div>
                  <div id="contact-view-title" className="font-display text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                    {viewing.subject || "Contact"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className="min-h-[44px] shrink-0 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 sm:min-h-0"
                  data-testid="contact-messages-view-close"
                >
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 touch-pan-y sm:p-6">
                <dl className="space-y-5">
                  <div>
                    <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Received</dt>
                    <dd className="font-mono text-sm text-neutral-900">
                      {(viewing.created_at || "—").replace("T", " ").slice(0, 19)}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Name</dt>
                    <dd className="text-sm text-neutral-900">{viewing.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Email</dt>
                    <dd className="break-all text-sm text-neutral-900">
                      {viewing.email ? (
                        <a className="text-[#E60000] underline-offset-2 hover:underline" href={`mailto:${viewing.email}`}>
                          {viewing.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Subject</dt>
                    <dd className="text-sm text-neutral-900">{viewing.subject || "—"}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Message</dt>
                    <dd className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-900">
                      {viewing.message || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className="min-h-[44px] rounded-sm border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 sm:min-h-0"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(viewing.id)}
                  className="min-h-[44px] rounded-sm bg-[#E60000] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#CC0000] sm:min-h-0"
                  data-testid="contact-messages-view-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
