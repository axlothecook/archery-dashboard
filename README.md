# Archery club dashboard
The admin dashboard of the archery club website. A separate SvelteKit app where club admins manage the public site content. It talks to the same Express API backend as the public site and runs on my Raspberry Pi as a Docker container, also served under the same origin as the public site.
<br />
<br />

### Log in page
![image](https://github.com/user-attachments/assets/ed0d0e1d-20d9-4660-9dea-8fa18e91c0a2)

### Dashboard homepage
![image](https://github.com/user-attachments/assets/755b5e1f-e2f4-44b5-8344-d348a9175e0f)

## Why a separate repo, but the same origin
Login works with a session cookie (`__Host-session`: HttpOnly, Secure, SameSite=Lax). For that cookie to survive strict browsers, like Safari, Firefox, Brave on both phone and laptop, the dashboard and the API have to be same-site. A separate dashboard domain would make the cookie cross-site, and browsers drop those. So the dashboard is a separate repo but not a separate origin, as in production, nginx serves it under the same hostname as the public site, on its own paths (/prijava, /nadzorna-ploca and a few more).
<br />

## How access is checked
The diagram below shows what happens when someone opens the dashboard. A guard runs on the server and asks the backend who the visitor is; logged-out visitors get redirected to the login page. The guard is only the first check though: the backend re-checks the session on every single write, so the browser is never trusted.

![image](https://github.com/user-attachments/assets/bc331de1-d76a-4155-85ba-51c258ffb834)
<br />

## Features
<ul>
  <li>receives inquiries sent through contact forms</li>
  <li>manages replies to inquiries from the inbox built into the dashboard, hosts admin invites (72h link) and password-reset (30-min link) pages</li>
  <li>CRUD functionality of most public site data like posts, events, team roster, sponsor descriptions, archer bios, achievement titles, event names, any article text</li>
  <li>CRUD functionality of the image files in those sections (and video, for posts only)</li>
  <li>publish workflow for posts, events and archers - draft, published and hidden - which controls their visibility on the public site</li>
  <li>CRUD functionality of events' categories</li>
  <li>used to change passwords</li>
  <li>has an FAQ page</li>
  <li>fully responsive, with a dedicated mobile pass across every page</li>
  <li>some features like each admin's profile data edits, problem & site ideas reporting, admin account management (CRUD of each member) and more only have UI in place; they are planned to be implemented if the website gets adopted by the official club as their new official website due to the amount of effort they require</li>
</ul>
<br />

## Testing
The login flow, the check that redirects logged-out visitors, profile form validation, the email helpers and the password rules are covered by 82 unit tests. They run in CI together with the type check before every deploy; if any fail, nothing gets deployed. The deployment pipeline itself is explained in [homelab-ci-cd](https://github.com/axlothecook/homelab-ci-cd).
<br />
<br />

## Tech stack
[SvelteKit 2](https://svelte.dev/docs/kit) / [Svelte 5 (runes)](https://svelte.dev): whole app <br />
[adapter-node](https://svelte.dev/docs/kit/adapter-node): builds the app into a self-contained Node server; it's what runs inside the Docker container on the Pi <br />
[Vite 8](https://vite.dev): used for building and development server <br />
[Sass](https://sass-lang.com) + [axlothecook-sass-library](https://github.com/axlothecook/axlothecook-sass-library): styling <br />
[@fontsource/inter](https://fontsource.org/fonts/inter): fonts <br />
auth: no auth library; the backend owns the sessions, the dashboard forwards the `__Host-session` cookie and redirects when the backend says no
<br />
<br />

## Types
The dashboard keeps its own local TypeScript types instead of the shared [archery-contracts](https://github.com/axlothecook/Archery-contracts) package. That is a known tradeoff (types can drift from what the backend sends) and it is documented in the contracts repo.
