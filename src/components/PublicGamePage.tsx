'use client'

import React, { useMemo, useState, useRef, useEffect } from "react";
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
  Copy,
  ExternalLink,
  Heart,
  Link2,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Check,
  Users,
} from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { FeedbackSection } from "@/components/FeedbackSection";

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
    subtitle?: string | null;
    description?: string | null;
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
    rulesPdfUrl?: string | null;
    features?: string[];
    formResponseCount?: number;
    _count?: {
      followers?: number;
    };
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
      _count?: {
        responses: number;
      };
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
  isOwner?: boolean;
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

function SharePageCard({ projectId, slug }: { projectId: string; slug: string | null }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/game/${projectId}`
    : `/game/${projectId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFacebookShare = () => {
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    window.open(fbShareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Share Page</CardTitle>
        <CardDescription className="text-xs">Share your game with others</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            onClick={handleCopy} 
            variant="secondary" 
            size="icon"
            className="rounded-xl"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={handleFacebookShare} 
            variant="secondary" 
            size="icon"
            className="rounded-xl"
            title="Share on Facebook"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity data types
interface ActivityBreakdown {
  form_response?: number;
  update_published?: number;
  new_follower?: number;
  settings_changed?: number;
  version_released?: number;
}

interface ActivityDay {
  total: number;
  breakdown: ActivityBreakdown;
}

type ActivityData = Record<string, ActivityDay>; // key = "YYYY-MM-DD"

interface DayCell {
  date: Date;
  dateString: string; // "YYYY-MM-DD"
  activity: ActivityDay | null;
  isFuture: boolean;
  isEmpty: boolean; // For padding cells before Jan 1
}

function ActivityHeatmap({ 
  activityData = {},
  formResponseCount = 0, 
  updateCount = 0,
  followerCount = 0 
}: { 
  activityData?: ActivityData;
  formResponseCount?: number;
  updateCount?: number;
  followerCount?: number;
}) {
  const [hoveredDay, setHoveredDay] = useState<DayCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate grid data from Jan 1 to today
  const { weeks, monthLabels } = useMemo(() => {
    const startDate = new Date(currentYear, 0, 1); // Jan 1
    const endDate = today;
    
    // Find what day of week Jan 1 is (0 = Sunday, 1 = Monday, etc.)
    // We want Monday = 0, so adjust
    const startDayOfWeek = (startDate.getDay() + 6) % 7; // Monday = 0
    
    const weeksArray: DayCell[][] = [];
    const monthLabelPositions: { month: string; weekIndex: number }[] = [];
    
    let currentDate = new Date(startDate);
    let currentWeek: DayCell[] = [];
    let weekIndex = 0;
    
    // Add empty cells for days before Jan 1
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: new Date(0),
        dateString: '',
        activity: null,
        isFuture: false,
        isEmpty: true
      });
    }
    
    // Track which months we've added labels for
    let lastLabeledMonth = -1;
    
    // Generate all days from Jan 1 to today
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const isFuture = currentDate > today;
      
      // Check if this is first day of a new month for labeling
      if (currentDate.getMonth() !== lastLabeledMonth && currentDate.getDate() <= 7) {
        monthLabelPositions.push({
          month: months[currentDate.getMonth()],
          weekIndex: weekIndex
        });
        lastLabeledMonth = currentDate.getMonth();
      }
      
      currentWeek.push({
        date: new Date(currentDate),
        dateString,
        activity: activityData[dateString] || null,
        isFuture,
        isEmpty: false
      });
      
      // If week is complete (7 days), push and start new week
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Push remaining days in last week
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }
    
    return { weeks: weeksArray, monthLabels: monthLabelPositions };
  }, [currentYear, activityData]);

  // Color shade based on activity level
  const getShade = (activity: ActivityDay | null) => {
    if (!activity || activity.total === 0) {
      return 'rgba(148,163,184,0.1)';
    }
    const total = activity.total;
    if (total <= 2) return 'rgba(139,92,246,0.3)';
    if (total <= 5) return 'rgba(139,92,246,0.5)';
    if (total <= 10) return 'rgba(139,92,246,0.7)';
    return 'rgba(139,92,246,0.9)';
  };

  const legendShades = [
    'rgba(148,163,184,0.1)',
    'rgba(139,92,246,0.3)',
    'rgba(139,92,246,0.5)',
    'rgba(139,92,246,0.7)',
    'rgba(139,92,246,0.9)',
  ];

  // Format date for tooltip
  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Handle hover - use fixed positioning for tooltip
  const handleMouseEnter = (day: DayCell, e: React.MouseEvent) => {
    if (day.isEmpty) return;
    setHoveredDay(day);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  // Get breakdown text
  const getBreakdownText = (breakdown: ActivityBreakdown) => {
    const items: string[] = [];
    if (breakdown.form_response && breakdown.form_response > 0) {
      items.push(`${breakdown.form_response} user${breakdown.form_response > 1 ? 's' : ''} answered the form`);
    }
    if (breakdown.update_published && breakdown.update_published > 0) {
      items.push(`${breakdown.update_published} update${breakdown.update_published > 1 ? 's' : ''} published`);
    }
    if (breakdown.new_follower && breakdown.new_follower > 0) {
      items.push(`${breakdown.new_follower} new follower${breakdown.new_follower > 1 ? 's' : ''}`);
    }
    if (breakdown.settings_changed && breakdown.settings_changed > 0) {
      items.push(`${breakdown.settings_changed} setting${breakdown.settings_changed > 1 ? 's' : ''} changed`);
    }
    if (breakdown.version_released && breakdown.version_released > 0) {
      items.push(`${breakdown.version_released} version${breakdown.version_released > 1 ? 's' : ''} released`);
    }
    return items;
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Activity {currentYear}</CardTitle>
            <CardDescription className="text-xs">
              {formResponseCount} responses • {updateCount} updates • {followerCount} followers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-0.5">
              {legendShades.map((shade, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: shade }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto relative" ref={containerRef}>
          {/* Month labels */}
          <div className="flex mb-1 text-[10px] text-muted-foreground" style={{ paddingLeft: '28px' }}>
            {monthLabels.map(({ month, weekIndex }, i) => (
              <span 
                key={`${month}-${i}`}
                className="absolute"
                style={{ 
                  left: `${28 + weekIndex * 12}px`
                }}
              >
                {month}
              </span>
            ))}
          </div>
          
          {/* Spacer for month labels */}
          <div className="h-4" />
          
          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col text-[9px] text-muted-foreground w-6 shrink-0" style={{ gap: '2px' }}>
              <span className="h-[10px]"></span>
              <span className="h-[10px] leading-[10px]">Mon</span>
              <span className="h-[10px]"></span>
              <span className="h-[10px] leading-[10px]">Wed</span>
              <span className="h-[10px]"></span>
              <span className="h-[10px] leading-[10px]">Fri</span>
              <span className="h-[10px]"></span>
            </div>
            
            {/* Weeks grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIdx) => (
                    <span
                      key={dayIdx}
                      className={`w-[10px] h-[10px] rounded-sm transition-all ${
                        day.isEmpty ? 'opacity-0' : 'cursor-pointer hover:ring-1 hover:ring-white/50'
                      }`}
                      style={{ background: day.isEmpty ? 'transparent' : getShade(day.activity) }}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          </div>
      </CardContent>
      
      {/* Tooltip - fixed position outside overflow container */}
      {hoveredDay && tooltipPos && !hoveredDay.isEmpty && (
        <div 
          className="fixed z-[100] bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg shadow-xl p-3 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            minWidth: '200px'
          }}
        >
          <div className="text-xs font-medium text-white mb-1">
            {formatDate(hoveredDay.date)}
          </div>
          <div className="text-sm font-bold text-purple-400 mb-2">
            {hoveredDay.activity?.total || 0} activit{(hoveredDay.activity?.total || 0) === 1 ? 'y' : 'ies'}
          </div>
          {hoveredDay.activity && hoveredDay.activity.total > 0 && (
            <div className="space-y-1 text-xs text-slate-400 border-t border-[#2a2a3e] pt-2">
              {getBreakdownText(hoveredDay.activity.breakdown).map((text, i) => (
                <div key={i}>• {text}</div>
              ))}
            </div>
          )}
          {(!hoveredDay.activity || hoveredDay.activity.total === 0) && (
            <div className="text-xs text-slate-500">No activity</div>
          )}
          {/* Tooltip arrow */}
          <div 
            className="absolute w-2 h-2 bg-[#1a1a2e] border-r border-b border-[#2a2a3e]"
            style={{
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)'
            }}
          />
        </div>
      )}
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

// GitHub-style timeline item
function TimelineItem({ u, projectId }: { u: Update; projectId: string }) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical line connector */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-[#0d0d15] z-10" />
        <div className="w-0.5 flex-1 bg-[#2a2a3e]" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{u.title}</span>
              <Badge variant="secondary" className="rounded-md text-xs px-1.5 py-0">
                {u.version}
              </Badge>
            </div>
            <div className="text-sm text-slate-400 line-clamp-2 mb-2">
              {u.summary || "No description provided."}
            </div>
            <a 
              href={`/updates/${u.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View update page
            </a>
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            {u.date}
          </div>
        </div>
      </div>
    </div>
  );
}

// Group updates by month
function groupUpdatesByMonth(updates: Update[]): Map<string, Update[]> {
  const groups = new Map<string, Update[]>();
  updates.forEach(u => {
    const date = new Date(u.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups.has(monthYear)) {
      groups.set(monthYear, []);
    }
    groups.get(monthYear)!.push(u);
  });
  return groups;
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

export default function PublicGamePage({ project, isOwner = false }: PublicGamePageProps) {
  // Activity data state
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch activity data on mount
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/activity`);
        if (res.ok) {
          const data = await res.json();
          setActivityData(data.activity || {});
        }
      } catch (error) {
        console.error('Failed to fetch activity data:', error);
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, [project.id]);

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
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const filteredUpdates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return updates;
    return updates.filter((u) =>
      [u.version, u.title, u.summary, u.type, ...u.highlights].join(" ").toLowerCase().includes(q)
    );
  }, [updates, search]);

  // Limit to 5 updates unless "Show more" is clicked
  const displayedUpdates = useMemo(() => {
    if (showAllUpdates || search.trim()) return filteredUpdates;
    return filteredUpdates.slice(0, 5);
  }, [filteredUpdates, showAllUpdates, search]);

  return (
    <div className="bg-transparent">
      {/* Cover with Banner */}
      <div className="relative">
        {/* Banner Image - Full width behind the profile card */}
        {project.bannerUrl && (
          <div className="absolute inset-0 h-64 w-full overflow-hidden">
            <img 
              src={project.bannerUrl} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d15]/60 to-[#0d0d15]" />
          </div>
        )}
        
        {/* Spacer for banner height */}
        <div className={project.bannerUrl ? "h-40" : "h-20"} />
        
        {/* Profile Card Container */}
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="rounded-3xl border border-[#2a2a3e] bg-[#0d0d15]/80 shadow-sm backdrop-blur p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
                  {project.subtitle && (
                    <div className="mt-1 text-sm text-slate-300">{project.subtitle}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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
              {!isOwner && (
                <FollowButton projectId={project.id} />
              )}
              {project.discordUrl && (
                <a href={project.discordUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-2xl gap-2 border-[#2a2a3e] text-white hover:bg-[#1a1a2e]">
                    <MessageSquare className="h-4 w-4" />
                    Discord
                  </Button>
                </a>
              )}
              {isOwner && (
                <Link href={`/dashboard/projects/${project.id}/settings`}>
                  <Button variant="outline" className="rounded-2xl gap-2 border-[#2a2a3e] text-white hover:bg-[#1a1a2e]">
                    <Settings className="h-4 w-4" />
                    Edit Settings
                  </Button>
                </Link>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4">
        {/* Tag row - Genre, Tags, and Key Features */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            {features.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block bg-[#2a2a3e]" />
                {features.map((feature, idx) => (
                  <Badge key={idx} variant="secondary" className="rounded-xl bg-purple-600/20 text-purple-300 border-purple-500/30">
                    {feature}
                  </Badge>
                ))}
              </>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left column */}
            <div className="space-y-6">
              <SharePageCard projectId={project.id} slug={project.slug} />
              
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <SmallKpi label="Followers" value={`${project._count?.followers || 0}`} />
                    <SmallKpi label="Respondents" value={`${(project.forms || []).reduce((sum, form) => sum + (form._count?.responses || 0), 0)}`} />
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
                </CardContent>
              </Card>

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
                  <CardDescription 
                    dangerouslySetInnerHTML={{ __html: project.description || "A game in development on PlayPulse." }}
                  />
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {/* How to Play / Rules */}
                  {(project.rules || project.rulesPdfUrl) && (
                    <div className="rounded-xl bg-[#1a1a2e] p-4">
                      <div className="text-sm font-semibold text-white mb-2">How to Play</div>
                      {project.rulesPdfUrl ? (
                        <div className="space-y-3">
                          <a 
                            href={project.rulesPdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4" /> 
                            {project.rules || 'View Rules PDF'}
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 whitespace-pre-wrap">
                          {project.rules}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Default content if no rules */}
                  {!project.rules && !project.rulesPdfUrl && (
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

              {/* Activity Heatmap - between About and Tabs */}
              <ActivityHeatmap 
                activityData={activityData}
                formResponseCount={project.formResponseCount || 0} 
                updateCount={publishedVersions.length} 
                followerCount={project._count?.followers || 0} 
              />

              <Tabs defaultValue="updates" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-2xl h-auto gap-1 p-1">
                  <TabsTrigger value="updates" className="rounded-xl text-xs sm:text-sm py-2">
                    Updates
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-xl text-xs sm:text-sm py-2">
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="rounded-xl text-xs sm:text-sm py-2">
                    Feedback
                  </TabsTrigger>
                  <TabsTrigger value="community" className="rounded-xl text-xs sm:text-sm py-2">
                    Community
                  </TabsTrigger>
                </TabsList>

                {/* Updates */}
                <TabsContent value="updates" className="mt-6 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold tracking-tight">Timeline</div>
                      <div className="text-sm text-muted-foreground">
                        Devlogs and updates in one place.
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

                  {displayedUpdates.length === 0 ? (
                    <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] p-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                      <div className="text-white font-medium mb-1">No published updates yet</div>
                      <div className="text-sm text-slate-400">
                        {search ? "No updates match your search." : "Updates will appear here once versions are published."}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Array.from(groupUpdatesByMonth(displayedUpdates)).map(([monthYear, monthUpdates]) => (
                        <div key={monthYear}>
                          {/* Month header */}
                          <div className="text-sm font-semibold text-purple-400 mb-4">
                            {monthYear}
                          </div>
                          {/* Timeline items */}
                          <div className="ml-1">
                            {monthUpdates.map((u, idx) => (
                              <div key={u.id} className="relative flex gap-4">
                                {/* Vertical line connector */}
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-[#0d0d15] z-10 shrink-0" />
                                  {idx < monthUpdates.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-[#2a2a3e] min-h-[40px]" />
                                  )}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 pb-6">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-white">{u.title}</span>
                                        <Badge variant="secondary" className="rounded-md text-xs px-1.5 py-0">
                                          {u.version}
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-slate-400 line-clamp-2 mb-2">
                                        {u.summary || "No description provided."}
                                      </div>
                                      <a 
                                        href={`/updates/${project.id}/${u.id}`}
                                        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View update page
                                      </a>
                                    </div>
                                    <div className="text-xs text-slate-500 whitespace-nowrap">
                                      {u.date}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show more button */}
                      {!showAllUpdates && filteredUpdates.length > 5 && !search.trim() && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="outline" 
                            className="rounded-2xl border-[#2a2a3e] text-slate-300 hover:bg-[#1a1a2e]"
                            onClick={() => setShowAllUpdates(true)}
                          >
                            Show {filteredUpdates.length - 5} more updates
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
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

                {/* Feedback */}
                <TabsContent value="feedback" className="mt-4 space-y-4">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">Feedback & Discussion</div>
                    <div className="text-sm text-muted-foreground">
                      Share your thoughts, suggestions, and feedback about the game.
                    </div>
                  </div>

                  <FeedbackSection projectId={project.id} isOwner={isOwner} />
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

      {/* Footer */}
      <div className="mx-auto max-w-7xl px-4 pb-10">
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
