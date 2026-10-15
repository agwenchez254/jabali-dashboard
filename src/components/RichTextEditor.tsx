import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { AlignCenter, AlignLeft, AlignRight, Bold, Code, Heading2, Heading3, Heading4, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Smile, Strikethrough, Underline, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadMediaMutation } from "@/api/operations";
import { errorMessage } from "@/api/baseApi";
import type { PostDoc } from "@/api/blog";

const EMOJI = [
  "😀", "😄", "😁", "😂", "🥹", "😊", "😍", "🤩", "😎", "🤗", "🤔", "😴", "😅", "🙌", "👏", "🙏",
  "👍", "👌", "✌️", "💪", "🔥", "✨", "🎉", "🎁", "💯", "❤️", "💚", "💙", "🖤", "🤍", "⭐", "🌟",
  "👕", "👔", "👗", "👠", "👟", "👞", "🧥", "👜", "🕶️", "⌚", "💍", "🛍️", "🛒", "🚚", "📦", "💳",
  "📱", "☀️", "🌍", "🇰🇪", "🌿", "🌸", "☕", "🍽️", "🎶", "📸", "📍", "✅", "⚡", "🆕", "💡", "👀",
];

interface Props {
  value: PostDoc | undefined;
  onChange: (doc: PostDoc) => void;
  disabled?: boolean;
}

function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} size="icon" className="size-8" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

