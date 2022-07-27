<template>
  <div class="pixiv-rank">
    <ImgVary class="pixiv-rank__bg" :src="ranklist.activeImg" />
    <div class="pixiv-rank__date">
      <div class="tag">
        <b>{{ today.date }}</b>
        <a>{{ today.mouth }}</a>
        <Icon name="arrow" />
      </div>
    </div>
    <div class="pixiv-rank__content">
      <div class="desc">
        <i v-for="(item, index) in 'Ranking'.split('')" :key="index">{{
          item
        }}</i>
      </div>
      <div></div>
      <div class="ranklist">
        <div class="ranklist-content" :style="ranklistContentStyle">
          <div
            v-for="(item, index) in ranklist.list"
            :key="item.id"
            class="ranklist-item"
            :class="{ active: ranklist.active === index }"
            @click="ranklist.active = index"
          >
            <div class="cover">
              <BaseImg
                :src="item.preurl"
                :style="{
                  opacity: pixivMainId === item.id ? 0 : 1
                }"
                @click.stop="(e) => toMain(e, item)"
              />
            </div>
            <p>{{ item.title }}</p>
            <b v-show="ranklist.active === index">NO.{{ index + 1 }}</b>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { vilipixRank } from '@/api'
import * as FnReturns from '@/api/type'
import ImgVary from '@/components/Container/ImgVary.vue'
import { toPixivMain } from '@/hooks/router'
import { computed, CSSProperties, reactive } from 'vue'
import { usePixivMainAnmId } from '../hooks/usePixivMainAnm'

const today = {
  date: new Date().getDate(),
  mouth:
    [
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
      '七',
      '八',
      '九',
      '十',
      '十一',
      '十二'
    ][new Date().getMonth() + 1] + '月'
}

const { pixivMainId } = usePixivMainAnmId()
const ranklist = reactive({
  list: [] as FnReturns.VilipixRank['list'],
  active: 0,
  get activeImg() {
    return this.list[this.active]?.orgurl || ''
  }
})

const ranklistContentStyle = computed<CSSProperties>(() => ({
  transform: `translateX(-${(100 / ranklist.list.length) * ranklist.active}%)`
}))
const toMain = (e: Event, item: FnReturns.ComicSearchItem) => {
  const el = e.target as HTMLElement
  toPixivMain(el, item)
}

;(async () => {
  const { list } = await vilipixRank()
  ranklist.list = list
})()
</script>
<style lang="less" scoped>
.pixiv-rank {
  position: relative;
  width: 100%;
  height: 700px;
  padding-right: 40px;
  box-sizing: border-box;
  color: #fff;
  display: flex;
  @aside: 360px;
  overflow: hidden;
  border-top-left-radius: var(--df-radius);
  border-bottom-left-radius: var(--df-radius);
  margin-bottom: 30px;

  &__bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    filter: brightness(0.7) blur(2px);
  }

  &__date {
    width: @aside;

    .tag {
      position: relative;
      display: inline-flex;
      align-items: flex-end;
      padding: 40px 12px 50px 12px;
      top: 0;
      left: 70px;

      &::before {
        .mask(1, var(--primary-color));
        opacity: 0.7;
      }

      b {
        position: relative;
        z-index: 3;
        font-size: 40px;
        line-height: 40px;
      }

      a {
        position: relative;
        z-index: 3;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
        padding-left: 4px;
      }

      i {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%) rotate(90deg);
        opacity: 0.4;
        font-size: 20px;
      }
    }
  }

  &__content {
    position: relative;
    width: calc(100% - @aside);
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 2fr 7fr 1fr;
    @itemOffsetY: 100px;

    .desc {
      position: absolute;
      left: 0;
      top: 18%;
      width: 100%;
      height: @itemOffsetY;
      padding-left: 220px;
      box-sizing: border-box;
      position: absolute;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      font-size: 20px;
      color: rgba(255, 255, 255, 0.688);
    }
    .ranklist {
      width: 100%;
      height: 100%;

      &-content {
        height: 100%;
        display: flex;
        flex-wrap: unset;
        transition: all 0.25s;
      }

      &-item {
        position: relative;
        margin-top: @itemOffsetY;
        padding: 30px 20px;
        transition: all 0.25s;
        cursor: pointer;

        // &::after {
        //   .mask;
        // }

        &::before {
          .mask(-1, #fff);
          opacity: 0.4;
          transition: all 0.25s;
        }

        .cover {
          display: flex;
          align-items: center;
          width: 200px;
          height: 300px;

          img {
            display: block;
            width: 100%;
            max-height: 100%;
            box-shadow: 0 8px 14px rgba(0, 0, 0, 0.4);
            cursor: zoom-in;
          }
        }

        p {
          padding-top: 14px;
          .font-format(20px);
          .p-truncate(1);
          color: #333;
        }

        b {
          position: absolute;
          top: 10px;
          left: 0;
          transform: translateX(-50%);
          font-size: 22px;
          color: transparent;
          background-image: linear-gradient(to right, rgb(255, 255, 0), #fff);
          background-clip: text;
          -webkit-background-clip: text;
          text-shadow: 2px 4px 4px rgba(0, 0, 0, 0.1);
        }

        &.active {
          padding-top: 50px;
          transform: scale(1.1);
          margin-top: 0;
          box-shadow: 0 0 14px rgba(0, 0, 0, 0.3);

          p {
            font-weight: 600;
          }

          &::before {
            opacity: 0.6;
          }
        }
      }
    }
  }
}
</style>
