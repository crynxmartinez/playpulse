# PatchPlay Codebase Audit - Comprehensive Findings

**Date:** March 10, 2026  
**Status:** In Progress

---

## 🔴 CRITICAL ISSUES

### 1. URL Routing Inconsistency (High Priority)
**Problem:** Mixed usage of `/game/[id]` and `/g/[slug]` throughout the codebase.

**Current State:**
- `/g/[slug]` route exists and works correctly with redirects from `/game/[id]`
- Many components still hardcode `/game/[id]` URLs instead of using slugs

**Files Using Old `/game/[id]` Pattern:**
1. `src/components/GamePageView.tsx:32` - `const gamePageUrl = '/game/${project.id}'`
2. `src/components/ProjectHeader.tsx:20` - `const gamePageUrl = '/game/${project.id}'`
3. `src/components/PublicGamePage.tsx:245` - Share URL uses ID instead of slug
4. `src/app/discover/page.tsx:256` - Links use `/game/${game.id}`
5. `src/lib/notifications.ts:98,133,164` - Notification links use `/game/${projectId}`

**Impact:**
- Users see ugly ID-based URLs instead of clean slug URLs
- SEO impact - inconsistent canonical URLs
- Poor user experience

**Fix Required:**
Update all components to use: `project.slug ? '/g/${project.slug}' : '/game/${project.id}'`

---

## 🟡 MEDIUM PRIORITY ISSUES

### 2. Deprecated API Routes Still Present
**Problem:** Old API routes marked as deprecated but not removed.

**Files:**
- `src/app/api/projects/[id]/versions/[versionId]/sections/[sectionId]/route.ts`
- `src/app/api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks/[blockId]/route.ts`
- `src/app/api/projects/[id]/versions/[versionId]/sections/route.ts`
- `src/app/api/projects/[id]/versions/[versionId]/sections/[sectionId]/blocks/route.ts`

**Impact:**
- Code bloat
- Confusion for developers
- Potential security risk if accidentally used

**Fix Required:**
Delete these deprecated routes entirely.

---

### 3. TypeScript Type Safety Issues
**Problem:** Excessive use of `(prisma as any)` and `any` types.

**Examples:**
- `src/app/api/auth/register/route.ts:7` - `const db = prisma as any`
- `src/app/api/auth/forgot-password/route.ts:16` - `await (prisma as any).user.findUnique`
- `src/app/g/[slug]/forum/[threadId]/page.tsx:79` - `map((reply: any) =>`

**Impact:**
- Loss of type safety
- Potential runtime errors
- Harder to maintain

**Fix Required:**
- Regenerate Prisma client properly
- Remove `as any` casts once forum models are in generated client
- Add proper type definitions

---

### 4. Missing Slug in Project Creation
**Problem:** When creating new projects, slug might not be generated/saved properly.

**Files to Check:**
- `src/app/dashboard/games/new/page.tsx` - Form submission
- `src/app/api/projects/route.ts` - Project creation endpoint

**Impact:**
- New projects won't have slugs
- Will always use ID-based URLs

**Fix Required:**
Verify slug is being saved during project creation.

---

## 🟢 LOW PRIORITY / IMPROVEMENTS

### 5. Inconsistent Error Handling
**Problem:** Some API routes have comprehensive error handling, others don't.

**Examples of Good Error Handling:**
- Forum API routes have try-catch with proper status codes

**Examples of Poor Error Handling:**
- Some routes just console.error without returning proper responses

**Fix Required:**
Standardize error handling across all API routes.

---

### 6. Missing Loading States
**Problem:** Some pages don't show loading indicators during data fetching.

**Impact:**
- Poor UX - users see blank screens
- Confusion about whether page is working

**Fix Required:**
Add loading skeletons/spinners to all async pages.

---

### 7. Hardcoded URLs and Magic Strings
**Problem:** URLs and strings scattered throughout codebase.

**Examples:**
- `'https://www.patchplay.live'` hardcoded in multiple places
- Email templates have hardcoded domain
- Tab names like 'updates', 'analytics', 'feedback' not centralized

**Fix Required:**
- Create constants file for URLs
- Use environment variables for domains
- Centralize tab/route names

---

### 8. Unused Imports and Dead Code
**Problem:** Potential unused code throughout the project.

**Fix Required:**
Run ESLint with unused imports rule and clean up.

---

## 📋 CHECKLIST FOR FIXES

### Phase 1: Critical Fixes (Do First)
- [ ] Update all `/game/[id]` references to use slug-first pattern
- [ ] Fix PublicGamePage.tsx share URL to use slug
- [ ] Fix GamePageView.tsx toggle URL to use slug
- [ ] Fix ProjectHeader.tsx toggle URL to use slug
- [ ] Fix notifications.ts to use slug
- [ ] Fix discover page links to use slug

### Phase 2: Cleanup
- [ ] Delete deprecated API routes
- [ ] Remove `(prisma as any)` casts after Prisma regeneration
- [ ] Verify project creation saves slug properly

### Phase 3: Improvements
- [ ] Standardize error handling
- [ ] Add loading states
- [ ] Create constants file
- [ ] Clean up unused imports

---

## 🔍 AREAS REQUIRING DEEPER INVESTIGATION

1. **Forum Feature Integration**
   - Verify all forum routes work with slug-based URLs
   - Check if forum notifications use correct URLs

2. **Update/Version Pages**
   - Check if update pages use slug correctly
   - Verify version detail pages work

3. **Authentication Flow**
   - Verify redirects after login use correct URLs
   - Check email verification links

4. **API Response Consistency**
   - Some APIs return `{ data }`, others return `{ project }`
   - Standardize response format

---

## 📊 STATISTICS

- **Total API Routes:** ~50+
- **Routes Using Old URL Pattern:** 7 identified
- **Deprecated Routes:** 4 files
- **Type Safety Issues:** 10+ instances of `as any`

---

## NEXT STEPS

1. Start with Phase 1 critical fixes (URL routing)
2. Test thoroughly after each fix
3. Move to cleanup phase
4. Document all changes

