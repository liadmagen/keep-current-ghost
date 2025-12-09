import { parse as urlParse, UrlWithStringQuery } from 'url'
import GhostContentAPI, { Params, PostOrPage, SettingsResponse, Pagination, PostsOrPages, Tag, Author } from '@tryghost/content-api'
import { normalizePost } from '@lib/ghost-normalize'
import { Node } from 'unist'
import { collections as config } from '@routesConfig'
import { Collections } from '@lib/collections'

import { ghostAPIUrl, ghostAPIKey, processEnv, ProcessEnvProps } from '@lib/processEnv'
import { imageDimensions, normalizedImageUrl, Dimensions } from '@lib/images'
import { IToC } from '@lib/toc'

import { contactPage } from '@appConfig'

export interface NextImage {
  url: string
  dimensions: Dimensions
}

export interface NavItem {
  url: string
  label: string
}

interface BrowseResults<T> extends Array<T> {
  meta: { pagination: Pagination }
}

export interface GhostSettings extends SettingsResponse {
  processEnv: ProcessEnvProps
  secondary_navigation?: NavItem[]
  iconImage?: NextImage
  logoImage?: NextImage
  coverImage?: NextImage
}

export interface GhostTag extends Tag {
  featureImage?: NextImage
}

export interface GhostAuthor extends Author {
  profileImage?: NextImage
}

export interface GhostPostOrPage extends PostOrPage {
  featureImage?: NextImage | null
  htmlAst?: Node | null
  toc?: IToC[] | null
}

export interface GhostPostsOrPages extends BrowseResults<GhostPostOrPage> {}

export interface GhostTags extends BrowseResults<GhostTag> {}

export interface GhostAuthors extends BrowseResults<GhostAuthor> {}

const api = ghostAPIUrl ? new GhostContentAPI({
  url: ghostAPIUrl,
  key: ghostAPIKey,
  version: 'v6.3.1',
}) : null
const hasApi = !!api

const postAndPageFetchOptions: Params = {
  limit: 'all',
  include: ['tags', 'authors', 'count.posts'],
  order: ['featured DESC', 'published_at DESC'],
}

const tagAndAuthorFetchOptions: Params = {
  limit: 'all',
  include: 'count.posts',
}

const postAndPageSlugOptions: Params = {
  limit: 'all',
  fields: 'slug',
}

const excludePostOrPageBySlug = () => {
  if (!contactPage) return ''
  return 'slug:-contact'
}

// helpers
export const createNextImage = async (url?: string | null): Promise<NextImage | undefined> => {
  if (!url) return undefined
  const normalizedUrl = await normalizedImageUrl(url)
  const dimensions = await imageDimensions(normalizedUrl)
  return (dimensions && { url: normalizedUrl, dimensions }) || undefined
}

async function createNextFeatureImages(nodes: BrowseResults<Tag | PostOrPage>): Promise<GhostTags | PostsOrPages> {
  const { meta } = nodes
  const images = await Promise.all(nodes.map((node) => createNextImage(node.feature_image)))
  const results = nodes.map((node, i) => ({ ...node, ...(images[i] && { featureImage: images[i] }) }))
  return Object.assign(results, { meta })
}

async function createNextProfileImages(nodes: BrowseResults<Author>): Promise<GhostAuthors> {
  const { meta } = nodes
  const images = await Promise.all(nodes.map((node) => createNextImage(node.profile_image)))
  const results = nodes.map((node, i) => ({ ...node, ...(images[i] && { profileImage: images[i] }) }))
  return Object.assign(results, { meta })
}

export async function createNextProfileImagesFromAuthors(nodes: Author[] | undefined): Promise<Author[] | undefined> {
  if (!nodes) return undefined
  const images = await Promise.all(nodes.map((node) => createNextImage(node.profile_image)))
  return nodes.map((node, i) => ({ ...node, ...(images[i] && { profileImage: images[i] }) }))
}

async function createNextProfileImagesFromPosts(nodes: BrowseResults<PostOrPage>): Promise<PostsOrPages> {
  const { meta } = nodes
  const authors = await Promise.all(nodes.map((node) => createNextProfileImagesFromAuthors(node.authors)))
  const results = nodes.map((node, i) => ({ ...node, ...(authors[i] && { authors: authors[i] }) }))
  return Object.assign(results, { meta })
}

export async function getAllSettings(): Promise<GhostSettings> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const settings = await api!.settings.browse()
    settings.url = settings?.url?.replace(/\/$/, ``)

    const iconImage = await createNextImage(settings.icon)
    const logoImage = await createNextImage(settings.logo)
    const coverImage = await createNextImage(settings.cover_image)

    const result = {
      processEnv,
      ...settings,
      ...(iconImage && { iconImage }),
      ...(logoImage && { logoImage }),
      ...(coverImage && { coverImage }),
    }
    return result
  } catch (err) {
    // If the Ghost CMS is unreachable (e.g. offline dev), return minimal defaults
    console.warn('getAllSettings: failed to fetch settings from Ghost API, using defaults.', err)
    return {
      processEnv,
      title: 'Site',
      description: '',
      url: processEnv.siteUrl || '',
    } as unknown as GhostSettings
  }
}

export async function getAllTags(): Promise<GhostTags> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const tags = await api!.tags.browse(tagAndAuthorFetchOptions)
    return await createNextFeatureImages(tags)
  } catch (err) {
    console.warn('getAllTags: failed to fetch tags from Ghost API, returning empty list.', err)
    return Object.assign([], { meta: { pagination: { page: 1, limit: 0, pages: 0, total: 0 } } }) as unknown as GhostTags
  }
}