/** Rich-text editor for blog posts. Headings, lists, quotes, links, images, alignment and emoji; the value is the editor's JSON document. */
export function RichTextEditor({ value, onChange, disabled }: Props) {
  const [upload, { isLoading: uploading }] = useUploadMediaMutation();
  const file = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<"" | "emoji" | "link" | "image">("");
  const [url, setUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow" } } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Write your story. Add headings, images and emoji from the toolbar." }),
    ],
    content: value && Object.keys(value).length ? value : undefined,
    editable: !disabled,
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as PostDoc),
    editorProps: { attributes: { class: "min-h-[320px] px-4 py-3 outline-none [&_p]:my-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:underline [&_img]:my-4 [&_img]:max-w-full [&_hr]:my-6 [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_.is-editor-empty]:before:pointer-events-none" } },
  });

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: !!e?.isActive("bold"),
      italic: !!e?.isActive("italic"),
      underline: !!e?.isActive("underline"),
      strike: !!e?.isActive("strike"),
      code: !!e?.isActive("code"),
      h2: !!e?.isActive("heading", { level: 2 }),
      h3: !!e?.isActive("heading", { level: 3 }),
      h4: !!e?.isActive("heading", { level: 4 }),
      bullet: !!e?.isActive("bulletList"),
      ordered: !!e?.isActive("orderedList"),
      quote: !!e?.isActive("blockquote"),
      link: !!e?.isActive("link"),
      left: !!e?.isActive({ textAlign: "left" }),
      center: !!e?.isActive({ textAlign: "center" }),
      right: !!e?.isActive({ textAlign: "right" }),
      canUndo: !!e?.can().undo(),
      canRedo: !!e?.can().redo(),
    }),
  });

  if (!editor || !s) return <div className="h-[380px] animate-pulse rounded-md border bg-muted/40" />;
  const e: Editor = editor;
  const run = () => e.chain().focus();

  const onFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    try {
      const m = await upload({ file: f, alt: f.name.replace(/\.[^.]+$/, "") }).unwrap();
      run().setImage({ src: m.url, alt: m.alt ?? "" }).run();
      setPanel("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  const applyLink = () => {
    const href = url.trim();
    if (!href) run().unsetLink().run();
    else if (/^(https?:\/\/|\/)/i.test(href)) run().extendMarkRange("link").setLink({ href }).run();
    else return toast.error("Links must start with https:// or /");
    setPanel("");
    setUrl("");
  };

  const applyImageUrl = () => {
    const src = url.trim();
    if (!/^https?:\/\//i.test(src)) return toast.error("Image addresses must start with https://");
    run().setImage({ src }).run();
    setPanel("");
    setUrl("");
  };

  return (
    <div className="rounded-md border bg-background">
      {!disabled && (
        <div className="relative flex flex-wrap items-center gap-0.5 border-b p-1" role="toolbar" aria-label="Formatting">
          <Tool label="Heading" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}><Heading2 /></Tool>
          <Tool label="Subheading" active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()}><Heading3 /></Tool>
          <Tool label="Small heading" active={s.h4} onClick={() => run().toggleHeading({ level: 4 }).run()}><Heading4 /></Tool>
          <span className="mx-1 h-5 w-px bg-border" />
          <Tool label="Bold" active={s.bold} onClick={() => run().toggleBold().run()}><Bold /></Tool>
          <Tool label="Italic" active={s.italic} onClick={() => run().toggleItalic().run()}><Italic /></Tool>
          <Tool label="Underline" active={s.underline} onClick={() => run().toggleUnderline().run()}><Underline /></Tool>
          <Tool label="Strikethrough" active={s.strike} onClick={() => run().toggleStrike().run()}><Strikethrough /></Tool>
          <Tool label="Code" active={s.code} onClick={() => run().toggleCode().run()}><Code /></Tool>
          <span className="mx-1 h-5 w-px bg-border" />
          <Tool label="Bulleted list" active={s.bullet} onClick={() => run().toggleBulletList().run()}><List /></Tool>
          <Tool label="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}><ListOrdered /></Tool>
          <Tool label="Quote" active={s.quote} onClick={() => run().toggleBlockquote().run()}><Quote /></Tool>
          <Tool label="Divider" onClick={() => run().setHorizontalRule().run()}><Minus /></Tool>
          <span className="mx-1 h-5 w-px bg-border" />
          <Tool label="Align left" active={s.left} onClick={() => run().setTextAlign("left").run()}><AlignLeft /></Tool>
          <Tool label="Align centre" active={s.center} onClick={() => run().setTextAlign("center").run()}><AlignCenter /></Tool>
          <Tool label="Align right" active={s.right} onClick={() => run().setTextAlign("right").run()}><AlignRight /></Tool>
          <span className="mx-1 h-5 w-px bg-border" />
          <Tool label="Link" active={s.link || panel === "link"} onClick={() => { setUrl(e.getAttributes("link").href ?? ""); setPanel(panel === "link" ? "" : "link"); }}><Link2 /></Tool>
          <Tool label="Image" active={panel === "image"} onClick={() => { setUrl(""); setPanel(panel === "image" ? "" : "image"); }}><ImagePlus /></Tool>
          <Tool label="Emoji" active={panel === "emoji"} onClick={() => setPanel(panel === "emoji" ? "" : "emoji")}><Smile /></Tool>
          <span className="mx-1 h-5 w-px bg-border" />
          <Tool label="Undo" disabled={!s.canUndo} onClick={() => run().undo().run()}><Undo2 /></Tool>
          <Tool label="Redo" disabled={!s.canRedo} onClick={() => run().redo().run()}><Redo2 /></Tool>
          <input ref={file} type="file" accept="image/*" hidden onChange={(ev) => void onFile(ev.target.files)} />
        </div>
      )}

      {panel === "emoji" && (
        <div className="grid grid-cols-8 gap-1 border-b p-2 sm:grid-cols-16" role="group" aria-label="Emoji">
          {EMOJI.map((em) => (
            <button key={em} type="button" className="grid size-8 place-items-center rounded text-xl hover:bg-muted" onClick={() => run().insertContent(em).run()} aria-label={`Insert ${em}`}>
              {em}
            </button>
          ))}
          <p className="col-span-full pt-1 text-xs text-muted-foreground">You can also type or paste any emoji straight into the text.</p>
        </div>
      )}
      {panel === "link" && (
        <div className="flex flex-wrap items-center gap-2 border-b p-2">
          <Input className="h-8 min-w-48 flex-1" autoFocus placeholder="https://... or /shop" value={url} onChange={(ev) => setUrl(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && (ev.preventDefault(), applyLink())} aria-label="Link address" />
          <Button type="button" size="sm" onClick={applyLink}>{url.trim() ? "Apply link" : "Remove link"}</Button>
        </div>
      )}
      {panel === "image" && (
        <div className="flex flex-wrap items-center gap-2 border-b p-2">
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => file.current?.click()}>{uploading ? "Uploading..." : "Upload from computer"}</Button>
          <span className="text-xs text-muted-foreground">or</span>
          <Input className="h-8 min-w-48 flex-1" placeholder="Image address (https://...)" value={url} onChange={(ev) => setUrl(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && (ev.preventDefault(), applyImageUrl())} aria-label="Image address" />
          <Button type="button" size="sm" onClick={applyImageUrl}>Insert</Button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
