# Installing Tailwind CSS with Vite

This guide covers installing Tailwind CSS as a Vite plugin — the most seamless way to integrate it with frameworks like Laravel, SvelteKit, React Router, Nuxt, and SolidJS.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

---

## Installation Steps

### Step 1: Create your project

Start by creating a new Vite project if you don't have one set up already:

```bash
npm create vite@latest my-project
cd my-project
```

### Step 2: Install Tailwind CSS

Install `tailwindcss` and `@tailwindcss/vite` via npm:

```bash
npm install tailwindcss @tailwindcss/vite
```

### Step 3: Configure the Vite plugin

Add the `@tailwindcss/vite` plugin to your Vite configuration:

**vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

### Step 4: Import Tailwind CSS

Add an `@import` to your CSS file that imports Tailwind CSS:

**CSS**
```css
@import "tailwindcss";
```

### Step 5: Start your build process

Run your build process with:

```bash
npm run dev
```

### Step 6: Start using Tailwind in your HTML

Make sure your compiled CSS is included in the `<head>` (your framework might handle this for you), then start using Tailwind's utility classes to style your content:

**HTML**
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="/src/style.css" rel="stylesheet">
  </head>
  <body>
    <h1 class="text-3xl font-bold underline">
      Hello world!
    </h1>
  </body>
</html>
```

---

## Alternative Installation Methods

| Method | Best For |
|--------|----------|
| [Using Vite](https://tailwindcss.com/docs/installation/using-vite) | Vite-based projects (Laravel, SvelteKit, React Router, Nuxt, SolidJS) |
| [Using PostCSS](https://tailwindcss.com/docs/installation/using-postcss) | Custom build processes, webpack, Parcel, or other build tools |
| [Tailwind CLI](https://tailwindcss.com/docs/installation/tailwind-cli) | Simple projects or when you don't want to configure a build tool |
| [Play CDN](https://tailwindcss.com/docs/installation/play-cdn) | Prototyping, learning, or small experiments |

---

## Troubleshooting

> **Note:** Setting up Tailwind with Vite can be a bit different across different build tools. Check the [framework guides](https://tailwindcss.com/docs/installation/framework-guides) to see if there are more specific instructions for your particular setup.

---

## How It Works

Tailwind CSS works by scanning all of your HTML files, JavaScript components, and any other templates for class names, generating the corresponding styles and then writing them to a static CSS file. It's fast, flexible, and reliable — with zero-runtime.
