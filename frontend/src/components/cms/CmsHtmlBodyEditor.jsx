import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Link2,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Code,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isCmsHtmlContentEmpty } from "@/lib/cmsHtml";
import api, { fileImageSrcFromStored, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

function shouldSyncExternalIntoEditor(editorHtml, externalHtml) {
  if (editorHtml === externalHtml) return false;
  if (isCmsHtmlContentEmpty(editorHtml) && isCmsHtmlContentEmpty(externalHtml))
    return false;
  return true;
}

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-neutral-700 transition-colors",
        active
          ? "border-[#E60000] bg-red-50 text-[#E60000]"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Rich HTML body for CMS / blog — output is HTML for `content` fields.
 * @param {string} [imageUploadFolder] — When set (e.g. `blogs`), toolbar offers image upload to `/api/uploads`.
 */
export default function CmsHtmlBodyEditor({
  value,
  onChange,
  placeholder = "Write page content…",
  disabled = false,
  testId = "cms-html-body",
  imageUploadFolder = null,
}) {
  const onChangeRef = useRef(onChange);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
          HTMLAttributes: {
            class: "max-w-full h-auto rounded-sm border border-neutral-200",
          },
        }),
        Placeholder.configure({ placeholder }),
      ],
      content: value ?? "",
      editable: !disabled,
      shouldRerenderOnTransaction: true,
      editorProps: {
        attributes: {
          class:
            "min-h-[280px] px-3 py-2 text-sm leading-relaxed text-neutral-900 focus:outline-none [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-700 [&_a]:text-[#E60000] [&_a]:underline [&_p]:my-2 [&_hr]:my-4 [&_img]:max-w-full [&_img]:h-auto",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChangeRef.current(ed.getHTML());
      },
    },
    [],
  );

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const external = value ?? "";
    const current = editor.getHTML();
    if (!shouldSyncExternalIntoEditor(current, external)) return;
    editor.commands.setContent(external, { emitUpdate: false });
  }, [editor, value]);

  const triggerImageUpload = () => {
    if (!imageUploadFolder || disabled || uploadingImage) return;
    fileInputRef.current?.click();
  };

  const onImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const folder = encodeURIComponent(imageUploadFolder || "misc");
      const { data } = await api.post(`/uploads?folder=${folder}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const stored =
        data.url ||
        (data.path ? `/api/files/${String(data.path).replace(/^\//, "")}` : "");
      if (!stored) {
        toast.error("Upload did not return a file URL");
        return;
      }
      const displaySrc = fileImageSrcFromStored(stored);
      editor.chain().focus().setImage({ src: displaySrc, alt: file.name || "Image" }).run();
      toast.success("Image inserted");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  if (!editor) {
    return (
      <div
        className="min-h-[320px] w-full animate-pulse rounded-sm border border-neutral-200 bg-neutral-50"
        data-testid={`${testId}-skeleton`}
      />
    );
  }

  const runLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-sm border border-neutral-300 bg-white focus-within:border-[#E60000]",
        disabled && "pointer-events-none opacity-60",
      )}
      data-testid={testId}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onImageFileChange}
      />
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <span className="mx-0.5 h-6 w-px bg-neutral-200" aria-hidden />
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <span className="mx-0.5 h-6 w-px bg-neutral-200" aria-hidden />
        <ToolbarButton
          title="Link"
          active={editor.isActive("link")}
          onClick={runLink}
        >
          <Link2 size={15} strokeWidth={2.25} />
        </ToolbarButton>
        {imageUploadFolder ? (
          <ToolbarButton
            title="Insert image from file"
            active={false}
            disabled={uploadingImage}
            onClick={triggerImageUpload}
          >
            <ImagePlus size={15} strokeWidth={2.25} className={uploadingImage ? "animate-pulse" : ""} />
          </ToolbarButton>
        ) : null}
        <span className="mx-0.5 h-6 w-px bg-neutral-200" aria-hidden />
        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={15} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={15} strokeWidth={2.25} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
