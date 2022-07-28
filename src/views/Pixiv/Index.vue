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
      <PixivRank />
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
            <div
              class="pixiv-content__item"
              :style="{
                opacity: pixivMainId === item.id ? 0 : 1
              }"
            >
              <img :src="item.preurl" @click="(e) => toMain(e, item)" />
              <div v-if="item.total > 1" class="total">
                <b>{{ item.total }}</b>
              </div>
            </div>
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
import * as ApiReturns from '@/api/api.type'
import AwSearchLoading from '@/components/AwSearchLoading/AwSearchLoading.vue'
import { AwVirtualWaterfall, Type } from '@/components/AwVirtualWaterfall'
import SearchHeader from '@/components/Form/SearchHeader.vue'
import { toPixivMain } from '@/hooks/router'
import { ElMessage } from 'element-plus'
import { reactive } from 'vue'
import PixivRank from './component/PixivRank.vue'
import { usePixivMainAnmId } from './hooks/usePixivMainAnm'
import { PIXIV_SEARCH_SORT } from './static/form'

const { pixivMainId } = usePixivMainAnmId()
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
const toMain = (e: Event, item: ComicSearchItem) => {
  const el = e.target as HTMLElement
  toPixivMain(el, item)
}
const onNoMoreResult = () => {
  ElMessage({
    message: '木有更多了~',
    type: 'info'
  })
}
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
      margin-bottom: 30px;
    }

    &-content {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: overlay;
      user-select: none;
      &__item {
        position: relative;
        width: 100%;
        height: 100%;
        animation: identifier 0.25s;
        padding: 12px;
        box-sizing: border-box;
        @keyframes identifier {
          from {
            opacity: 0;
            transform: translateY(200px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        img {
          width: 100%;
          height: 100%;
          display: block;
          border-radius: 14px;
          transition: all 0.25s;
          cursor: zoom-in;
          background: #def;
        }

        &:hover {
          img {
            box-shadow: 0 0 14px rgba(0, 0, 0, 0.1);
            transform: scale(0.98);
          }
        }

        .total {
          position: absolute;
          right: 20px;
          top: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 34px;
          height: 34px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
          font-variant-numeric: tabular-nums;
        }
      }
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
