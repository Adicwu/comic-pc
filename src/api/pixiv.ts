import { dfGetax } from '@/common/request/index'
import * as FnReturns from './type'
import * as ApiReturns from './api.type'
import { getVal } from 'adicw-utils'

// const BaseUrl = 'http://localhost:3001'
const BaseUrl = 'http://pixivapi.adicw.cn'

/**
 * 获取动漫的相关图片列表-来源pixiv
 * @param param
 */
export async function vilipixSearch({
  name = '',
  limit = 20,
  offset = 0,
  sort = 'hot'
}: {
  /** 动漫名称 */
  name?: string
  /** 分页大小 */
  limit?: number
  /** 偏移数量 */
  offset?: number
  sort?: ApiReturns.VilipixSearchSort
  type?: number
} = {}): Promise<FnReturns.VilipixSearch> {
  try {
    const realName = name
      .split(' ')[0]
      .split('/')[0]
      .split('(')[0]
      .replace(
        /(第一季|第二季|第四季|第五季|第六季|第七季|BD|无修|剧场版|？)/,
        ''
      )
    const { data } = await dfGetax<ApiReturns.VilipixSearch>(
      `https://www.vilipix.com/api/v1/picture/public?limit=${limit}&tags=${realName}&sort=${sort}&offset=${offset}`
    )
    return {
      list: getVal(() => data.data.rows, []).map((item) => ({
        date: item.created_at,
        title: item.title,
        orgurl: item.original_url,
        preurl: item.regular_url,
        id: item.picture_id,
        w: item.width,
        h: item.height,
        commentTotal: item.comment_total,
        likeTotal: item.like_total,
        tags: item.tags,
        total: item.page_total
      })),
      total: data?.data?.count || 0
    }
  } catch (e) {
    return {
      list: [],
      total: 0
    }
  }
}

/**
 * 获取动漫的相关图片列表-来源pixiv
 * @param param
 */
export async function vilipixRank({
  limit = 20,
  offset = 0,
  type = 0
}: {
  limit?: number
  offset?: number
  type?: number
} = {}): Promise<FnReturns.VilipixRank> {
  try {
    const { data } = await dfGetax<ApiReturns.VilipixRank>(
      `https://www.vilipix.com/api/v1/picture/ranking?limit=${limit}&offset=${offset}&type=${type}`
    )
    return {
      list: getVal(() => data.data.rows, []).map((item) => ({
        date: item.created_at,
        title: item.title,
        orgurl: item.original_url,
        preurl: item.regular_url,
        id: item.picture_id,
        w: item.width,
        h: item.height,
        commentTotal: item.comment_total,
        likeTotal: item.like_total,
        tags: item.tags,
        total: item.page_total
      })),
      total: data?.data?.count || 0
    }
  } catch (e) {
    return {
      list: [],
      total: 0
    }
  }
}

/**
 * 获取动漫图片详情，和vilipixSearch关联
 * @param id
 */
export async function getVilipixPicMain(
  id: string
): Promise<FnReturns.VilipixPicMain | null> {
  try {
    const { data } = await dfGetax<ApiReturns.VilipixIllust>(
      `${BaseUrl}/illust/${id}`
    )
    return {
      orgImgs: data.imgs,
      author: {
        id: data.authorId,
        avatar: data.authorAvatar,
        name: data.authorName
      }
    }
  } catch {
    return null
  }
}

/**
 * 获取首页热门tag
 * @returns
 */
export async function getVilipixHotTags() {
  try {
    const { data = [] } = await dfGetax<string[]>(`${BaseUrl}/hot-tags`)
    return data.slice(0, 10)
  } catch {
    return []
  }
}
