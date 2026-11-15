# VIVEK ARCADE

VIVEK ARCADE is a browser-based retro handheld portfolio. It presents a landscape dual-controller console with a pale-green LCD, pixel typography, tactile controls and a navigable game-like interface.

The project is intentionally designed as a console experience rather than a conventional portfolio page.

## Experience

The console has three physical sections:

- **Left controller**: analogue stick, D-pad and SELECT.
- **Central LCD**: boot sequence, title screen, menu, content pages and settings.
- **Right controller**: A/B/X/Y buttons, analogue stick, START and HOME.

The hardware styling uses a pink shell, turquoise left controller, coral right controller and a dark burgundy LCD bezel. The LCD uses separate header, content and footer regions so menus and descriptions do not overlap.

## Console navigation

### Hardware controls

| Control | Action |
| --- | --- |
| D-pad | Move through menus and scroll content |
| A | Open or select |
| B | Go back |
| X | Previous detail page |
| Y | Open resume |
| START | Begin, or return to the main menu |
| SELECT | Open settings |
| HOME | Return to the title screen |
| POWER | Turn the console on or off |

Both analogue sticks support touch and pointer interaction. The D-pad remains the primary menu navigation control.

### Keyboard controls

| Key | Action |
| --- | --- |
| Arrow keys | Navigate |
| Enter, Space, Z | A / select |
| Escape, Backspace, X | B / back |
| Q | X / previous page |
| Y | Resume |
| M | START |
| O | SELECT / settings |
| H | HOME |
| P | POWER |
| R | Resume |

The interface also supports keyboard focus, screen-reader labels and mobile pointer/touch controls.

## LCD content

The main menu contains:

- Introduction
- Projects
- Experience
- Technical Skills
- Achievements
- Contact
- Resume

Long content is split into pages and uses constrained scrolling. Settings include sound, CRT lines, larger text, accessible text content and keyboard help.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Main VIVEK ARCADE console |
| `/admin` | Protected content editor |
| `/resume` | Printable resume page |
| `/api/resume` | Latest resume PDF endpoint |
| `/classic` | Alternative conventional portfolio presentation |
| `/world` | Optional 3D portfolio world |

## Project structure

```text
app/
  page.tsx                 Main console route
  arcade.css               Console, LCD and hardware styling
  admin/                   Admin dashboard route
  api/                     Admin, resume and media endpoints
  classic/                 Conventional portfolio route
  resume/                  Printable resume route
  world/                   Optional 3D world route

components/
  arcade/                  Console, LCD and pixel UI
  admin/                   Admin editor and sync panels
  world/                   3D world components
  interface/               3D world interface

systems/
  nav.ts                   Pure console navigation state machine
  game.ts                  3D world game loop
  world.ts                 World movement and terrain logic

data/
  arcade.ts                Default arcade content and content adapters
  profile.ts               Seed profile data
  world.ts                 3D world destinations

content/
  portfolio.json           Editable portfolio content
  resume/                  Current resume and metadata
  media/                   Local media assets

lib/
  auth.ts                  Admin session and CSRF protection
  store.ts                 File-backed content/media storage
  validate.ts              Content validation
  gitsync.ts               GitHub synchronization
```

## Local development

Requirements:

- Node.js 18+
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production validation:

```bash
npm run build
npm run start
```

## Environment variables

Copy `.env.example` to `.env` and configure only the values needed for your deployment.

### Admin authentication

```env
ADMIN_PASSCODE=
SESSION_SECRET=
```

`SESSION_SECRET` should be a long random value. These values must never use the `NEXT_PUBLIC_` prefix.

### GitHub synchronization

```env
GITHUB_TOKEN=
GITHUB_REPOSITORY=owner/repository
GITHUB_BRANCH=main
GIT_AUTHOR_NAME=Portfolio Admin
GIT_AUTHOR_EMAIL=portfolio-admin@users.noreply.github.com
```

The token requires repository **Contents: Read and write** permission. Never commit `.env` or paste token values into source files.

On Vercel, portfolio content saves can use the GitHub Contents API when `VERCEL=1`. This avoids requiring the Git executable in the serverless runtime.

Resume and media management still use the file-backed storage layer and should be hosted on a writable backend or migrated to persistent storage before relying on those admin uploads in a serverless deployment.

### Public About image

The About Me image is configured through a public URL because the browser must download it:

```env
NEXT_PUBLIC_ABOUT_IMAGE_URL=
```

Vercel Blob is suitable for hosting this image. The URL is public by design; anyone who can view the page can download or screenshot the image.

### Optional 3D map styling

```env
NEXT_PUBLIC_MAPTILER_KEY=
```

## Admin mode

Visit `/admin` and enter the configured `ADMIN_PASSCODE`.

The dashboard supports:

- Editing arcade sections, items and pages
- Editing profile, experience, skills and resume links
- Managing resume metadata
- Managing media
- Validating content before save
- GitHub synchronization status
- Deployment status checks

The public pencil button opens the same admin authentication flow from non-admin routes.

## Accessibility

Accessibility is integrated into the console instead of being displayed as a large external card:

- Semantic buttons and headings
- ARIA labels for physical controls
- Keyboard navigation
- Focus-visible states
- Screen-reader text version inside Settings
- Larger text setting
- Separate content regions for LCD header, body and footer

## Content model

The editable content model is defined in [`lib/content-types.ts`](./lib/content-types.ts). Content is organized as:

```text
Content
  ├── site
  ├── profile
  └── sections
        └── items
              └── pages
                    └── blocks
```

Supported LCD blocks include paragraphs, headings, lists, statistics, chips, key/value rows, images and actions.

## Security notes

- Admin sessions use signed, HTTP-only, SameSite cookies.
- Admin API writes require an authenticated session and same-origin request header.
- Passcodes and GitHub tokens are server-side environment variables.
- Uploaded PDFs and images are checked by file content, not only file extension.
- SVG uploads are not accepted.
- `.env`, build output and admin backups are ignored by Git.

## Deployment

For Vercel:

1. Connect the repository to Vercel.
2. Add the required environment variables for the target environment.
3. Configure the Vercel Blob URL for `NEXT_PUBLIC_ABOUT_IMAGE_URL`.
4. Configure GitHub Contents permission if using admin content sync.
5. Redeploy after changing environment variables.

The public console is read-only for visitors. Admin content writes should be treated as GitHub-backed changes and verified through the deployment status shown in the dashboard.
