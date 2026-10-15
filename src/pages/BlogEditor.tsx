import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useCreatePostMutation, useGetPostQuery, usePublishPostMutation, useUnpublishPostMutation, useUpdatePostMutation, type PostDoc } from "@/api/blog";
import { useUploadMediaMutation } from "@/api/operations";
import { errorMessage } from "@/api/baseApi";
import { useCan } from "@/store/hooks";
import { PageHeader, StatusBadge } from "@/components/shared";

const STORE_URL = (import.meta.env.VITE_STOREFRONT_URL as string | undefined) ?? "http://localhost:5173";

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const canWrite = useCan("blog:write");
  const canPublish = useCan("blog:publish");
  const { data: post, isLoading } = useGetPostQuery(id!, { skip: isNew });
  const [create, { isLoading: creating }] = useCreatePostMutation();
  const [update, { isLoading: saving }] = useUpdatePostMutation();
  const [publish, { isLoading: publishing }] = usePublishPostMutation();
  const [unpublish] = useUnpublishPostMutation();
  const [upload, { isLoading: uploading }] = useUploadMediaMutation();
  const cover = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState<PostDoc | undefined>(undefined);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Fill the form once when the post arrives. Later refetches (after a save) must not overwrite what is being typed.
  useEffect(() => {
    if (!post || loadedId === post.id) return;
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setCoverUrl(post.coverUrl ?? "");
    setContent(post.content);
    setLoadedId(post.id);
  }, [post, loadedId]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (ev: BeforeUnloadEvent) => ev.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!isNew && (isLoading || !post || loadedId !== post.id)) return <Skeleton className="h-96" />;

  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
  };

  const save = async (): Promise<string | undefined> => {
    if (!title.trim()) {
      toast.error("Add a title first.");
      return undefined;
    }
    try {
      if (isNew) {
        const created = await create({ title, ...(slug && { slug }), excerpt, ...(coverUrl && { coverUrl }), ...(content && { content }) }).unwrap();
        toast.success("Draft saved");
        setDirty(false);
        navigate(`/blog/${created.id}`, { replace: true });
        return created.id;
      }
      await update({ id: id!, body: { title, slug, excerpt, coverUrl, ...(content && { content }) } }).unwrap();
      toast.success("Saved");
      setDirty(false);
      return id;
    } catch (e) {
      toast.error(errorMessage(e));
      return undefined;
    }
  };

  const onPublish = async () => {
    const pid = await save();
    if (!pid) return;
    try {
      await publish(pid).unwrap();
      toast.success("Published");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onCover = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    try {
      const m = await upload({ file: f, alt: title || f.name }).unwrap();
      touch(setCoverUrl)(m.url);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      if (cover.current) cover.current.value = "";
    }
  };

  const busy = creating || saving || publishing;
  const published = post?.status === "published";

  return (
    <>
      <div className="mb-2">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All posts</Link>
      </div>
      <PageHeader title={isNew ? "New post" : "Edit post"} description={isNew ? "Write it, save a draft, publish when it is ready." : undefined}>
        {post && <StatusBadge value={post.status} />}
        {published && (
          <Button variant="outline" asChild>
            <a href={`${STORE_URL}/blog/${post.slug}`} target="_blank" rel="noreferrer"><ExternalLink /> View</a>
          </Button>
        )}
        {canWrite && <Button variant="outline" onClick={() => void save()} disabled={busy}>{busy && !publishing ? "Saving..." : "Save draft"}</Button>}
        {canPublish && (published ? (
          <Button variant="outline" onClick={() => void unpublish(id!).unwrap().then(() => toast.success("Moved back to drafts")).catch((e) => toast.error(errorMessage(e)))}>Unpublish</Button>
        ) : (
          <Button onClick={() => void onPublish()} disabled={busy}>{publishing ? "Publishing..." : "Publish"}</Button>
        ))}
        {canPublish && published && <Button onClick={() => void save()} disabled={busy}>Update live post</Button>}
      </PageHeader>

      <div className="grid max-w-4xl gap-5">
        <div className="space-y-2">
          <Label htmlFor="post-title">Title</Label>
          <Input id="post-title" className="h-12 text-xl font-semibold" placeholder="A headline people want to read" maxLength={160} value={title} readOnly={!canWrite} onChange={(e) => touch(setTitle)(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Cover image</Label>
          {coverUrl ? (
            <div className="relative w-full max-w-md overflow-hidden rounded-lg border">
              <img src={coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />
              {canWrite && <Button type="button" variant="secondary" size="icon" className="absolute right-2 top-2 size-8" aria-label="Remove cover image" onClick={() => touch(setCoverUrl)("")}><X /></Button>}
            </div>
          ) : (
            canWrite && (
              <div>
                <input ref={cover} type="file" accept="image/*" hidden onChange={(e) => void onCover(e.target.files)} />
                <Button type="button" variant="outline" disabled={uploading} onClick={() => cover.current?.click()}><ImagePlus /> {uploading ? "Uploading..." : "Add cover image"}</Button>
              </div>
            )
          )}
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <RichTextEditor value={content} onChange={(d) => { setContent(d); setDirty(true); }} disabled={!canWrite} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="post-excerpt">Summary</Label>
            <Textarea id="post-excerpt" rows={2} maxLength={300} placeholder="Shown on the journal page. Leave empty to use the start of the post." value={excerpt} readOnly={!canWrite} onChange={(e) => touch(setExcerpt)(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-slug">Address</Label>
            <Input id="post-slug" placeholder="made-from-the-title" value={slug} readOnly={!canWrite} onChange={(e) => touch(setSlug)(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} />
            <p className="text-xs text-muted-foreground">{STORE_URL}/blog/{slug || "..."}</p>
          </div>
        </div>
      </div>
    </>
  );
}
