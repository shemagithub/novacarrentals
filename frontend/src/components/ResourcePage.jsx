import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api, { formatApiErrorDetail, formatAxiosError, fileImageSrcFromStored } from "@/lib/api";
import { isCmsHtmlContentEmpty, stripAuthQueryFromFileUrlsInHtml } from "@/lib/cmsHtml";
import CmsHtmlBodyEditor from "@/components/cms/CmsHtmlBodyEditor";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { useConfirm } from "@/components/ConfirmProvider";
import { PencilSimple, Trash, MagnifyingGlass, Image as ImageIcon, SpinnerGap, Eye } from "@phosphor-icons/react";
import { toast } from "sonner";

function humanizeKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ViewFieldValue({ item, field }) {
  const v = item[field.key];
  if (v == null || v === "") {
    return <span className="text-neutral-400">—</span>;
  }
  const keyLooksImage =
    field.key &&
    /(?:^|_)(?:image|photo|cover|thumbnail|avatar|logo|picture|gallery)|(?:image|photo|cover|logo|picture)_|_url$/i.test(
      field.key
    );
  if (
    field.type === "imageUpload" ||
    (keyLooksImage && typeof v === "string" && (v.includes("/api/files/") || /^https?:\/\//i.test(v)))
  ) {
    const isLikelyImage =
      field.type === "imageUpload" ||
      /\.(jpe?g|png|gif|webp)(\?|$)/i.test(v) ||
      String(v).includes("/api/files/");
    if (isLikelyImage && typeof v === "string") {
      return (
        <div className="space-y-2">
          <div className="relative max-h-52 max-w-lg overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50">
            <img
              src={fileImageSrcFromStored(v)}
              alt=""
              className="max-h-52 w-full object-contain object-left"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <p className="break-all font-mono text-[11px] text-neutral-600">{String(v)}</p>
        </div>
      );
    }
  }
  if (field.type === "checkbox" || typeof v === "boolean") {
    return <span className="text-sm font-medium text-neutral-900">{v ? "Yes" : "No"}</span>;
  }
  if (field.type === "tags" && Array.isArray(v)) {
    return <span className="text-sm text-neutral-900">{v.length ? v.join(", ") : "—"}</span>;
  }
  if (Array.isArray(v)) {
    return (
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] text-neutral-800">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (typeof v === "object") {
    return (
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] text-neutral-800">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (field.type === "htmlEditor" && typeof v === "string") {
    const s = String(v).trim();
    if (!s) return <span className="text-neutral-400">—</span>;
    if (/<[a-z][\s\S]*>/i.test(s)) {
      return (
        <div
          className="cms-html-preview max-h-[min(70vh,560px)] overflow-y-auto overflow-x-auto rounded-sm border border-neutral-200 bg-white p-4 text-sm leading-relaxed text-neutral-900 [&_a]:text-[#E60000] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-200 [&_blockquote]:pl-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_img]:max-h-64 [&_img]:max-w-full [&_img]:rounded-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: s }}
        />
      );
    }
    return (
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-900">
        {s}
      </div>
    );
  }
  if (field.type === "textarea" || field.full || (typeof v === "string" && v.length > 160)) {
    return (
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-900">
        {String(v)}
      </div>
    );
  }
  return <span className="break-words text-sm text-neutral-900">{String(v)}</span>;
}

function ExtraRecordFields({ item, fieldKeys }) {
  const extras = Object.keys(item)
    .filter((k) => !fieldKeys.has(k))
    .sort();
  if (!extras.length) return null;
  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Additional fields</div>
      <dl className="space-y-4">
        {extras.map((key) => (
          <div key={key}>
            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">{humanizeKey(key)}</dt>
            <dd className="text-sm text-neutral-900">
              {item[key] == null || item[key] === "" ? (
                <span className="text-neutral-400">—</span>
              ) : typeof item[key] === "object" ? (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-neutral-200 bg-neutral-50 p-2 font-mono text-[11px]">
                  {JSON.stringify(item[key], null, 2)}
                </pre>
              ) : (
                <span className="break-words">{String(item[key])}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Generic CRUD resource page.
 * Props:
 *  resource: api segment ("vehicles")
 *  title, description, actionLabel
 *  columns: [{ key, label, render?, isStatus? }]
 *  fields: [{ key, label, type ("text"|"number"|"select"|"textarea"|"htmlEditor"|"checkbox"|"date"|"tags"|"imageUpload"), options?, required?, uploadFolder?, rows? }]
 *  defaults: object of defaults for create
 *  formModalMaxClass: tailwind max-width for form dialog (default max-w-2xl)
 *  formModalZClass: stacking for form overlay (default z-[6000], above layout chrome)
 * Each row includes a View (eye) action: read-only details for all fields plus any extra API keys.
 */
export default function ResourcePage({
  resource,
  title,
  description,
  actionLabel,
  columns,
  fields,
  defaults = {},
  fallbackEmptyFromDefaults = false,
  formModalMaxClass = "max-w-2xl",
  formModalZClass = "z-[6000]",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaults);
  const [uploadingFieldKey, setUploadingFieldKey] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const confirm = useConfirm();

  const fieldKeySet = new Set(fields.map((f) => f.key));

  const fetchItems = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/${resource}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) {
        setItems([]);
        toast.error(formatAxiosError(err));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useAdminBackgroundPoll(() => {
    fetchItems({ silent: true });
  }, [fetchItems]);

  useEffect(() => {
    const modalOpen = showForm || viewingItem;
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showForm, viewingItem]);

  const openCreate = () => {
    setViewingItem(null);
    setEditing(null);
    setForm(defaults);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setViewingItem(null);
    setEditing(item);
    const cleanForm = {};
    fields.forEach((f) => {
      let v = item[f.key] ?? defaults[f.key] ?? "";
      if (fallbackEmptyFromDefaults) {
        const empty =
          v === "" ||
          v === null ||
          v === undefined ||
          (f.type === "tags" && Array.isArray(v) && v.length === 0);
        if (empty && defaults[f.key] != null && defaults[f.key] !== "") {
          v = defaults[f.key];
        }
      }
      if (f.type === "tags" && Array.isArray(v)) v = v.join(", ");
      cleanForm[f.key] = v;
    });
    setForm(cleanForm);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      for (const f of fields) {
        if (f.required && f.type === "htmlEditor" && isCmsHtmlContentEmpty(payload[f.key])) {
          toast.error(`${f.label} is required`);
          return;
        }
      }
      // coerce numbers / tags / images
      fields.forEach((f) => {
        if (f.type === "number") {
          let n = Number(payload[f.key]);
          if (Number.isNaN(n)) n = 0;
          if (f.min != null) n = Math.max(f.min, n);
          if (f.max != null) n = Math.min(f.max, n);
          payload[f.key] = f.integer ? Math.round(n) : n;
        }
        if (f.type === "checkbox") payload[f.key] = !!payload[f.key];
        if (f.type === "tags") {
          payload[f.key] = String(payload[f.key] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (f.type === "imageUpload") {
          const v = payload[f.key];
          payload[f.key] = v == null || String(v).trim() === "" ? null : String(v).trim();
        }
        if (f.type === "htmlEditor" && typeof payload[f.key] === "string") {
          payload[f.key] = stripAuthQueryFromFileUrlsInHtml(payload[f.key]);
        }
      });
      if (editing) {
        await api.put(`/${resource}/${editing.id}`, payload);
        toast.success(`${title} updated`);
      } else {
        await api.post(`/${resource}`, payload);
        toast.success(`${title} created`);
      }
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete this item?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/${resource}/${id}`);
      toast.success("Deleted");
      fetchItems();
    } catch (err) {
      toast.error(formatAxiosError(err) || "Delete failed");
    }
  };

  const filtered = items.filter(i =>
    !search || JSON.stringify(i).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-testid={`${resource}-page`}>
      <PageHeader
        title={title}
        description={description}
        action={openCreate}
        actionLabel={actionLabel || `Add ${title}`}
        actionTestId={`${resource}-add-button`}
      >
        <div className="relative w-full min-w-0 sm:w-auto">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] w-full rounded-sm border border-neutral-300 bg-white py-2 pl-9 pr-4 text-xs focus:border-[#E60000] focus:outline-none sm:min-h-0 sm:w-56"
            data-testid={`${resource}-search`}
          />
        </div>
      </PageHeader>

      <div className="sharp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="whitespace-nowrap px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3">
                    {col.label}
                  </th>
                ))}
                <th className="whitespace-nowrap px-2 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4 sm:py-3 w-[1%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-12 text-xs text-neutral-500 font-mono">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 1}><EmptyState testId={`${resource}-empty`} /></td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors" data-testid={`${resource}-row-${item.id}`}>
                    {columns.map(col => (
                      <td key={col.key} className="px-2 py-2.5 text-xs sm:px-4 sm:py-3">
                        {col.render ? col.render(item) :
                          col.isStatus ? <StatusBadge status={item[col.key]} /> :
                            col.mono ? <span className="font-mono">{item[col.key]}</span> :
                              String(item[col.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-2 py-2.5 text-right sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="flex min-h-[40px] min-w-[40px] items-center justify-center p-1.5 transition-colors hover:bg-neutral-200"
                          title="View details"
                          data-testid={`${resource}-view-${item.id}`}
                        >
                          <Eye size={14} className="text-neutral-700" weight="regular" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="flex min-h-[40px] min-w-[40px] items-center justify-center p-1.5 transition-colors hover:bg-neutral-200"
                          title="Edit"
                          data-testid={`${resource}-edit-${item.id}`}
                        >
                          <PencilSimple size={14} className="text-neutral-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="group flex min-h-[40px] min-w-[40px] items-center justify-center p-1.5 transition-colors hover:bg-red-50"
                          title="Delete"
                          data-testid={`${resource}-delete-${item.id}`}
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

      {/* Form modal: portal + body scroll lock; inner panel scrolls only (long pages / small screens) */}
      {showForm &&
        createPortal(
          <div
            className={[
              "fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-2 pt-4 pb-10 backdrop-blur-[2px] sm:p-4 sm:pt-6 sm:pb-12 md:p-6",
              formModalZClass,
            ].join(" ")}
            data-testid={`${resource}-form-modal`}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${resource}-modal-title`}
              className={[
                "my-1 flex max-h-[calc(100svh-2.5rem)] w-full min-h-0 flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/[0.04] sm:my-2",
                "sm:max-h-[min(92svh,900px)]",
                formModalMaxClass,
              ].join(" ")}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    {editing ? "Editing" : "Create"}
                  </div>
                  <div id={`${resource}-modal-title`} className="font-display text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                    {title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="shrink-0 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 min-h-[44px] sm:min-h-0"
                  data-testid={`${resource}-form-close`}
                >
                  Close
                </button>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                data-testid={`${resource}-form`}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 touch-pan-y sm:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      <span>{f.label}</span>
                      {f.required ? <span className="text-[#E60000]"> *</span> : null}
                    </label>
                    {f.type === "imageUpload" ? (
                      <div className="space-y-3 rounded-sm border border-dashed border-neutral-300 bg-neutral-50/80 p-3 sm:p-4">
                        <div className="flex min-h-[44px] flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-800 shadow-sm transition hover:bg-neutral-50 min-h-[44px] sm:min-h-0">
                            {uploadingFieldKey === f.key ? (
                              <SpinnerGap size={16} className="animate-spin text-[#E60000]" />
                            ) : (
                              <ImageIcon size={16} className="text-neutral-600" />
                            )}
                            <span>{uploadingFieldKey === f.key ? "Uploading…" : "Upload image"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="sr-only"
                              disabled={uploadingFieldKey === f.key}
                              data-testid={`${resource}-field-${f.key}-file`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                setUploadingFieldKey(f.key);
                                try {
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  const folder = encodeURIComponent(f.uploadFolder || "misc");
                                  const { data } = await api.post(`/uploads?folder=${folder}`, fd);
                                  const stored =
                                    data.url || (data.path ? `/api/files/${String(data.path).replace(/^\//, "")}` : "");
                                  setForm((prev) => ({ ...prev, [f.key]: stored }));
                                  toast.success("Image uploaded");
                                } catch (err) {
                                  toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
                                } finally {
                                  setUploadingFieldKey(null);
                                }
                              }}
                            />
                          </label>
                          {(form[f.key] ?? "") !== "" && (
                            <button
                              type="button"
                              className="rounded-sm border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 min-h-[44px] sm:min-h-0"
                              onClick={() => setForm((prev) => ({ ...prev, [f.key]: "" }))}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {/* Fixed preview + URL row height so the dialog does not jump when an image appears */}
                        <div className="flex min-h-[160px] flex-col gap-2 sm:flex-row sm:items-stretch">
                          <div className="relative h-40 w-full max-w-[280px] shrink-0 overflow-hidden rounded-sm border border-neutral-200 bg-white">
                            {form[f.key] ? (
                              <img
                                src={fileImageSrcFromStored(form[f.key])}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(ev) => {
                                  ev.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-100/90 text-neutral-400">
                                <ImageIcon size={28} weight="duotone" className="opacity-60" />
                                <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                  Preview
                                </span>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={form[f.key] ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder="/api/files/… or paste image URL"
                            className="min-h-[44px] min-w-0 flex-1 self-stretch border border-neutral-300 bg-white px-3 py-2 font-mono text-[11px] text-neutral-700 focus:border-[#E60000] focus:outline-none rounded-sm sm:min-h-0"
                            data-testid={`${resource}-field-${f.key}`}
                          />
                        </div>
                        <p className="text-[11px] leading-relaxed text-neutral-500">
                          JPEG, PNG, WebP or GIF — max 10 MB. Upload fills the field below; you can also paste a URL. Save the form to store it on the record.
                        </p>
                      </div>
                    ) : f.type === "select" ? (
                      <select
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
                        required={f.required}
                        data-testid={`${resource}-field-${f.key}`}
                      >
                        <option value="">Select...</option>
                        {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        rows={f.rows ?? 4}
                        className="w-full min-h-[6rem] resize-y bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
                        required={f.required}
                        data-testid={`${resource}-field-${f.key}`}
                      />
                    ) : f.type === "htmlEditor" ? (
                      <CmsHtmlBodyEditor
                        value={form[f.key] ?? ""}
                        onChange={(html) => setForm((prev) => ({ ...prev, [f.key]: html }))}
                        placeholder={f.placeholder || "Write article body…"}
                        disabled={false}
                        testId={`${resource}-field-${f.key}`}
                        imageUploadFolder={f.uploadFolder || null}
                      />
                    ) : f.type === "checkbox" ? (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          checked={!!form[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                          className="accent-[#E60000]"
                          data-testid={`${resource}-field-${f.key}`}
                        />
                        <span className="text-xs text-neutral-700">{f.checkboxLabel || f.label}</span>
                      </div>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        min={f.type === "number" && f.min != null ? f.min : undefined}
                        max={f.type === "number" && f.max != null ? f.max : undefined}
                        step={f.type === "number" && f.step != null ? f.step : undefined}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
                        required={f.required}
                        data-testid={`${resource}-field-${f.key}`}
                      />
                    )}
                  </div>
                ))}
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="min-h-[44px] rounded-sm border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 sm:min-h-0"
                  data-testid={`${resource}-form-cancel`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-sm bg-[#E60000] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#CC0000] sm:min-h-0"
                  data-testid={`${resource}-form-submit`}
                >
                  {editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
            </div>
          </div>,
          document.body
        )}

      {viewingItem &&
        createPortal(
          <div
            className={[
              "fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-2 pt-4 pb-10 backdrop-blur-[2px] sm:p-4 sm:pt-6 sm:pb-12 md:p-6",
              formModalZClass,
            ].join(" ")}
            data-testid={`${resource}-view-modal`}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${resource}-view-modal-title`}
              className={[
                "my-1 flex max-h-[calc(100svh-2.5rem)] w-full min-h-0 flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/[0.04] sm:my-2",
                "sm:max-h-[min(92svh,900px)]",
                formModalMaxClass,
              ].join(" ")}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Details</div>
                  <div id={`${resource}-view-modal-title`} className="font-display text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                    {title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="shrink-0 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 min-h-[44px] sm:min-h-0"
                  data-testid={`${resource}-view-close`}
                >
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 touch-pan-y sm:p-6">
                <dl className="space-y-5">
                  {fields.map((f) => (
                    <div key={f.key}>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">{f.label}</dt>
                      <dd>
                        <ViewFieldValue item={viewingItem} field={f} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <ExtraRecordFields item={viewingItem} fieldKeys={fieldKeySet} />
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="min-h-[44px] rounded-sm border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 sm:min-h-0"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(viewingItem)}
                  className="min-h-[44px] rounded-sm bg-[#E60000] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#CC0000] sm:min-h-0"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
