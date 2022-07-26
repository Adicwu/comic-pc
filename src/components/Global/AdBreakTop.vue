<template>
  <div
    class="ad-break-top"
    title="点击返回顶部"
    :style="curPos"
    @click="breakTop"
  ></div>
</template>
<script lang="ts">
import { throttle } from '@/utils/adLoadsh'
import {
  computed,
  CSSProperties,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'
export default defineComponent({
  name: 'AdBreakTop',
  props: {
    target: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    // const curScroll = ref(0)
    const dom = ref<HTMLElement>()
    const visible = ref(false)

    const curPos = computed<CSSProperties>(() => ({
      transform: `translateY(${visible.value ? '0' : '-100%'})`
    }))
    const hasTarget = computed(() => props.target !== '')

    const scroller = (e: Event) => {
      throttle(() => {
        const scTop = (e.target as HTMLElement).scrollTop
        // curScroll.value = scTop
        visible.value = scTop > 400
      }, 100)()
    }
    const addEvent = () => {
      if (!hasTarget.value || dom.value === null) return
      dom.value?.addEventListener('scroll', scroller)
    }
    const removeEvent = () => {
      if (!hasTarget.value || dom.value === null) return
      dom.value?.removeEventListener('scroll', scroller)
    }
    const breakTop = () => {
      if (dom.value === null) return
      // let del: number = dom.value.scrollHeight;
      // del = del / 10;
      // curScroll.value <= 2000 && (del = 300);
      dom.value?.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    onMounted(() => {
      dom.value = document.querySelector(props.target) as HTMLElement
      addEvent()
    })
    onBeforeUnmount(() => {
      removeEvent()
    })

    return {
      breakTop,
      curPos
    }
  }
})
</script>
<style lang="less" scoped>
.ad-break-top {
  position: fixed;
  right: 30px;
  top: 0;
  z-index: 555;
  width: 70px;
  height: 80vh;
  background: url(static/img/break-top.png) no-repeat bottom/cover;
  transition: all 0.6s;
  cursor: pointer;
}
</style>
