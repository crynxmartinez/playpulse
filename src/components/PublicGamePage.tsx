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
  const game = {
    title: project.name,
    tagline: project.description || "A game in development.",
    studio: "Developer",
    slug: project.slug || project.id,
    coverHint: "Cover banner",
    logoHint: "Logo",
    tags: ["indie", "game"],
    platforms: ["PC", "Web"],
    links: {
      website: "#",
      discord: "#",
      itch: "#",
    },
    stats: {
      followers: 0,
      testers: 0,
      playtests: 0,
      totalResponses: 0,
      avgFun: 0,
      avgDifficulty: 0,
    },
  };

  const updates: Update[] = [
    {
      id: "u1",
      version: "v0.1.0",
      title: "Welcome to PlayPulse",
      date: "Jan 5, 2026",
      type: "Devlog",
      summary: "This is where your devlogs and playtest updates will appear.",
      highlights: ["Getting Started", "Feedback"],
      blocks: [{ kind: "text", value: "Start building your game's public presence here." }],
    },
  ];

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
    <div className="bg-background">
      {/* Cover */}
      <div className="relative">
        <div className="h-52 w-full bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto h-full max-w-6xl px-4">
            <div className="h-full rounded-3xl border bg-background/40 shadow-sm backdrop-blur md:mt-6 md:h-[240px]" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="relative -mt-14 flex flex-col gap-4 px-4 md:-mt-10 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border bg-background shadow-sm">
                <span className="text-xs text-muted-foreground">{game.logoHint}</span>
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{game.title}</h1>
                  <Badge className="rounded-xl" variant="secondary">
                    {project.visibility}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">by {game.studio}</div>
                <div className="mt-1 text-sm">{game.tagline}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:pb-2">
              <Button className="rounded-2xl gap-2">
                <ShieldCheck className="h-4 w-4" />
                Join Playtest
              </Button>
              <Button variant="secondary" className="rounded-2xl gap-2">
                <Heart className="h-4 w-4" />
                Follow
              </Button>
              <Button variant="outline" className="rounded-2xl gap-2">
                <Star className="h-4 w-4" />
                Add to List
              </Button>
            </div>
          </div>

          {/* Tag row */}
          <div className="mt-4 flex flex-wrap items-center gap-2 px-4">
            {game.tags.map((t) => (
              <Badge key={t} variant="outline" className="rounded-xl">
                #{t}
              </Badge>
            ))}
            <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
            {game.platforms.map((p) => (
              <Badge key={p} variant="secondary" className="rounded-xl">
                {p}
              </Badge>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left column */}
            <div className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Game Profile</CardTitle>
                  <CardDescription className="text-xs">Public page • /g/{game.slug}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <SmallKpi label="Followers" value={`${game.stats.followers}`} />
                    <SmallKpi label="Testers" value={`${game.stats.testers}`} />
                    <SmallKpi label="Playtests" value={`${game.stats.playtests}`} />
                    <SmallKpi label="Responses" value={`${game.stats.totalResponses}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SmallKpi label="Avg Fun" value={game.stats.avgFun.toFixed(1)} hint="All time" />
                    <SmallKpi
                      label="Avg Difficulty"
                      value={game.stats.avgDifficulty.toFixed(1)}
                      hint="All time"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold">Links</div>
                    <div className="grid gap-2">
                      <a
                        className="flex items-center justify-between rounded-2xl border bg-background/60 px-3 py-2 text-sm hover:bg-muted/30"
                        href={game.links.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" /> Website
                        </span>
                        <span className="text-xs text-muted-foreground">open</span>
                      </a>
                      <a
                        className="flex items-center justify-between rounded-2xl border bg-background/60 px-3 py-2 text-sm hover:bg-muted/30"
                        href={game.links.discord}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" /> Discord
                        </span>
                        <span className="text-xs text-muted-foreground">join</span>
                      </a>
                      <a
                        className="flex items-center justify-between rounded-2xl border bg-background/60 px-3 py-2 text-sm hover:bg-muted/30"
                        href={game.links.itch}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" /> Itch
                        </span>
                        <span className="text-xs text-muted-foreground">open</span>
                      </a>
                    </div>
                  </div>

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

              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pinned</CardTitle>
                  <CardDescription className="text-xs">Quick glance highlights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Latest update</div>
                    <div className="mt-1 text-sm font-semibold">{updates[0]?.title || "No updates yet"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{updates[0]?.date}</div>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Open playtest</div>
                    <div className="mt-1 text-sm font-semibold">No active playtest</div>
                    <div className="mt-1 text-xs text-muted-foreground">Create one from Workspace</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main column */}
            <div className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-base">README</CardTitle>
                  <CardDescription>
                    A clean, scannable overview — like GitHub, but for game playtests.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-muted/30 p-4">
                      <div className="text-sm font-semibold">What we need</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Feel free to be blunt — we prefer actionable feedback.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-lg">
                          pacing
                        </Badge>
                        <Badge variant="secondary" className="rounded-lg">
                          difficulty
                        </Badge>
                        <Badge variant="secondary" className="rounded-lg">
                          onboarding
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4">
                      <div className="text-sm font-semibold">How to help</div>
                      <ol className="mt-2 list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                        <li>Play 1 run (10–15 min)</li>
                        <li>Answer the campaign form</li>
                        <li>Optional: leave a comment</li>
                      </ol>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4">
                      <div className="text-sm font-semibold">Privacy</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Submissions are anonymous by default. Creators see raw responses; public views show
                        aggregates.
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-3">
                    <SmallKpi label="Open issues" value="0" hint="clustered from responses" />
                    <SmallKpi label="Top theme" value="-" hint="No data yet" />
                    <SmallKpi label="Next goal" value="-" hint="Set in Workspace" />
                  </div>
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
                    {filteredUpdates.map((u) => (
                      <UpdateCard
                        key={u.id}
                        u={u}
                        expanded={expandedId === u.id}
                        onToggle={() => setExpandedId((cur) => (cur === u.id ? "" : u.id))}
                      />
                    ))}
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

                  <div className="grid gap-3 lg:grid-cols-2">
                    <SnapshotCard
                      title="Progress Board (Live)"
                      caption="Share the table publicly or keep it unlisted. Export snapshots to WebP/PNG."
                    />
                    <SnapshotCard
                      title="Top Issues Over Time"
                      caption="Tag clustering from responses — see what keeps appearing each release."
                    />
                  </div>
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
