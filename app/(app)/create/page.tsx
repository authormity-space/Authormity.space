'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Copy, Check, RotateCcw, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostSummary {
    id: string;
    content: string;
    status: string;
    createdAt: string;
}

interface PostsApiResponse {
    posts: PostSummary[];
}

interface GenerateApiResponse {
    postId: string;
    content: string;
    wordCount: number;
    error?: string;
}

interface SaveApiResponse {
    postId: string;
    content: string;
}

interface PublishApiResponse {
    success: boolean;
    linkedinPostId?: string;
    error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LENGTH_OPTIONS = ['short', 'medium', 'long'] as const;
type LengthOption = (typeof LENGTH_OPTIONS)[number];

const TONE_OPTIONS = [
    { value: 'auto', label: 'Auto (voice profile)' },
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'storytelling', label: 'Storytelling' },
    { value: 'bold', label: 'Bold' },
    { value: 'humorous', label: 'Humorous' },
] as const;

const MAX_CHARS = 3000;

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

let toastId = 0;

function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    }, []);

    return { toasts, addToast };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'rounded-md px-4 py-3 text-sm text-white shadow-lg transition-all',
                        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    )}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * Create Post page — the core AI content generation interface.
 *
 * Desktop: Two-column layout (input panel left, output panel right).
 * Mobile: Single column, stacked vertically.
 *
 * Features:
 * - Topic textarea + length/tone selectors
 * - AI generation with loading state
 * - Editable output with word/char counts
 * - Copy, Save Draft, Regenerate, and Publish to LinkedIn actions
 * - Publish confirmation modal
 * - Last 5 drafts loaded on mount as clickable history cards
 * - swipeRef query param support (shows banner when active)
 */
