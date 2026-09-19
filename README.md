# errno.help

A plain, text-first reference and calculator for the things IT and developer
work throws at you — error codes, subnets, tokens, hashes, cron strings. You
have something cryptic; this site helps you make sense of it.

No account, no tracking, no clutter — most tools run entirely in your
browser and never touch a server.

## Tools

**Network & security**
- CIDR / IPv4 calculator — network, broadcast, mask, usable hosts
- DNS lookup — A, AAAA, MX, TXT, NS, CNAME
- WHOIS / RDAP — domain and IP registration data
- ASN lookup — IP to autonomous system, or AS details
- GeoIP lookup — approximate country, city, coordinates
- Port checker — common ports, rate-limited

**Encoding & data**
- JWT decoder — header, payload, claims, decoded locally
- Hash generator — SHA-256, SHA-1, MD5, and more
- UUID / password generator — cryptographically random
- YAML ⇄ JSON — convert and validate
- Cron parser — human-readable schedule

**Windows & commands**
- Windows error / event ID lookup — backed by a local reference database
- Command builders — Robocopy, chmod, kubectl

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- A handful of small, focused libraries for the harder lookups (cron
  parsing, RDAP, YAML) — see [`OPEN_SOURCE_NOTICES.md`](./OPEN_SOURCE_NOTICES.md)
  for the full list of dependencies and their licenses.

Most tools (CIDR, JWT, hashing, UUID/password, YAML, cron, Windows lookups,
command builders) run entirely client-side. A few (DNS, WHOIS, ASN, GeoIP,
port checker) call a small server route that talks to an upstream service,
so API keys never reach the browser.

## Getting started

```bash
git clone https://github.com/ssakhavat/errno-help.git
cd errno-help
npm install
```

Create a `.env.local` file for the tools that need a server-side API key:

```bash
# .env.local
IPINFO_TOKEN=your_ipinfo_io_token
```

`IPINFO_TOKEN` is used by the GeoIP lookup ([ipinfo.io](https://ipinfo.io)).
The rest of the tools work without any environment variables.

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the project
- `npm run license-report` — regenerate `OPEN_SOURCE_NOTICES.md` from the
  installed dependency tree

## License

[MIT](./LICENSE)
