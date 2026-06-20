# Spicy Lyrics

### Check out our *[Sitee](https://yoursit.ee/lyrics)*
#### Make your own at -> [https://yoursit.ee](https://yoursit.ee)

# How to install Spicy Lyrics

## 1. Using the Spicetify Marketplace (recommended)
1. Search `Spicy Lyrics` under the "Extensions" tab
2. Click the Install button on the Spicy Lyrics extension
3. All done!

## 2. Externally (not recommended)
1. Make sure you have [Spicetify](https://spicetify.app) installed
2. Build the local custom version with `bun run build` or use `install-spicy-lyrics.bat`
3. Copy both [spicy-lyrics.js](./dist/spicy-lyrics.js) and [spicy-lyrics.mjs](./builds/spicy-lyrics.mjs) into the Spicetify Extensions directory. Find the correct directory here: [https://spicetify.app/docs/customization/extensions#manual-installation](https://spicetify.app/docs/customization/extensions#manual-installation)
4. Then, run ```spicetify config extensions spicy-lyrics.js```
5. Then apply Spicetify by running ```spicetify apply```
6. All done!

## Keeping this custom branch up to date

If you are using the custom visualizer branch from this workspace, use the upstream-safe workflow in [docs/UPSTREAM_UPDATES.md](./docs/UPSTREAM_UPDATES.md).

Quick commands:

```bash
bun run upstream:check
bun run upstream:update
update-from-upstream.bat
```

[![Github Version](https://img.shields.io/github/v/release/spikerko/spicy-lyrics)](https://github.com/spikerko/spicy-lyrics/) [![Github Stars badge](https://img.shields.io/github/stars/spikerko/spicy-lyrics?style=social)](https://github.com/spikerko/spicy-lyrics/) [![Discord Badge](https://dcbadge.limes.pink/api/server/uqgXU5wh8j?style=flat)](https://discord.com/invite/uqgXU5wh8j)

Hi, I'm Spikerko (the person who made this repo). I've been really passionate about this project, and I'm really happy for this project.

I've seen a problem with the Spotify Lyrics. They're plain, just static colors. So I wanted to build my own version. And here it is: **Spicy Lyrics**. Hope you like it!

![Extension Example](./previews/page.gif)


*Inspired by [Beautiful Lyrics](https://github.com/surfbryce/beautiful-lyrics)*
