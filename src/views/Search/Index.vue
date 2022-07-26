<template>
  <div id="search">
    <SearchHeader
      v-model="filter.name"
      :history="searchHistoryList"
      @search="searchByName"
      @clear="resetName"
      @deleteHistory="deleteHistory"
      @clearHistory="clearHistory"
    >
      <Icon
        class="filter-icon"
        name="filter"
        :class="{ active: filterVisible }"
        @click="filterVisible = !filterVisible"
      />
    </SearchHeader>

    <transition enter-active-class="fade-in">
      <article
        v-show="filterVisible && !filterConfig.pending"
        class="search-filter"
      >
        <AwRadio
          v-model="filter.cate"
          label="分类"
          :options="filterConfig.cate"
          :right-cancle="false"
        />
        <AwRadio
          v-model="filter.type"
          label="类型"
          :options="filterConfig.cateInfo"
          :right-cancle="false"
          @change="searchByFilter(true)"
        />
        <AwRadio
          v-model="filter.order"
          label="排序"
          :options="SEARCH_FILTER.ORDER"
          :right-cancle="false"
          @change="searchByFilter(true)"
        />
        <AwRadio
          v-model="filter.year"
          label="年份"
          :options="SEARCH_FILTER.RELEASE_TIME"
          :right-cancle="false"
          @change="searchByFilter(true)"
        />
        <AwRadio
          v-model="filter.letter"
          label="字母"
          :options="SEARCH_FILTER.LETTER"
          :right-cancle="false"
          @change="searchByFilter(true)"
        />
      </article>
    </transition>
    <main ref="searchMainEl" class="search-main">
      <transition
        enter-active-class="animate__fadeIn"
        leave-active-class="animate__fadeOut"
      >
        <div v-show="isSearchFetching" class="search-main__loading">
          <LoadingCodeRun text="电波获取中，请稍后" />
        </div>
      </transition>
      <EmptyImgBlock
        v-show="isEmptySearch"
        content="什么信息都没找到，甚至还白嫖了顿饭~"
        height="60%"
      >
        <img src="~static/img/search-empty.png" style="width: 100%" alt="" />
      </EmptyImgBlock>
      <div class="search-main__content">
        <ComicCard
          v-for="comic in searchResult"
          :key="comic.id"
          :detail="comic"
        />
      </div>
    </main>
    <el-pagination
      v-show="searchResult.length > 0"
      v-model:currentPage="pager.currnet"
      class="search-page"
      :page-size="pager.size"
      layout="prev, pager, next, jumper"
      :total="pager.total"
      @current-change="
        hasSearchKey ? searchByName(false) : searchByFilter(false)
      "
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, shallowReactive } from 'vue'
import { getVal, wait, smoothPush } from 'adicw-utils'

import AwRadio from '@comps/Form/AwRadio.vue'
import ComicCard from './component/ComicCard.vue'
import SearchHeader from '@/components/Form/SearchHeader.vue'
import LoadingCodeRun from '@comps/Loading/LoadingCodeRun.vue'
import EmptyImgBlock from '@comps/Block/EmptyImgBlock.vue'

import { SEARCH_FILTER } from './statics/form'
import * as Api from '@/api'
import { ElNotification } from 'element-plus'
import { useSearchHistory } from '@/stores/searchHistory.store'
import { usePageOut } from '@/hooks/utils'

/**
 * 筛选模组
 * @param init 筛选模组就绪回调
 */
