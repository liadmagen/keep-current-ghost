const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  ...(process.env.NETLIFY === 'true' && { target: 'serverless' }),
  images: {
    deviceSizes: [320, 500, 680, 1040, 2080, 2048, 3120],
    domains: [
      'localhost',
      'digitalpress.fra1.cdn.digitaloceanspaces.com',
      'vitals.vercel-insights.com',
      'images.unsplash.com',
      'static.gotsby.org',
      'static.ghost.org',
      'www.gatsbyjs.org',
      'cdn.commento.io',
      'gatsby.ghost.io',
      'ghost.org',
      'repository-images.githubusercontent.com',
      'www.gravatar.com',
      'github.githubassets.com',
      'drive.google.com',
      'lh3.googleusercontent.com',
      'lh6.googleusercontent.com',
    ],
  },
  reactStrictMode: true,
})
