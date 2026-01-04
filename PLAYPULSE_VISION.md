# PlayPulse Vision & Implementation Plan

> **One-liner:** A Steam-like discovery and devlog platform powered by playtest analytics—private by default, shareable by choice.

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [Core Data Model](#core-data-model)
3. [Privacy & Sharing Rules](#privacy--sharing-rules)
4. [Feature Breakdown](#feature-breakdown)
5. [Implementation Phases](#implementation-phases)
6. [Monetization Strategy](#monetization-strategy)
7. [Technical Architecture](#technical-architecture)

---

## Product Vision

PlayPulse is where indie game developers:
- **Run playtests** with structured feedback collection
- **Publish devlogs** with rich, block-based content
- **Show progress** with shareable analytics dashboards
- **Get discovered** by testers looking for games to try

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Privacy-first** | All data is private by default. Devs choose what to share. |
| **Analytics-powered** | Every feature connects back to playtest data. |
| **Shareable by design** | Snapshots, embeds, and progress boards for social proof. |
| **Tester-friendly** | Give testers reasons to come back (discovery, badges, perks). |

---

## Core Data Model

### Entity Relationship

```
User (Profile)
  └── Game (replaces Project)
        ├── Update (Devlog Entry)
        │     └── Blocks (content)
        │     └── Campaigns (attached playtests)
        │
        ├── Campaign (Playtest)
        │     ├── Stats (metrics)
        │     ├── Form (questions)
        │     └── Responses (feedback)
        │
        ├── Snapshots (exported analytics)
        └── Progress Board (live dashboard)
```

### 1. User (Profile)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `email` | String | Login email |
| `username` | String? | Unique handle (e.g., @studioname) |
| `displayName` | String? | Public display name |
| `bio` | String? | Short bio |
| `studioName` | String? | Studio/team name |
| `avatarUrl` | String? | Profile picture |
| `socialLinks` | JSON | { twitter, discord, youtube, website } |
| `games` | Game[] | Owned games |

### 2. Game (replaces Project)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `slug` | String | URL-friendly name (unique) |
| `title` | String | Game title |
| `tagline` | String? | Short pitch (1-2 sentences) |
| `description` | String? | Full description (markdown) |
| `bannerUrl` | String? | Header banner image |
| `logoUrl` | String? | Game logo/icon |
| `screenshotUrls` | JSON | Array of screenshot URLs |
| `trailerUrl` | String? | YouTube/video URL |
| `discordUrl` | String? | Discord invite link |
| `websiteUrl` | String? | Official website |
| `steamUrl` | String? | Steam store page |
| `itchUrl` | String? | itch.io page |
| `tags` | String[] | Discovery tags |
| `platforms` | String[] | PC, Web, Mobile, etc. |
| `visibility` | Enum | PRIVATE / UNLISTED / PUBLIC |
| `userId` | String | Owner |
| `updates` | Update[] | Devlog entries |
| `campaigns` | Campaign[] | Playtests |
| `followers` | Follow[] | Users following this game |

### 3. Update (Devlog Entry)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `gameId` | String | Parent game |
| `version` | String | Version label (v0.1, v0.2) |
| `title` | String | Update title |
| `summary` | String? | 2-3 bullet highlights |
| `blocks` | JSON | Block-based content |
| `status` | Enum | DRAFT / PUBLISHED |
| `publishedAt` | DateTime? | Publish date |
| `campaigns` | Campaign[] | Attached playtests |
| `responseCount` | Int | Cached response count |
| `avgScore` | Float? | Cached average score |

### 4. Campaign (Playtest) - Enhanced from current Form

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `slug` | String? | Custom URL slug |
| `gameId` | String | Parent game |
| `updateId` | String? | Linked update (optional) |
| `title` | String | Campaign name |
| `status` | Enum | DRAFT / LIVE / CLOSED |
| `visibility` | Enum | Inherit from game or override |
| `responseIdentity` | Enum | ANONYMOUS / NICKNAME / ACCOUNT |
| `stats` | Stat[] | Metrics being tracked |
| `questions` | Question[] | Form questions |
| `responses` | Response[] | Collected feedback |

### 5. Snapshot (Exported Analytics)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `gameId` | String | Parent game |
| `campaignId` | String? | Source campaign |
| `type` | Enum | CHART / TABLE / CARD / BOARD |
| `title` | String | Snapshot name |
| `imageUrl` | String? | Exported image URL |
| `embedData` | JSON | Data for live embed |
| `isPublic` | Boolean | Allow public embed |

### 6. Progress Board

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `gameId` | String | Parent game |
| `title` | String | Board name |
| `columns` | JSON | Which stats to show |
| `visibility` | Enum | PRIVATE / UNLISTED / PUBLIC |
| `shareToken` | String | Unique share link token |

---

## Privacy & Sharing Rules

### Default Behavior
- All analytics and responses are **PRIVATE by default**
- Developer must intentionally "publish" or "share" anything
- No data is discoverable without explicit action

### Visibility Levels

| Level | Who can see | Use case |
|-------|-------------|----------|
| **Private** | Only owner/team | Development, internal testing |
| **Unlisted** | Anyone with link | Share with Discord, press, investors |
| **Public** | Everyone on PlayPulse | Discovery, marketing, social proof |

### Response Identity Options (per Campaign)

| Option | Description |
|--------|-------------|
| **Anonymous** | No identity collected |
| **Nickname** | Optional name field |
| **Email** | Optional email field |
| **Account Required** | Must be logged in (future) |

### Data Shown in Public Views

| Data Type | Public by default? | Notes |
|-----------|-------------------|-------|
| Game info | Yes (if public) | Title, description, media |
| Update content | Yes (if published) | Devlog text, media |
| Response count | Yes | "47 responses" |
| Aggregate scores | Optional | "Fun: 8.2/10" |
| Individual responses | **Never** | Always private |
| Raw comments | **Never** | Unless explicitly enabled |

---

## Feature Breakdown

### A. Existing Features (Playtest Engine) ✅

Keep these as the core engine:

- [x] **Overview Dashboard** - Project/game summary
- [x] **Stats System** - User-created metrics with categories
- [x] **Form Builder** - Questions mapped to stats, multiple types
- [x] **Responses View** - Individual response cards with details
- [x] **Analytics View** - Charts, trends, score distribution

### B. New Features

#### 1. User Profiles

**What it is:** Public profile page for developers/studios.

**Features:**
- Username/handle (@studioname)
- Display name, bio, avatar
- Studio name
- Social links (Twitter, Discord, YouTube, etc.)
- Games list
- Optional: Tester profile (games tested, badges)

**URL:** `playpulse.app/@username`

---

#### 2. Game Hub (Steam-style Page)

**What it is:** Public-facing game page like a Steam product page.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Banner Image - Full Width]                         │
├─────────────────────────────────────────────────────┤
│ [Logo] Game Title                    [Join Playtest]│
│ by @studioname                       [Follow] [🔗]  │
│ ─────────────────────────────────────────────────── │
│ "A roguelike deckbuilder with real-time combat"     │
│                                                     │
│ 🏷️ roguelike • deckbuilder • pixel-art • co-op     │
├───────────────────────┬─────────────────────────────┤
│ About                 │ Media                       │
│ ───────────────────── │ ─────────────────────────── │
│ Full description...   │ [Screenshot Gallery]        │
│                       │ [Trailer Video]             │
├───────────────────────┴─────────────────────────────┤
│ Development Timeline                                │
│ ─────────────────────────────────────────────────── │
│ [Update Cards - Vertical Timeline]                  │
│                                                     │
│ ● v0.3 - Combat Overhaul (Jan 4)                   │
│   └─ 47 responses • Fun: 8.2 (+0.4)                │
│                                                     │
│ ● v0.2 - New Enemies (Dec 20)                      │
│   └─ 32 responses • Fun: 7.8                       │
│                                                     │
│ ● v0.1 - First Playtest (Dec 1)                    │
│   └─ 18 responses • Fun: 7.1                       │
└─────────────────────────────────────────────────────┘
```

**URL:** `playpulse.app/g/game-slug`

---

#### 3. Timeline Devlog

**What it is:** Vertical timeline showing game development progress.

**Card Content:**
- Version label (v0.3)
- Title ("Combat Overhaul")
- Date
- 2-3 bullet highlights
- Optional stat chips (responses, score delta)
- Buttons: View Update / Join Playtest

**Design:** Single-column vertical timeline (not alternating left/right for better scannability)

---

#### 4. Update Pages (Block-based Devlog)

**What it is:** Rich content pages for patch notes, devlogs, announcements.

**Block Types (MVP):**

| Block | Description |
|-------|-------------|
| `header` | Section title (H2, H3) |
| `text` | Rich text with markdown |
| `changelog` | Bullet list with icons (✅ Added, 🔧 Fixed, ❌ Removed) |
| `issues` | Known issues list |
| `image` | Single image with caption |
| `gallery` | Image grid (2-4 columns) |
| `video` | YouTube/Vimeo embed |
| `download` | Download button with platform icons |
| `cta` | Call-to-action button |
| `snapshot` | Embedded analytics snapshot |
| `playtest` | Campaign join card |
| `divider` | Visual separator |

**Builder UI:**
- Drag-and-drop block reordering
- Click "+" to add block
- Inline editing (click to edit)
- Preview mode toggle
- Auto-save drafts

**URL:** `playpulse.app/g/game-slug/updates/v0-3`

---

#### 5. Snapshots (Shareable Analytics)

**What it is:** Export analytics as images or embeddable widgets.

**Snapshot Types:**

| Type | Description |
|------|-------------|
| **Chart** | Single chart (bar, radar, donut) |
| **Table** | Stats comparison table |
| **Card** | Social share card (branded) |
| **Board** | Mini progress board |

**Export Options:**
- Download as PNG/WebP
- Copy embed code (iframe)
- Insert into Update page
- Share to Discord (webhook integration)

**Embed Widget:**
```html
<iframe 
  src="https://playpulse.app/embed/snapshot-id" 
  width="400" 
  height="300"
></iframe>
```

**Features:**
- Live-updating data (optional)
- Customizable theme (light/dark)
- Branded with game logo
- Works in Discord, websites, devlogs

---

#### 6. Progress Board (Live Dashboard)

**What it is:** Shareable live dashboard showing progress across versions.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Game Title - Progress Board              [Share 🔗] │
├─────────────────────────────────────────────────────────────┤
│ Version │ Date     │ Responses │ Fun   │ Difficulty │ Bugs │
│ ─────── │ ──────── │ ───────── │ ───── │ ────────── │ ──── │
│ v0.3    │ Jan 4    │ 47        │ 8.2 ↑ │ 6.1        │ 3.2 ↓│
│ v0.2    │ Dec 20   │ 32        │ 7.8   │ 5.8        │ 4.1  │
│ v0.1    │ Dec 1    │ 18        │ 7.1   │ 6.5        │ 5.3  │
├─────────────────────────────────────────────────────────────┤
│ [Trend Chart - Key metrics over versions]                   │
├─────────────────────────────────────────────────────────────┤
│ Top Improvements: Combat feel (+1.2), UI clarity (+0.8)     │
│ Areas to Watch: Tutorial confusion, Boss difficulty         │
└─────────────────────────────────────────────────────────────┘
```

**Visibility Options:**
- Private (default)
- Unlisted link (recommended for sharing)
- Public (discoverable)

**Share URL:** `playpulse.app/board/share-token`

---

#### 7. Discovery Dashboard (Public Front Page)

**What it is:** Steam-like discovery page for finding games to test.

**Sections:**

| Section | Content |
|---------|---------|
| **Trending Playtests** | Most responses this week |
| **Recently Updated** | Latest devlog posts |
| **Looking for Testers** | Active campaigns |
| **Browse by Tag** | Tag cloud + filter |
| **Featured** | Curated picks (future) |

**Filters:**
- Tags (multi-select)
- Platform (PC / Web / Mobile)
- Genre
- Sort: Trending / Recent / Most Tested

**URL:** `playpulse.app/discover`

---

#### 8. Advanced Analytics (Power Features)

**Compare Versions:**
- Side-by-side stat comparison
- Delta highlighting (+0.5, -0.3)
- Confidence indicators (sample size)
- "Most improved" / "Most worsened" callouts

**Segments:**
- Filter by platform
- New vs returning testers
- Date ranges
- Custom segments (future)

**Insights (AI-powered, future):**
- Keyword clustering for text answers
- "Top issues over time"
- "Biggest improvements since last version"
- Sentiment analysis

---

#### 9. Tester Features (Engagement)

**Why testers come back:**

| Feature | Description |
|---------|-------------|
| **My Tests** | Dashboard of games tested |
| **Tester XP** | Points for completing playtests |
| **Badges** | "Tested 10 games", "Early Adopter" |
| **Follow Games** | Get notified of new playtests |
| **Perks** | Devs can reward top testers (future) |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Transform Project → Game, add user profiles

**Tasks:**
- [ ] Update Prisma schema (User profile fields, Game entity)
- [ ] Migrate existing Projects to Games
- [ ] Profile settings page (username, bio, social links)
- [ ] Game CRUD (create, edit, delete)
- [ ] Game settings page with visibility controls
- [ ] Public profile page (`/@username`)
- [ ] Basic public game page (`/g/slug`)

**Deliverables:**
- Users can set up profiles
- Games have proper metadata (banner, logo, tags)
- Basic public pages exist

---

### Phase 2: Game Hub (Week 3)
**Goal:** Steam-style public game pages

**Tasks:**
- [ ] Game page layout (banner, info, media)
- [ ] Screenshot gallery component
- [ ] Video embed component
- [ ] Tags display and filtering
- [ ] Social links buttons
- [ ] "Follow" functionality
- [ ] Responsive design

**Deliverables:**
- Beautiful public game pages
- Follow system working

---

### Phase 3: Timeline Devlog (Week 4-5)
**Goal:** Block-based update/devlog system

**Tasks:**
- [ ] Update entity (schema, API)
- [ ] Block-based content model
- [ ] Block editor UI (add, edit, reorder, delete)
- [ ] Individual block components (text, image, changelog, etc.)
- [ ] Update page view
- [ ] Timeline component on game page
- [ ] Draft/publish workflow
- [ ] Auto-save

**Deliverables:**
- Devs can create rich devlog posts
- Timeline shows on game page

---

### Phase 4: Campaign Integration (Week 6)
**Goal:** Connect existing playtest engine to new structure

**Tasks:**
- [ ] Rename Form → Campaign in UI
- [ ] Add campaign status (Draft/Live/Closed)
- [ ] Link campaigns to updates (optional)
- [ ] Campaign visibility controls
- [ ] Response identity options
- [ ] "Join Playtest" flow from game page
- [ ] Campaign cards in updates

**Deliverables:**
- Seamless connection between devlogs and playtests
- Better campaign management

---

### Phase 5: Snapshots (Week 7-8)
**Goal:** Shareable analytics exports

**Tasks:**
- [ ] Snapshot entity (schema, API)
- [ ] Image export (html2canvas or server-side)
- [ ] Snapshot templates (chart, table, card)
- [ ] Snapshot library UI
- [ ] Embed widget route (`/embed/[id]`)
- [ ] Insert snapshot into update blocks
- [ ] Download options (PNG, WebP)
- [ ] Copy embed code

**Deliverables:**
- Export analytics as images
- Embeddable live widgets
- Snapshots in devlogs

---

### Phase 6: Progress Board (Week 9)
**Goal:** Shareable live dashboard

**Tasks:**
- [ ] Progress Board entity (schema, API)
- [ ] Board builder (select columns/stats)
- [ ] Board view page
- [ ] Share link generation
- [ ] Visibility controls
- [ ] Trend chart component
- [ ] Delta calculations
- [ ] Embed option

**Deliverables:**
- Live progress dashboards
- Shareable links for investors/press

---

### Phase 7: Discovery (Week 10)
**Goal:** Public front page for finding games

**Tasks:**
- [ ] Discovery page layout
- [ ] Trending algorithm (responses/engagement)
- [ ] Recently updated feed
- [ ] Active campaigns section
- [ ] Tag browsing/filtering
- [ ] Search functionality
- [ ] Game cards component
- [ ] Pagination/infinite scroll

**Deliverables:**
- Testers can discover games
- Games get organic traffic

---

### Phase 8: Advanced Analytics (Week 11-12)
**Goal:** Power features for serious devs

**Tasks:**
- [ ] Compare versions UI
- [ ] Side-by-side stat display
- [ ] Delta calculations and highlighting
- [ ] Confidence indicators
- [ ] Segments filtering
- [ ] Date range picker
- [ ] Export comparison data
- [ ] Insights tab (basic keyword extraction)

**Deliverables:**
- Version comparison
- Segment analysis
- Basic insights

---

### Future Phases (Backlog)

**Phase 9: Teams & Permissions**
- Team invites
- Role-based access (Admin, Editor, Viewer)
- Activity log

**Phase 10: Tester Engagement**
- Tester profiles
- XP and badges
- "My Tests" dashboard
- Notification preferences

**Phase 11: Monetization**
- Subscription tiers
- Usage limits
- Payment integration (Stripe)

**Phase 12: Scale & Polish**
- Performance optimization
- Anti-spam measures
- Custom branding
- API access
- Custom subdomains

---

## Monetization Strategy

### Free Tier
- 2 games
- 100 responses/month
- Private analytics only
- Basic snapshots
- Community support

### Creator ($9/month)
- Unlimited games
- 1,000 responses/month
- Compare versions
- Trend analysis
- Unlisted progress boards
- Snapshot templates
- Priority support

### Studio ($29/month)
- Everything in Creator
- 10,000 responses/month
- Team members (up to 5)
- Public progress boards
- Custom branding
- API access
- Export data
- Dedicated support

### Enterprise (Custom)
- Unlimited everything
- Custom integrations
- SLA
- Custom subdomain
- White-label options

---

## Technical Architecture

### Stack
- **Frontend:** Next.js 16, React, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** JWT (existing)
- **Hosting:** Vercel
- **Storage:** Vercel Blob or Cloudinary (images)
- **Analytics:** Vercel Analytics (optional)

### Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Block storage | JSON column | Flexible, no joins needed |
| Image export | html2canvas | Client-side, no server cost |
| Embed widgets | iframe + API | Simple, secure, cacheable |
| Real-time updates | Polling (MVP) | Simple, upgrade to WebSocket later |
| Search | PostgreSQL full-text | Good enough for MVP |

### API Structure

```
/api
├── /auth
│   ├── /login
│   ├── /register
│   └── /logout
├── /users
│   ├── /[username]
│   └── /me
├── /games
│   ├── GET (list public)
│   ├── POST (create)
│   └── /[slug]
│       ├── GET, PATCH, DELETE
│       ├── /updates
│       ├── /campaigns
│       ├── /snapshots
│       └── /board
├── /campaigns
│   └── /[id]
│       ├── /stats
│       ├── /questions
│       ├── /responses
│       └── /analytics
├── /embed
│   └── /[snapshotId]
└── /discover
    ├── /trending
    ├── /recent
    └── /search
```

---

## Success Metrics

### Phase 1-4 (Foundation)
- Games created
- Updates published
- Campaigns launched

### Phase 5-7 (Growth)
- Snapshots shared
- Progress board views
- Discovery page visits
- New user signups (testers)

### Phase 8+ (Engagement)
- Returning testers
- Responses per campaign
- Time on platform
- Conversion to paid

---

## Summary

PlayPulse evolves from a simple playtest form tool into a **complete indie game development platform** that combines:

1. **Playtest Analytics** (existing) - The engine
2. **Game Hub** (new) - The storefront
3. **Devlog System** (new) - The content
4. **Progress Boards** (new) - The proof
5. **Discovery** (new) - The growth

All tied together with a **privacy-first** approach that lets developers control exactly what they share and when.

---

*Last updated: January 4, 2026*
