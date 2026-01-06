'use client'

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Heart,
  Link2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

type Update = {
  id: string;
  version: string;
  title: string;
  date: string;
  type: "Devlog" | "Playtest";
  summary: string;
  highlights: string[];
  metrics?: {
    responses: number;
    fun: number;
    difficulty: number;
    bugs: number;
  };
  blocks?: Array<
    | { kind: "text"; value: string }
    | { kind: "changelog"; added: string[]; fixed: string[]; removed: string[] }
    | { kind: "cta"; label: string }
    | { kind: "snapshot"; label: string; caption: string }
  >;
};

interface PublicGamePageProps {
  project: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    bannerUrl?: string | null;
    logoUrl?: string | null;
    genre?: string | null;
    tags?: string[];
    steamUrl?: string | null;
    itchUrl?: string | null;
    websiteUrl?: string | null;
    discordUrl?: string | null;
    rules?: string | null;
    features?: string[];
    user?: {
      displayName?: string | null;
      username?: string | null;
      studioName?: string | null;
    };
    versions?: Array<{
      id: string;
      version: string;
      title: string;
      description?: string | null;
      isPublished: boolean;
      publishedAt?: Date | string | null;
      createdAt: Date | string;
    }>;
    forms?: Array<{
      id: string;
      title: string;
      slug?: string | null;
      isActive: boolean;
    }>;
    pinnedSections?: Array<{
      id: string;
      type: 'SNAPSHOT' | 'ANALYTICS' | string;
      title?: string | null;
      order: number;
      snapshot?: {
        id: string;
        name: string;
        type: string;
        imageData: string;
      } | null;
      widgetType?: string | null;
      widgetConfig?: unknown;
    }>;
  };
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function formatDelta(n: number) {
  if (n === 0) return "0";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

function SmallKpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value || "-"}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function Heatmap({ weeks = 26 }: { weeks?: number }) {
  const data = useMemo(() => {
    const cells: number[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const r = Math.random();
      const v = r < 0.55 ? 0 : r < 0.78 ? 1 : r < 0.92 ? 2 : r < 0.985 ? 3 : 4;
      cells.push(v);
    }
    return cells;
  }, [weeks]);

  const shade = (v: number) => {
    const a = [0.06, 0.12, 0.22, 0.34, 0.5][clamp(v, 0, 4)];
    return `rgba(148,163,184,${a})`;
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription className="text-xs">Devlogs + playtests published</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((v) => (
                <span
                  key={v}
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: shade(v) }}
                  aria-label={`activity level ${v}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid grid-flow-col grid-rows-7 gap-[3px]">
            {data.map((v, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: shade(v) }}
                title={`Activity level: ${v}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotCard({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="group rounded-2xl border bg-background/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
        </div>
        <Button variant="secondary" size="sm" className="gap-2">
          <Link2 className="h-4 w-4" />
          Embed
        </Button>
      </div>

      <div className="mt-4 rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Live preview</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Updates automatically
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <SmallKpi label="Responses" value={`${Math.floor(18 + Math.random() * 70)}`} />
          <SmallKpi label="Avg Fun" value={`${(6.8 + Math.random() * 2.2).toFixed(1)}`} />
          <SmallKpi label="Difficulty" value={`${(4.5 + Math.random() * 3).toFixed(1)}`} />
          <SmallKpi label="Top Issue" value="" hint="" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Add this as an iframe widget in devlogs, Discord, or your website.
        </div>
      </div>
    </div>
  );
}

function UpdateCard({ u, expanded, onToggle }: { u: Update; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border bg-background/60 shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-xl">
              {u.version}
            </Badge>
            <Badge className="rounded-xl" variant={u.type === "Playtest" ? "default" : "outline"}>
              {u.type}
            </Badge>
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {u.date}
            </div>
          </div>
          <div className="mt-2 text-base font-semibold leading-tight">{u.title}</div>
          <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{u.summary}</div>

          {u.metrics ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SmallKpi label="Responses" value={`${u.metrics.responses}`} />
              <SmallKpi label="Fun" value={u.metrics.fun.toFixed(1)} />
              <SmallKpi label="Difficulty" value={u.metrics.difficulty.toFixed(1)} />
              <SmallKpi label="Bugs" value={`${u.metrics.bugs}`} />
            </div>
          ) : null}
        </div>

        <div className="mt-1 flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">{expanded ? "Hide" : "Open"}</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="overflow-hidden">
            <Separator />
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {u.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="rounded-lg">
                    {h}
                  </Badge>
                ))}
              </div>

              {/* Simplified single-column layout */}
              <div className="space-y-4">
                {/* Patch Notes */}
                <div className="rounded-xl bg-muted/30 p-4">
                  <div className="text-sm font-semibold mb-2">Patch Notes</div>
                  {(u.blocks || []).filter((b) => b.kind === "changelog").map((b, idx) => {
                    const bl = b as { kind: "changelog"; added: string[]; fixed: string[]; removed: string[] };
                    return (
                      <div key={idx} className="space-y-2 text-sm">
                        {bl.added?.length > 0 && (
                          <div>
                            <span className="text-green-600 font-medium">Added:</span>{" "}
                            <span className="text-muted-foreground">{bl.added.join(", ")}</span>
                          </div>
                        )}
                        {bl.fixed?.length > 0 && (
                          <div>
                            <span className="text-blue-600 font-medium">Fixed:</span>{" "}
                            <span className="text-muted-foreground">{bl.fixed.join(", ")}</span>
                          </div>
                        )}
                        {bl.removed?.length > 0 && (
                          <div>
                            <span className="text-red-600 font-medium">Removed:</span>{" "}
                            <span className="text-muted-foreground">{bl.removed.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(u.blocks || []).filter((b) => b.kind === "changelog").length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No patch notes yet — add them from the block builder.
                    </div>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2 rounded-xl">
                    <ArrowRight className="h-4 w-4" />
                    Start Playtest
                  </Button>
                  <Button variant="secondary" className="gap-2 rounded-xl">
                    <Sparkles className="h-4 w-4" />
                    Save Snapshot
                  </Button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function PublicGamePage({ project }: PublicGamePageProps) {
  // Use real project data
  const developerName = project.user?.studioName || project.user?.displayName || project.user?.username || "Developer";
  const tags = project.tags || [];
  const features = project.features || [];
  
  // Get published versions for the updates timeline
  const publishedVersions = (project.versions || [])
    .filter(v => v.isPublished)
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  
  // Get active forms for "Join Playtest" button
  const activeForms = (project.forms || []).filter(f => f.isActive);
  const activePlaytest = activeForms[0];
  
  // Get pinned sections sorted by order
  const pinnedSections = (project.pinnedSections || []).sort((a, b) => a.order - b.order);
  const pinnedSnapshots = pinnedSections.filter(p => p.type === 'SNAPSHOT' && p.snapshot);
  
  // Convert published versions to Update format for the timeline
  const updates: Update[] = publishedVersions.map(v => ({
    id: v.id,
    version: v.version,
    title: v.title,
    date: v.publishedAt 
      ? new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    type: "Devlog" as const,
    summary: v.description || "No description provided.",
    highlights: [],
    blocks: [],
  }));

  const progressRows = useMemo(() => {
    const rows = updates
      .filter((u) => u.metrics)
      .map((u) => ({
        version: u.version,
        date: u.date,
        responses: u.metrics!.responses,
        fun: u.metrics!.fun,
        difficulty: u.metrics!.difficulty,
      }))
      .reverse();

    return rows.map((r, idx) => {
      const prev = idx === 0 ? null : rows[idx - 1];
      return {
        ...r,
        funDelta: prev ? r.fun - prev.fun : 0,
        diffDelta: prev ? r.difficulty - prev.difficulty : 0,
      };
    });
  }, [updates]);

  const chartData = useMemo(() => {
    return progressRows.map((r) => ({
      version: r.version,
      fun: r.fun,
      difficulty: r.difficulty,
      responses: r.responses,
    }));
  }, [progressRows]);

  const [expandedId, setExpandedId] = useState<string>(updates[0]?.id ?? "");
  const [search, setSearch] = useState<string>("");

  const filteredUpdates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return updates;
    return updates.filter((u) =>
      [u.version, u.title, u.summary, u.type, ...u.highlights].join(" ").toLowerCase().includes(q)
    );
  }, [updates, search]);

  return (
    <div className="bg-transparent">
      {/* Cover */}
      <div className="relative">
        {/* Banner Image or Gradient */}
        {project.bannerUrl ? (
          <div className="h-52 w-full overflow-hidden">
            <img 
              src={project.bannerUrl} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-52 w-full bg-gradient-to-b from-purple-900/30 to-transparent" />
        )}
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto h-full max-w-6xl px-4">
            <div className="h-full rounded-3xl border border-[#2a2a3e] bg-[#0d0d15]/40 shadow-sm backdrop-blur md:mt-6 md:h-[240px]" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="relative -mt-14 flex flex-col gap-4 px-4 md:-mt-10 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <div className="h-20 w-20 rounded-2xl border border-[#2a2a3e] bg-[#1a1a2e] shadow-sm overflow-hidden flex items-center justify-center">
                {project.logoUrl ? (
                  <img src={project.logoUrl} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white/60">{project.name[0]}</span>
                )}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">{project.name}</h1>
                  <Badge className="rounded-xl" variant="secondary">
                    {project.visibility}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-slate-400">by {developerName}</div>
                <div className="mt-1 text-sm text-slate-300">{project.description || "A game in development."}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:pb-2">
              {activePlaytest ? (
                <a href={`/f/${activePlaytest.slug || activePlaytest.id}`}>
                  <Button className="rounded-2xl gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Join Playtest
                  </Button>
                </a>
              ) : (
                <Button className="rounded-2xl gap-2" disabled>
                  <ShieldCheck className="h-4 w-4" />
                  No Active Playtest
                </Button>
              )}
              <Button variant="secondary" className="rounded-2xl gap-2">
                <Heart className="h-4 w-4" />
                Follow
              </Button>
              {project.discordUrl && (
                <a href={project.discordUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-2xl gap-2 border-[#2a2a3e] text-white hover:bg-[#1a1a2e]">
                    <MessageSquare className="h-4 w-4" />
                    Discord
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Tag row */}
          <div className="mt-4 flex flex-wrap items-center gap-2 px-4">
            {project.genre && (
              <Badge variant="secondary" className="rounded-xl bg-purple-600/20 text-purple-300 border-purple-500/30">
                {project.genre}
              </Badge>
            )}
            {tags.map((t) => (
              <Badge key={t} variant="outline" className="rounded-xl border-[#2a2a3e] text-slate-300">
                #{t}
              </Badge>
            ))}
            {(project.steamUrl || project.itchUrl || project.websiteUrl) && (
              <>
                <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block bg-[#2a2a3e]" />
                {project.steamUrl && (
                  <a href={project.steamUrl} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="rounded-xl bg-[#1b2838] text-white hover:bg-[#2a475e] cursor-pointer">
                      Steam
                    </Badge>
                  </a>
                )}
                {project.itchUrl && (
                  <a href={project.itchUrl} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="rounded-xl bg-[#fa5c5c] text-white hover:bg-[#ff7676] cursor-pointer">
                      Itch.io
                    </Badge>
                  </a>
                )}
                {project.websiteUrl && (
                  <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="rounded-xl border-[#2a2a3e] text-slate-300 hover:bg-[#1a1a2e] cursor-pointer">
                      Website
                    </Badge>
                  </a>
                )}
              </>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left column */}
            <div className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Game Profile</CardTitle>
                  <CardDescription className="text-xs">Public page • /g/{project.slug || project.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <SmallKpi label="Followers" value="0" />
                    <SmallKpi label="Testers" value="0" />
                    <SmallKpi label="Updates" value={`${publishedVersions.length}`} />
                    <SmallKpi label="Forms" value={`${(project.forms || []).length}`} />
                  </div>

                  {/* Links Section */}
                  {(project.websiteUrl || project.discordUrl || project.steamUrl || project.itchUrl) && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400">Links</div>
                      <div className="grid gap-2">
                        {project.websiteUrl && (
                          <a
                            className="flex items-center justify-between rounded-2xl border border-[#2a2a3e] bg-[#1a1a2e]/60 px-3 py-2 text-sm text-slate-300 hover:bg-[#2a2a3e]"
                            href={project.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="inline-flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" /> Website
                            </span>
                            <span className="text-xs text-slate-500">open</span>
                          </a>
                        )}
                        {project.discordUrl && (
                          <a
                            className="flex items-center justify-between rounded-2xl border border-[#2a2a3e] bg-[#1a1a2e]/60 px-3 py-2 text-sm text-slate-300 hover:bg-[#2a2a3e]"
                            href={project.discordUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="inline-flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> Discord
                            </span>
                            <span className="text-xs text-slate-500">join</span>
                          </a>
                        )}
                        {project.steamUrl && (
                          <a
                            className="flex items-center justify-between rounded-2xl border border-[#2a2a3e] bg-[#1b2838] px-3 py-2 text-sm text-white hover:bg-[#2a475e]"
                            href={project.steamUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="inline-flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" /> Steam
                            </span>
                            <span className="text-xs text-slate-400">open</span>
                          </a>
                        )}
                        {project.itchUrl && (
                          <a
                            className="flex items-center justify-between rounded-2xl border border-[#2a2a3e] bg-[#fa5c5c] px-3 py-2 text-sm text-white hover:bg-[#ff7676]"
                            href={project.itchUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="inline-flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" /> Itch.io
                            </span>
                            <span className="text-xs text-white/70">open</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border bg-muted/20 p-3">
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-4 w-4" />
                      <div>
                        <div className="text-sm font-semibold">Community</div>
                        <div className="text-xs text-muted-foreground">
                          All games share one Discord hub — discover teammates and testers faster.
                        </div>
                      </div>
                    </div>
                    <Button className="mt-3 w-full rounded-2xl" variant="secondary">
                      Enter PlayPulse Discord
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Heatmap weeks={26} />

              <Card className="rounded-3xl border-[#2a2a3e] bg-[#0d0d15]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white">Pinned</CardTitle>
                  <CardDescription className="text-xs">Quick glance highlights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl bg-[#1a1a2e] p-3">
                    <div className="text-xs text-slate-500">Latest update</div>
                    <div className="mt-1 text-sm font-semibold text-white">{updates[0]?.title || "No updates yet"}</div>
                    <div className="mt-1 text-xs text-slate-500">{updates[0]?.date || "Publish a version to show here"}</div>
                  </div>
                  <div className="rounded-xl bg-[#1a1a2e] p-3">
                    <div className="text-xs text-slate-500">Open playtest</div>
                    {activePlaytest ? (
                      <>
                        <div className="mt-1 text-sm font-semibold text-white">{activePlaytest.title}</div>
                        <a href={`/f/${activePlaytest.slug || activePlaytest.id}`} className="mt-1 text-xs text-purple-400 hover:text-purple-300">
                          Join now →
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="mt-1 text-sm font-semibold text-slate-400">No active playtest</div>
                        <div className="mt-1 text-xs text-slate-500">Create one from Workspace</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main column */}
            <div className="space-y-6">
              <Card className="rounded-3xl border-[#2a2a3e] bg-[#0d0d15]">
                <CardHeader>
                  <CardTitle className="text-base text-white">About</CardTitle>
                  <CardDescription>
                    {project.description || "A game in development on PlayPulse."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {/* Key Features */}
                  {features.length > 0 && (
                    <div className="rounded-xl bg-[#1a1a2e] p-4">
                      <div className="text-sm font-semibold text-white mb-3">Key Features</div>
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="rounded-lg bg-purple-600/20 text-purple-300 border-purple-500/30">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* How to Play / Rules */}
                  {project.rules && (
                    <div className="rounded-xl bg-[#1a1a2e] p-4">
                      <div className="text-sm font-semibold text-white mb-2">How to Play</div>
                      <div className="text-sm text-slate-400 whitespace-pre-wrap">
                        {project.rules}
                      </div>
                    </div>
                  )}

                  {/* Default content if no features or rules */}
                  {features.length === 0 && !project.rules && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-[#1a1a2e] p-4">
                        <div className="text-sm font-semibold text-white">How to help</div>
                        <ol className="mt-2 list-decimal pl-5 text-sm text-slate-400 space-y-1">
                          <li>Play the game</li>
                          <li>Answer the feedback form</li>
                          <li>Optional: leave a comment</li>
                        </ol>
                      </div>
                      <div className="rounded-xl bg-[#1a1a2e] p-4">
                        <div className="text-sm font-semibold text-white">Privacy</div>
                        <div className="mt-2 text-sm text-slate-400">
                          Submissions are anonymous by default. Creators see raw responses; public views show aggregates.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="updates" className="w-full">
                <TabsList className="grid w-full grid-cols-4 rounded-2xl">
                  <TabsTrigger value="updates" className="rounded-2xl">
                    Updates
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-2xl">
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="rounded-2xl">
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="community" className="rounded-2xl">
                    Community
                  </TabsTrigger>
                </TabsList>

                {/* Updates */}
                <TabsContent value="updates" className="mt-6 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold tracking-tight">Timeline</div>
                      <div className="text-sm text-muted-foreground">
                        Devlogs + playtests in one place. Click to expand.
                      </div>
                    </div>
                    <div className="flex w-full max-w-md items-center gap-2 sm:w-auto">
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search updates..."
                        className="rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredUpdates.length === 0 ? (
                      <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] p-8 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                        <div className="text-white font-medium mb-1">No published updates yet</div>
                        <div className="text-sm text-slate-400">
                          {search ? "No updates match your search." : "Updates will appear here once versions are published."}
                        </div>
                      </div>
                    ) : (
                      filteredUpdates.map((u) => (
                        <UpdateCard
                          key={u.id}
                          u={u}
                          expanded={expandedId === u.id}
                          onToggle={() => setExpandedId((cur) => (cur === u.id ? "" : u.id))}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Analytics */}
                <TabsContent value="analytics" className="mt-4 space-y-4">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">Public Analytics</div>
                    <div className="text-sm text-muted-foreground">
                      Aggregate-only view. Creators see full responses privately.
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Card className="rounded-3xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Trend by version</CardTitle>
                        <CardDescription>Fun & difficulty across releases</CardDescription>
                      </CardHeader>
                      <CardContent className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="version" fontSize={12} />
                            <YAxis fontSize={12} domain={[0, 10]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="fun" fillOpacity={0.25} strokeWidth={2} />
                            <Area type="monotone" dataKey="difficulty" fillOpacity={0.18} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Response volume</CardTitle>
                        <CardDescription>How much data backs each version</CardDescription>
                      </CardHeader>
                      <CardContent className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="version" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Area type="monotone" dataKey="responses" fillOpacity={0.25} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pinned Snapshots */}
                  {pinnedSnapshots.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-400">Pinned Snapshots</div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {pinnedSnapshots.map((pinned) => (
                          <Card key={pinned.id} className="rounded-2xl border-[#2a2a3e] bg-[#0d0d15] overflow-hidden">
                            <div className="aspect-video bg-[#1a1a2e] relative overflow-hidden">
                              <img 
                                src={pinned.snapshot!.imageData} 
                                alt={pinned.title || pinned.snapshot!.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <CardContent className="p-3">
                              <div className="text-sm font-medium text-white truncate">
                                {pinned.title || pinned.snapshot!.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {pinned.snapshot!.type}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <SnapshotCard
                        title="No Pinned Snapshots"
                        caption="Pin analytics snapshots from the Workspace to display them here."
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Progress */}
                <TabsContent value="progress" className="mt-4 space-y-4">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">Progress Board</div>
                    <div className="text-sm text-muted-foreground">
                      A shareable, live "table view" of iteration — great for investors and communities.
                    </div>
                  </div>

                  <Card className="rounded-3xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Versions</CardTitle>
                      <CardDescription>Stats per release (delta vs previous)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-muted-foreground">
                              <th className="py-2 pr-4">Version</th>
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Responses</th>
                              <th className="py-2 pr-4">Fun</th>
                              <th className="py-2 pr-4">Difficulty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {progressRows.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                  No playtest data yet. Create a playtest from Workspace.
                                </td>
                              </tr>
                            ) : (
                              progressRows
                                .slice()
                                .reverse()
                                .map((r) => (
                                  <tr key={r.version} className="border-t">
                                    <td className="py-3 pr-4">
                                      <Badge variant="secondary" className="rounded-xl">
                                        {r.version}
                                      </Badge>
                                    </td>
                                    <td className="py-3 pr-4 text-muted-foreground">{r.date}</td>
                                    <td className="py-3 pr-4">{r.responses}</td>
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{r.fun.toFixed(1)}</span>
                                        <span className="text-xs text-muted-foreground">({formatDelta(r.funDelta)})</span>
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{r.difficulty.toFixed(1)}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({formatDelta(r.diffDelta)})
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="secondary" className="rounded-2xl gap-2">
                          <Sparkles className="h-4 w-4" />
                          Share Live Link
                        </Button>
                        <Button variant="outline" className="rounded-2xl gap-2">
                          <Link2 className="h-4 w-4" />
                          Copy Embed
                        </Button>
                        <Button variant="outline" className="rounded-2xl gap-2">
                          Save Snapshot
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Community */}
                <TabsContent value="community" className="mt-4 space-y-4">
                  <Card className="rounded-3xl">
                    <CardHeader>
                      <CardTitle className="text-base">Community</CardTitle>
                      <CardDescription>
                        PlayPulse routes everyone into one Discord hub so players discover more games (and devs get
                        more testers).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-2xl border bg-muted/20 p-4">
                        <div className="flex items-start gap-3">
                          <Users className="mt-0.5 h-5 w-5" />
                          <div>
                            <div className="text-sm font-semibold">Tester incentives (optional)</div>
                            <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                              <li>Badges: Tested 10 games, Returned 5 times, Found 20 bugs</li>
                              <li>"My Tests" dashboard for testers</li>
                              <li>Dev can reward top testers (role, credit, early keys)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Card className="rounded-2xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Latest shoutouts</CardTitle>
                            <CardDescription>Testimonials and comments</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="rounded-2xl border bg-background/60 p-3">
                              <div className="text-sm text-muted-foreground text-center py-4">
                                No shoutouts yet
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Join the hub</CardTitle>
                            <CardDescription>Meet devs, find games, recruit testers</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Button className="w-full rounded-2xl gap-2">
                              <MessageSquare className="h-4 w-4" /> Join Discord
                            </Button>
                            <Button variant="secondary" className="w-full rounded-2xl">
                              Browse other games
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="pb-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <Separator className="my-8" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Public analytics are aggregate-only • Creators keep raw responses private by default.
          </div>
          <div className="text-sm text-muted-foreground">PlayPulse • Public Game Page</div>
        </div>
      </div>
    </div>
  );
}
