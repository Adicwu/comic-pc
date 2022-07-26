<template>
  <div id="home">
    <HomeBanner
      :banner="comic.banner"
      :hots="comic.hots"
      :latest="comic.latest"
      :is-init="isInit"
    />
    <div class="home-main">
      <div class="home-main__col">
        <HomeArticle :perweek="comic.perweek" />
      </div>
      <div class="home-main__col">
        <HomeTv :tv="comic.tv" />
      </div>
      <div class="home-main__col">
        <HomeBlockComic title="完结日漫" :list="comic.endJp" />
      </div>
      <div class="home-main__col">
        <HomeBlockComic title="热门国漫" :list="comic.cn" />
      </div>
    </div>

    <AdBreakTop target="#home" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, shallowReactive } from 'vue'

import HomeBanner from './component/HomeBanner.vue'
import HomeArticle from './component/HomeArticle.vue'
import HomeTv from './component/HomeTv.vue'
import HomeBlockComic from './component/HomeBlockComic.vue'

import * as Api from '@apis/index'
import { useComicUpdate } from '@/stores/comicUpdate.store'

export default defineComponent({
  name: 'Home',
  components: {
    HomeBanner,
    HomeArticle,
    HomeTv,
    HomeBlockComic
  },
  setup() {
    const comicUpdate = useComicUpdate()

    const isInit = ref(false)
    const comic = shallowReactive<Api.GetHomeMixData>({
      perweek: [],
      hots: [],
      latest: [],
      banner: [],
      tv: [],
      endJp: [],
      cn: []
    })

    ;(async () => {
      const data = await Api.getHomeMixData()
      if (data) {
        comicUpdate.setComic(data.perweek)
        comicUpdate.notify()
        Object.entries(data).forEach(([k, v]) => {
          comic[k as keyof Api.GetHomeMixData] = v
        })
        isInit.value = true
      }
    })()

    return {
      comic,
      isInit
    }
  }
})
</script>
<style lang="less" scoped>
#home {
  position: relative;
  width: 100%;
  height: 100%;
  border-top-left-radius: 30px;
  overflow-y: overlay;
  background: var(--box-bg-color);

  .home-main {
    width: 100%;
    padding: 30px 20px;
    box-sizing: border-box;
    &__col {
      display: flex;
      width: 100%;
      gap: 40px;
      margin-bottom: 40px;
    }
  }
}
</style>
