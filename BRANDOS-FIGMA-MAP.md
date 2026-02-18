# BrandOS — Figma ↔ Code Mapping

> Figma File: `Q57Xjt6icQZbHK80yskDbk`
> URL: https://www.figma.com/design/Q57Xjt6icQZbHK80yskDbk

## Pages (12 screens captured)

| Page | Figma Root Node | Route |
|------|----------------|-------|
| Landing Page | `0:3` | `/` |
| Onboarding Welcome | `2:2` | `/app` (fresh) |
| Dashboard Home | `3:3` | `/app` (Home tab) |
| Define - Brand DNA | `4:2` | `/app` (Define tab) |
| Check - Content Analysis | `5:2` | `/app` (Check tab) |
| Generate - Create | `6:2` | `/app` (Generate > Create) |
| Generate - Brand Kit | `7:2` | `/app` (Generate > Brand Kit) |
| Scale - Analytics | `8:2` | `/app` (Scale > Analytics) |
| Scale - History | `9:2` | `/app` (Scale > History) |
| Scale - Export | `10:2` | `/app` (Scale > Export) |
| Generate - AI Studio | `11:2` | `/app` (Generate > AI Studio) |
| Generate - Platforms | `12:2` | `/app` (Generate > Platforms) |

## Component → Figma Node Mapping

### Core Layout Components

| Component | Source File | Figma Node(s) |
|-----------|------------|---------------|
| LandingPage | `src/app/page.tsx` | `0:6` |
| HomeContent (App Shell) | `src/app/app/page.tsx` | `3:3`, `4:2`–`12:2` |
| PhaseNavigation | `src/components/PhaseNavigation.tsx` | `3:214`, `4:281`, `5:29`, `6:373`, `7:587`, `8:123`, `9:21`, `10:201`, `11:208`, `12:75` |
| BrandOSLogo | `src/components/BrandOSLogo.tsx` | `2:36`, `3:216`, `4:284`, `5:32`, `6:376`, `7:590`, `8:126`, `9:24`, `10:204`, `11:211`, `12:78` |
| SwissBackground | `src/components/SwissBackground.tsx` | `2:25`, `3:5` |
| FeedbackButton | `src/components/FeedbackButton.tsx` | `0:58`, `2:19`, `3:270`, `4:349`, `5:97`, `6:442`, `7:656`, `8:189`, `9:87`, `10:267`, `11:277`, `12:144` |

### Landing Page

| Component | Source File | Figma Node |
|-----------|------------|------------|
| XBrandScoreHero | `src/components/XBrandScoreHero.tsx` | `0:8`, `0:46` |
| ScoreRing (in hero) | `src/components/ScoreRing.tsx` | (nested in `0:8`) |

### Onboarding

| Component | Source File | Figma Node |
|-----------|------------|------------|
| OnboardingWizard | `src/components/OnboardingWizard.tsx` | `2:5`, `2:7`, `2:34` |

### Dashboard (Home Phase)

| Component | Source File | Figma Node |
|-----------|------------|------------|
| DashboardHome | `src/components/dashboard/DashboardHome.tsx` | `3:10` |
| BrandScoreCard | `src/components/dashboard/BrandScoreCard.tsx` | `3:12` |
| QuickStatsCard | `src/components/dashboard/QuickStatsCard.tsx` | `3:54` |
| RecentPostsCard | `src/components/dashboard/RecentPostsCard.tsx` | `3:98` |
| AIInsightsPanel | `src/components/dashboard/AIInsightsPanel.tsx` | `3:106` |
| PhaseQuickAccess | `src/components/dashboard/PhaseQuickAccess.tsx` | `3:134` |

### Define Phase

| Component | Source File | Figma Node |
|-----------|------------|------------|
| BrandCompleteness | `src/components/BrandCompleteness.tsx` | `4:13` |

### Check Phase

| Component | Source File | Figma Node |
|-----------|------------|------------|
| ContentCheck | `src/components/ContentCheck.tsx` | (in page `5:2`) |

### Generate Phase

| Component | Source File | Figma Node |
|-----------|------------|------------|
| ContentWorkflow | `src/components/workflow/ContentWorkflow.tsx` | (in page `6:2`) |
| BrandDNANode | `src/components/workflow/BrandDNANode.tsx` | `6:144` |
| BrandKitCanvas | `src/components/brandkit/BrandKitCanvas.tsx` | `7:5` |
| AIStudio | `src/components/AIStudio.tsx` | `11:13` |

### Scale Phase

| Component | Source File | Figma Node |
|-----------|------------|------------|
| BrandCompleteness (Scale) | `src/components/BrandCompleteness.tsx` | `8:15` |
| ExportBrandGuidelines | `src/components/ExportBrandGuidelines.tsx` | (in page `10:2`) |

## FigJam Architecture Diagrams

| Diagram | Description |
|---------|-------------|
| BrandOS - User Flow | Landing → Onboarding → Dashboard → 5 phases |
| BrandOS - Components | Full component hierarchy tree |
| BrandOS - Navigation | Phase state machine with unlock conditions |
| BrandOS - AI Agents | 6-agent orchestration flow |
| BrandOS - Data Flow | Zustand → Components → API → DB |

## Design System

Full token documentation: `BRANDOS-DESIGN-SYSTEM.md`

Key tokens:
- Background: `#E8E8ED` | Accent: `#0A84FF` | Swiss Blue: `#2F54EB` | Orange: `#FA8C16`
- 6 custom fonts: Blauer Nue, PP Mondwest, VCR OSD Mono, PP NeueBit, Russo One, Mac Minecraft
- Spring animations: snappy (300ms), default (550ms), gentle (650ms), bouncy (1100ms)
- Radius: sm(8) / md(12) / lg(16) / xl(20) / pill(9999)

## Notes

- Code Connect API requires Developer seat on Organization/Enterprise Figma plan
- This file serves as the manual mapping reference until Code Connect is available
- Figma file contains all screens as separate pages with editable layers
- Node IDs follow pattern `{page}:{node}` where page 0=Landing, 2=Onboarding, 3=Dashboard, etc.
