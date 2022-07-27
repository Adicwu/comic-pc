<template>
  <div id="pixiv">
    <div class="pixiv-content">
      <SearchHeader
        v-model="pixivFilter.name"
        class="pixiv-header"
        @search="onSearch"
        @clear="onSearch"
      >
        <el-dropdown>
          <div class="search-sort">
            {{
              PIXIV_SEARCH_SORT.find((item) => item.value === pixivFilter.sort)
                ?.name
            }}
            <Icon name="arrow" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="{ name, value } in PIXIV_SEARCH_SORT"
                :key="value"
                @click="changeSearchSort(value)"
                >{{ name }}</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </SearchHeader>
      <AwSearchLoading :pending="state.searchPending">
        <AwVirtualWaterfall
          target=".pixiv-content"
          :column="5"
          :request-size="state.requestSize"
          :requset="fetchPixiv"
          :gap="26"
          @onNoMoreResult="onNoMoreResult"
        >
          <template #item="{ item }">
            <PixivContentItem
              :style="{
                opacity: state.pixivMainId === item.id ? 0 : 1
              }"
              :detail="item"
              @click="(e) => imgPreview(e, item)"
            />
          </template>
        </AwVirtualWaterfall>
      </AwSearchLoading>

      <AdBreakTop target=".pixiv-content" />
    </div>

    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script lang="ts" setup>
import { ComicSearchItem, vilipixSearch } from '@/api'
import AwSearchLoading from '@/components/AwSearchLoading/AwSearchLoading.vue'
import { AwVirtualWaterfall, Type } from '@/components/AwVirtualWaterfall'
import SearchHeader from '@/components/Form/SearchHeader.vue'
import { toPixivMain } from '@/hooks/router'
import { ElMessage } from 'element-plus'
import { reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import PixivContentItem from './component/PixivContentItem.vue'
import * as ApiReturns from '@/api/api.type'
import { PIXIV_SEARCH_SORT } from './static/form'

const $route = useRoute()

const pixivFilter = reactive({
  name: '',
  sort: 'hot' as ApiReturns.VilipixSearchSort
})
const state = reactive({
  pixivMainId: '',
  childRouteActive: false,
  searchPending: false,
  requestSize: 50
})

const fetchPixiv: Type.RequsetFn = async (tpage, size) => {
  const { list, total } = await vilipixSearch({
    limit: size,
    offset: --tpage * size,
    name: pixivFilter.name,
    sort: pixivFilter.sort
  })
  state.searchPending = false
  if (list.length === 0 && tpage === 0) {
    ElMessage({
      message: '什么都没有找到~',
      type: 'warning'
    })
  }
  return {
    list,
    total
  }
}
const onSearch = () => {
  state.searchPending = true
  fetchPixiv(1, state.requestSize)
}
const changeSearchSort = (value: ApiReturns.VilipixSearchSort) => {
  pixivFilter.sort = value
  onSearch()
}
const imgPreview = (e: Event, item: ComicSearchItem) => {
  const el = e.target as HTMLElement
  const rect = el.getBoundingClientRect()

  toPixivMain(item.id, {
    detail: item,
    rect: {
      width: rect.width | 0,
      height: rect.height | 0,
      x: rect.x | 0,
      y: rect.y | 0,
      path: item.preurl,
      radius: getComputedStyle(el).borderRadius
    }
  })
}
const onNoMoreResult = () => {
  ElMessage({
    message: '木有更多了~',
    type: 'info'
  })
}

watch(
  () => $route.params,
  (params) => {
    const id = String(params.id)
    if (!params.id) {
      setTimeout(() => {
        state.pixivMainId = ''
      }, 625)
    }
    if (state.pixivMainId === '') {
      state.pixivMainId = id
    }
  }
)
</script>
<style lang="less" scoped>
#pixiv {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;

  .pixiv {
    &-header {
      position: sticky;
      top: 0;
      padding-top: 10px;
      margin-bottom: 20px;
    }

    &-content {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: overlay;
      user-select: none;
    }
  }
  .search-sort {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 12px 0 20px;
    height: 48px;
    background: var(--box-bg-color);
    font-size: 16px;
    border-radius: 12px;
    color: var(--font-color);
    cursor: pointer;
  }
}
</style>
