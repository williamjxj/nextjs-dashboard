## Next.js App Router Course - Starter

[vercel/next-learn/tree/main/dashboard/final-example](https://github.com/vercel/next-learn/tree/main/dashboard/final-example)

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## installed

- postgresql
- mongodb
- nginx

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
-