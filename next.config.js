const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  ...(process.env.NETLIFY === 'true' && { target: 'serverless' }),
  images: {
    deviceSizes: [320, 500, 680, 1040, 2080, 2048, 3120],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'digitalpress.fra1.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'vitals.vercel-insights.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'adapterhub.ml' },
      { protocol: 'https', hostname: 'pair-code.github.io' },
      { protocol: 'https', hostname: 'layout-parser.github.io' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'losttapesofthe27club.com' },
      { protocol: 'https', hostname: 'miro.medium.com' },
      { protocol: 'https', hostname: 'static.gotsby.org' },
      { protocol: 'https', hostname: 'static.ghost.org' },
      { protocol: 'https', hostname: 'www.gatsbyjs.org' },
      { protocol: 'https', hostname: 'cdn.commento.io' },
      { protocol: 'https', hostname: 'gatsby.ghost.io' },
      { protocol: 'https', hostname: 'ghost.org' },
      { protocol: 'https', hostname: 'repository-images.githubusercontent.com' },
      { protocol: 'https', hostname: 'www.gravatar.com' },
      { protocol: 'https', hostname: 'github.githubassets.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com' },
    ],
  },
  reactStrictMode: true,
  // Provide an explicit (empty) turbopack config so Next 16 doesn't error
  turbopack: {},
})