function filterModule(init: () => void) {
  /** 筛选信息 */
  const filter = reactive({
    name: '',
    cate: -1,
    type: '',
    order: 'time',
    letter: '',
    year: 0
  })
  /** 筛选参数 */
  const filterConfig = shallowReactive({
    pending: true,
    org: [] as Api.GetComicFilterConfig,
    get cate() {
      return this.org.map((item) => ({
        name: item.name,
        value: item.id
      }))
    },
    get cateInfo() {
      const info = this.org.find((item) => item.id === filter.cate)
      return !info ? [] : info.value
    }
  })
  const pager = reactive({
    currnet: 1,
    size: 24,
    total: 0
  })
  const filterVisible = ref(true)

  const resetPager = () => {
    pager.currnet = 1
    pager.total = 0
  }
  const resetFilter = () => {
    resetPager()
    Object.keys(filter).forEach((key) => {
      if (key !== 'name') {
        ;(filter as any)[key] = ''
      }
    })
  }
  const resetName = () => {
    filter.name = ''
    resetPager()
  }

  ;(async () => {
    filterConfig.org = await Api.getComicFilterConfig()
    if (filterConfig.org.length > 0) {
      filter.cate = filterConfig.org[0].id
      filter.type = getVal(() => filterConfig.org[0].value[0].value, '')
    }
    filterConfig.pending = false
    init()
  })()

  return {
    filter,
    filterConfig,
    pager,
    SEARCH_FILTER,
    filterVisible,
    resetFilter,
    resetName
  }
}
function searchHistoryModule() {
  const searchHistory = useSearchHistory()
  const searchHistoryList = computed(() => searchHistory.list)
  const deleteHistory = (v: string) => {
    searchHistory.delete(v)
  }
  const clearHistory = () => {
    searchHistory.clear()
  }
  return {
    searchHistoryList,
    deleteHistory,
    clearHistory
  }
}
export default defineComponent({
  name: 'Search',
  components: {
    AwRadio,
    ComicCard,
    LoadingCodeRun,
    EmptyImgBlock,
    SearchHeader
  },
  setup() {
    const searchMainEl = ref<HTMLElement>()
    const searchResult = ref<Api.ComicPageList[]>([])
    const searchHistory = useSearchHistory()

    /** 搜索延迟等待时间 */
    const FETCH_WAIT_TIME = 500
    /** 是否在搜索请求中 */
    const isSearchFetching = ref(false)
    /** 是否为空搜索结果 */
    const isEmptySearch = ref(false)
    const {
      filter,
      pager,
      filterVisible,
      resetName,
      resetFilter,
      ...filterModuleArgs
    } = filterModule(() => {
      searchByFilter()
    })

    const hasSearchKey = computed(() => filter.name !== '')

    const setSearchResult = (data: Api.ComicPageList[]) => {
      if (data.length === 0) {
        isEmptySearch.value = true
        ElNotification({
          type: 'error',
          title: '搜索',
          message: '未找到相关动漫'
        })
      }
      smoothPush(searchResult.value, data)
    }
    /**
     * 根据名称搜索
     * @param clear 是否清空历史
     */
    const searchByName = async (clear = true) => {
      if (!filter.name) return
      filterVisible.value = false
      isSearchFetching.value = true
      isEmptySearch.value = false
      searchMainEl.value!.scrollTop = 0
      clear && resetFilter()
      searchHistory.add(filter.name)
      const { data, total } = await Api.searchComic({
        name: filter.name,
        page: pager.currnet - 1
      })
      await wait(FETCH_WAIT_TIME)
      pager.total = total
      setSearchResult(data)
      isSearchFetching.value = false
    }
    /**
     * 根据筛选搜索
     * @param clear 是否清空历史
     */
    const searchByFilter = async (clear = true) => {
      isSearchFetching.value = true
      isEmptySearch.value = false
      searchMainEl.value!.scrollTop = 0
      clear && resetName()
      const { data, total } = await Api.filterComic({
        page: pager.currnet,
        type: filter.cate,
        category: filter.type,
        order: filter.order,
        year: filter.year,
        letter: filter.letter
      })
      await wait(FETCH_WAIT_TIME)
      pager.total = total
      setSearchResult(data)
      isSearchFetching.value = false
    }

    usePageOut(() => {
      searchHistory.save()
    })

    // onMounted(() => {
    //   searchByFilter()
    // })

    return {
      searchMainEl,
      filter,
      pager,
      isSearchFetching,
      filterVisible,
      searchResult,
      hasSearchKey,
      searchByFilter,
      searchByName,
      resetName,
      resetFilter,
      isEmptySearch,
      ...filterModuleArgs,
      ...searchHistoryModule()
    }
  }
})
</script>
<style lang="less" scoped>
@import '~styles/var';

#search {
  @rootGap: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: @rootGap;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .search {
    .box {
      background: var(--box-bg-color);
    }

    &-filter {
      .box;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      padding: 16px 30px;
      box-sizing: border-box;
      border-top-left-radius: var(--df-radius);
      border-bottom-left-radius: var(--df-radius);
      user-select: none;
    }

    &-main {
      .box;
      position: relative;
      flex: 1;
      border-top-left-radius: var(--df-radius);
      overflow-y: overlay;

      &__content {
        display: grid;
        grid-template-columns: repeat(var(--search-col-count), 1fr);
        gap: 24px;
        width: 100%;
        padding: 30px;
        box-sizing: border-box;
        animation-duration: 0.25s;
      }

      &__loading {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 4;
        background: var(--box-bg-color);
        animation-duration: 0.5s;
      }
    }

    &-page {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0 auto;
      width: max-content;
      padding: 12px 16px;
      background: #fff;
      border-radius: 15px;
      box-shadow: 0 -2px 14px rgb(0 0 0 / 14%);
      transition: all 0.25s;
      opacity: 0.2;
      transform: translateY(70%);

      &:hover {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  .filter-icon {
    color: var(--font-color);
    font-size: 28px;
    cursor: pointer;
    transition: all 0.25s;

    &.active {
      color: var(--primary-color);
    }

    &:hover {
      .active;
    }
  }
}
</style>
