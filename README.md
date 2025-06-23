## Next.js App Router Course - Dashboard

- [Next Dashboard App](https://nextjs.org/learn/dashboard-app)

- [Next Dashboard Demo](https://next-learn-dashboard.vercel.sh/dashboard)

- [Next Dashboard Codes](https://github.com/vercel/next-learn/tree/main/dashboard/final-example)

- [Resources](https://nextjs.org/learn/dashboard-app/next-steps)

- [More Learns](https://nextjs.org/learn)

## installed

- postgresql (local postgresql@17)
- mongodb (not used)
- nginx (not used)

```bash
$ brew services list
$ pnpm install bcryptjs # bcrypt lib not work
$ pnpm dev
```

## Authentication & Authorization

```bash
$ openssl rand -base64 32
```

## Tips

- The `@/app/dashboard/page.js` page is an async server component. This allows you to use `await` to fetch data.
- `loading.tsx` is a special Next.js file built on top of React Suspense. It allows you to create fallback UI to show as a replacement while page content loads.
- `eslint-plugin-jsx-a11y` plugin in its ESLint config to help catch accessibility issues early.
- Email: user@nextmail.com / Password: 123456

## Quick Start

```bash
$ pnpm run dev
$ pnpm prisma studio
```