export async function getAllAuthors() {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const authors = await api!.authors.browse(tagAndAuthorFetchOptions)
    return await createNextProfileImages(authors)
  } catch (err) {
    console.warn('getAllAuthors: failed to fetch authors from Ghost API, returning empty list.', err)
    return Object.assign([], { meta: { pagination: { page: 1, limit: 0, pages: 0, total: 0 } } }) as unknown as GhostAuthors
  }
}

export async function getAllPosts(props?: { limit: number }): Promise<GhostPostsOrPages> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const posts = await api!.posts.browse({
      ...postAndPageFetchOptions,
      filter: excludePostOrPageBySlug(),
      ...(props && { ...props }),
    })
    const results = await createNextProfileImagesFromPosts(posts)
    return await createNextFeatureImages(results)
  } catch (err) {
    console.warn('getAllPosts: failed to fetch posts from Ghost API, returning empty list.', err)
    return Object.assign([], { meta: { pagination: { page: 1, limit: 0, pages: 0, total: 0 } } }) as unknown as GhostPostsOrPages
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const posts = await api!.posts.browse(postAndPageSlugOptions)
    return posts.map((p) => p.slug)
  } catch (err) {
    console.warn('getAllPostSlugs: failed to fetch post slugs from Ghost API, returning empty list.', err)
    return []
  }
}

export async function getAllPages(props?: { limit: number }): Promise<GhostPostsOrPages> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const pages = await api!.pages.browse({
      ...postAndPageFetchOptions,
      filter: excludePostOrPageBySlug(),
      ...(props && { ...props }),
    })
    return await createNextFeatureImages(pages)
  } catch (err) {
    console.warn('getAllPages: failed to fetch pages from Ghost API, returning empty list.', err)
    return Object.assign([], { meta: { pagination: { page: 1, limit: 0, pages: 0, total: 0 } } }) as unknown as GhostPostsOrPages
  }
}

// specific data by slug
export async function getTagBySlug(slug: string): Promise<Tag> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    return await api!.tags.read({
      ...tagAndAuthorFetchOptions,
      slug,
    })
  } catch (err) {
    console.warn(`getTagBySlug: failed to fetch tag ${slug} from Ghost API. Returning empty tag.`, err)
    return {} as unknown as Tag
  }
}
export async function getAuthorBySlug(slug: string): Promise<GhostAuthor> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const author = await api!.authors.read({
      ...tagAndAuthorFetchOptions,
      slug,
    })
    const profileImage = await createNextImage(author.profile_image)
    const result = {
      ...author,
      ...(profileImage && { profileImage }),
    }
    return result
  } catch (err) {
    console.warn(`getAuthorBySlug: failed to fetch author ${slug} from Ghost API. Returning empty author.`, err)
    return {} as unknown as GhostAuthor
  }
}

export async function getPostBySlug(slug: string): Promise<GhostPostOrPage | null> {
  let result: GhostPostOrPage
  try {
    if (!hasApi) return null
    const post = await api.posts.read({
      ...postAndPageFetchOptions,
      slug,
    })
    // older Ghost versions do not throw error on 404
    if (!post) return null

    const { url } = await getAllSettings()
    result = await normalizePost(post, (url && urlParse(url)) || undefined)
  } catch (error: any) {
    if (error?.response?.status !== 404) throw new Error(error)
    return null
  }
  return result
}

export async function getPageBySlug(slug: string): Promise<GhostPostOrPage | null> {
  let result: GhostPostOrPage
  try {
    if (!hasApi) return null
    const page = await api.pages.read({
      ...postAndPageFetchOptions,
      slug,
    })

    // older Ghost versions do not throw error on 404
    if (!page) return null

    const { url } = await getAllSettings()
    result = await normalizePost(page, (url && urlParse(url)) || undefined)
  } catch (error: any) {
    if (error?.response?.status !== 404) throw new Error(error)
    return null
  }
  return result
}

// specific data by author/tag slug
export async function getPostsByAuthor(slug: string): Promise<GhostPostsOrPages> {
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const posts = await api!.posts.browse({
      ...postAndPageFetchOptions,
      filter: `authors.slug:${slug}`,
    })
    return await createNextFeatureImages(posts)
  } catch (err) {
    console.warn(`getPostsByAuthor: failed to fetch posts for author ${slug}, returning empty list.`, err)
    return Object.assign([], { meta: { pagination: { page: 1, limit: 0, pages: 0, total: 0 } } }) as unknown as GhostPostsOrPages
  }
}

export async function getPostsByTag(slug: string, limit?: number, excludeId?: string): Promise<GhostPostsOrPages> {
  const exclude = (excludeId && `+id:-${excludeId}`) || ``
  try {
    if (!hasApi) throw new Error('Ghost API not configured')
    const posts = await api!.posts.browse({
      ...postAndPageFetchOptions,
      ...(limit && { limit: `${limit}` }),
      filter: `tags.slug:${slug}${exclude}`,
    })
    return await createNextFeatureImages(posts)
  } catch (err) {
    console.warn(`getPostsByTag: failed to fetch posts for tag ${slug}, returning empty list.`, err)
    return Object.assign([], { meta: { pagination: { page: 1, limit: 0, pages: 0, total: 0 } } }) as unknown as GhostPostsOrPages
  }
}

// Collections
export const collections = new Collections<PostOrPage>(config)