export default function CreatePage() {
    const searchParams = useSearchParams();
    const swipeRef = searchParams.get('swipeRef') ?? '';

    const { toasts, addToast } = useToast();

    // Input state
    const [topic, setTopic] = useState('');
    const [length, setLength] = useState<LengthOption>('medium');
    const [tone, setTone] = useState('auto');

    // Output state
    const [generatedPost, setGeneratedPost] = useState('');
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Action state
    const [isCopied, setIsCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);

    // History
    const [postHistory, setPostHistory] = useState<PostSummary[]>([]);

    const wordCount = generatedPost.trim() ? generatedPost.trim().split(/\s+/).length : 0;
    const charCount = generatedPost.length;

    // Fetch last 5 posts on mount
    useEffect(() => {
        fetch('/api/posts')
            .then((r) => r.json())
            .then((data: PostsApiResponse) => {
                if (data.posts) setPostHistory(data.posts.slice(0, 5));
            })
            .catch(() => {/* silently fail */ });
    }, []);

    // ── Generate ──────────────────────────────────────────────────────────────

    const handleGenerate = useCallback(async () => {
        if (!topic.trim() || topic.trim().length < 3) {
            addToast('Please enter a topic (at least 3 characters).', 'error');
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic.trim(),
                    length,
                    tone: tone === 'auto' ? undefined : tone,
                    swipeRef: swipeRef || undefined,
                }),
            });

            const data = (await res.json()) as GenerateApiResponse;

            if (!res.ok) {
                addToast(data.error ?? 'Generation failed. Please try again.', 'error');
                return;
            }

            setGeneratedPost(data.content);
            setCurrentPostId(data.postId);

            // Prepend to history
            setPostHistory((prev) => [
                {
                    id: data.postId,
                    content: data.content,
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 4),
            ]);
        } catch {
            addToast('Generation failed. Please try again.', 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [topic, length, tone, swipeRef, addToast]);

    // ── Copy ──────────────────────────────────────────────────────────────────

    const handleCopy = useCallback(async () => {
        if (!generatedPost) return;
        await navigator.clipboard.writeText(generatedPost);
        setIsCopied(true);
        addToast('Copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
    }, [generatedPost, addToast]);

    // ── Save Draft ────────────────────────────────────────────────────────────

    const handleSaveDraft = useCallback(async () => {
        if (!generatedPost.trim()) return;
        setIsSaving(true);

        try {
            let res: Response;
            if (currentPostId) {
                // Update existing post
                res = await fetch(`/api/posts/${currentPostId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: generatedPost }),
                });
            } else {
                // Create new post
                res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: generatedPost }),
                });
                const data = (await res.json()) as SaveApiResponse;
                if (res.ok) setCurrentPostId(data.postId);
            }

            if (res.ok) {
                addToast('Draft saved!');
            } else {
                addToast('Failed to save draft.', 'error');
            }
        } catch {
            addToast('Failed to save draft.', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [generatedPost, currentPostId, addToast]);

    // ── Publish ───────────────────────────────────────────────────────────────

    const handlePublish = useCallback(async () => {
        if (!currentPostId) {
            addToast('Please save the post first.', 'error');
            return;
        }

        setIsPublishing(true);
        try {
            const res = await fetch('/api/linkedin/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: currentPostId }),
            });

            const data = (await res.json()) as PublishApiResponse;

            if (res.ok) {
                addToast('Published to LinkedIn! 🎉');
                setShowPublishModal(false);
            } else {
                addToast(data.error ?? 'Failed to publish. Please try again.', 'error');
            }
        } catch {
            addToast('Failed to publish. Please try again.', 'error');
        } finally {
            setIsPublishing(false);
        }
    }, [currentPostId, addToast]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <ToastContainer toasts={toasts} />

            <ConfirmationModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onConfirm={handlePublish}
                title="Publish to LinkedIn"
                description="This will post directly to your LinkedIn profile. Ready to go live?"
                confirmLabel="Publish Now"
                isLoading={isPublishing}
            />

            <div className="space-y-6">
                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Post</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Generate AI-powered LinkedIn posts in your voice.
                    </p>
                </div>

                {/* Swipe ref banner */}
                {swipeRef && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <span className="font-medium">Using swipe file as reference</span> — the AI will match the hook type and structure of the saved post.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* ── LEFT: Input Panel ─────────────────────────────────────── */}
                    <div className="space-y-5 rounded-lg border border-border p-5">
                        {/* Topic */}
                        <div className="space-y-2">
                            <label htmlFor="topic" className="text-sm font-medium">
                                What do you want to write about?
                            </label>
                            <textarea
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. The biggest mistake I made in my first year of freelancing"
                                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                style={{ minHeight: '120px' }}
                                maxLength={500}
                            />
                            <p className="text-right text-xs text-muted-foreground">{topic.length}/500</p>
                        </div>

                        {/* Length selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Length</label>
                            <div className="flex gap-2">
                                {LENGTH_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setLength(opt)}
                                        className={cn(
                                            'flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors',
                                            length === opt
                                                ? 'border-[#0A66C2] bg-[#0A66C2] text-white'
                                                : 'border-border text-muted-foreground hover:border-[#0A66C2] hover:text-foreground'
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tone selector */}
                        <div className="space-y-2">
                            <label htmlFor="tone" className="text-sm font-medium">
                                Tone <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <select
                                id="tone"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {TONE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Generate button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic.trim()}
                            className="w-full bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-60"
                            size="lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating…
                                </>
                            ) : (
                                'Generate Post'
                            )}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                            20 generations remaining this hour
                        </p>
                    </div>

                    {/* ── RIGHT: Output Panel ───────────────────────────────────── */}
                    <div className="space-y-4 rounded-lg border border-border p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Generated Post</span>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <span
                                    className={cn(
                                        wordCount > 0 ? 'text-foreground' : ''
                                    )}
                                >
                                    {wordCount} words
                                </span>
                                <span>·</span>
                                <span className={cn(charCount > MAX_CHARS ? 'text-red-500 font-medium' : '')}>
                                    {charCount}/{MAX_CHARS}
                                </span>
                            </div>
                        </div>

                        <textarea
                            value={generatedPost}
                            onChange={(e) => setGeneratedPost(e.target.value)}
                            placeholder="Your generated post will appear here…"
                            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ minHeight: '240px' }}
                        />

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic.trim()}
                                className="gap-1.5"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Regenerate
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                disabled={!generatedPost}
                                className="gap-1.5"
                            >
                                {isCopied ? (
                                    <><Check className="h-3.5 w-3.5 text-green-600" /> Copied!</>
                                ) : (
                                    <><Copy className="h-3.5 w-3.5" /> Copy</>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDraft}
                                disabled={isSaving || !generatedPost.trim()}
                                className="gap-1.5"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="h-3.5 w-3.5" />
                                )}
                                Save Draft
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setShowPublishModal(true)}
                                disabled={!generatedPost.trim() || charCount > MAX_CHARS}
                                className="gap-1.5 bg-[#0A66C2] text-white hover:bg-[#004182]"
                            >
                                <Send className="h-3.5 w-3.5" />
                                Publish to LinkedIn
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Post History ───────────────────────────────────────────── */}
                {postHistory.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Recent Drafts
                        </h2>
                        <div className="grid gap-2">
                            {postHistory.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setGeneratedPost(p.content);
                                        setCurrentPostId(p.id);
                                    }}
                                    className="w-full rounded-md border border-border bg-muted/30 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-[#0A66C2] hover:text-foreground line-clamp-2"
                                >
                                    {p.content}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
