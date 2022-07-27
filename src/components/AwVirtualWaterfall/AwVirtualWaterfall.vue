<template>
  <div ref="selfEl" class="aw-virtual-waterfall">
    <div class="vw-content" :style="contentStyle">
      <div
        v-for="{ item, style } in renderedData"
        :key="item.id"
        class="vw-item"
        :style="style"
      >
        <slot name="item" :item="item" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useResizeListener } from '@/hooks/utils'
import { debounce, throttle } from '@/utils/adLoadsh'
import {
  computed,
  CSSProperties,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref
} from 'vue'
import * as Type from './type'

const emit = defineEmits<{
  (e: 'onNoMoreResult'): void
}>()
const props = withDefaults(
  defineProps<{
    /** 滚动节点 */
    target: string | HTMLElement
    /** 新数据请求 */
    requset: Type.RequsetFn
    /** 滚底阈值差 */
    offsetY?: number
    /** 列的总数 */
    column?: number
    /** 每列最小数量 */
    columnItemCount?: number
    /** 请求每页大小 */
    requestSize?: number
  }>(),
  {
    target: '',
    requset: () =>
      Promise.resolve({
        total: 0,
        list: []
      }),
    offsetY: 300,
    column: 3,
    columnItemCount: 6,
    requestSize: 0
  }
)
const selfEl = ref<HTMLElement>()

const isFirstResizeObserverRe = ref(true)
const reList = reactive({
  isPending: false,
  tpage: 1,
  total: 0,
  hasMore: true,
  data: [] as Type.DataItem[]
})
/** 瀑布流队列集 */
const columns = reactive({
  /** 队列 */
  queue: Array(props.column)
    .fill(0)
    .map<Type.ColumnsQueue>(() => ({
      list: [],
      height: 0
    })),
  /** 已用源数据长度，和queue的所有list长度相加一样 */
  usedDataLen: 0
})
/** 实际滚动容器信息 */
const scroll = reactive({
  width: 0,
  height: 0,
  /** 上偏移，用于处理非此组件根节点为滚动节点时，此组件的实际渲染位置偏移 */
  offsetTop: 0,
  start: 0,
  get end() {
    return this.start + this.height
  }
})

/**
 * 队列极限高度集合
 */
const columnsExtremeHeight = computed(() => {
  let min = Infinity,
    max = -Infinity,
    minIndex = 0,
    maxIndex = 0
  columns.queue.forEach(({ height }, index) => {
    if (height >= max) {
      max = height
      maxIndex = index
    }
    if (height < min) {
      min = height
      minIndex = index
    }
  })
  return {
    min,
    max,
    minIndex,
    maxIndex
  }
})
/** 子项高宽集 */
const awItem = computed(() =>
  reList.data.reduce((totol, item) => {
    const width = (scroll.width / props.column) | 0
    totol.set(item.id, {
      width,
      height: ((width / item.w) * item.h) | 0
    })
    return totol
  }, new Map<Type.DataItem['id'], Type.AwItemRect>())
)
/** 实际请求页大小 */
const requestSize = computed(
  () => props.requestSize || props.column * props.columnItemCount
)
/** 子项rect */
// const itemRect = computed(() => ({
//   width: (scroll.width / props.column) | 0
// }))
const hasMoreData = computed(() => columns.usedDataLen < reList.data.length)
const columnsQueueList = computed(() =>
  columns.queue.reduce<Type.ColumnsQueue['list']>((totol, item) => {
    totol.push(...item.list)
    return totol
  }, [])
)
/** 实际视图渲染使用的data */
const renderedData = computed(() =>
  // columnsQueueList.value.reduce<
  //   (Type.ColumnsQueue['list'][0] & { id: string | number })[]
  // >((totol, item) => {
  //   if (item.y + item.h > scroll.start && item.y < scroll.end) {
  //     totol.push({
  //       id: item.item.id,
  //       ...item
  //     })
  //   }
  //   return totol
  // }, [])
  columnsQueueList.value.filter(
    (item) => item.y + item.h > scroll.start && item.y < scroll.end
  )
)
const contentStyle = computed<CSSProperties>(() => {
  return {
    height: `${columnsExtremeHeight.value.max}px`
  }
})

const { onIsBindChanged, getTarget } = (() => {
  const mainScroll = throttle(async (e: Event) => {
    let { scrollTop, clientHeight } = e.target as HTMLElement
    scrollTop -= scroll.offsetTop
    scroll.start = scrollTop
    if (
      !hasMoreData.value &&
      clientHeight + scrollTop > columnsExtremeHeight.value.max * 0.7
    ) {
      // console.log('request')
      await loadMoreData()
    }
    if (
      clientHeight + scrollTop + props.offsetY >
      columnsExtremeHeight.value.min
    ) {
      addToQueue((props.column / 2) | 0)
    }
  }, 100)
  const getTarget = (): HTMLElement | null => {
    const { target } = props
    if (!target) {
      return selfEl.value!
    } else {
      return typeof target === 'string'
        ? document.querySelector(target)
        : target
    }
  }
  const addEvent = async () => {
    await nextTick()
    getTarget()?.addEventListener('scroll', mainScroll)
  }
  const removeEvent = () => {
    const target = getTarget()
    if (!target) return
    target.removeEventListener('scroll', mainScroll)
  }
  const onIsBindChanged = (bind: boolean) => {
    bind ? addEvent() : removeEvent()
  }
  return {
    onIsBindChanged,
    getTarget
  }
})()

const loadMoreData = async () => {
  if (reList.isPending) return
  reList.isPending = true
  const { list, total } = await props.requset(reList.tpage, requestSize.value)
  const hasResult = list.length !== 0
  if (!hasResult || list.length < requestSize.value) {
    reList.hasMore = false
  }
  if (!hasResult) {
    emit('onNoMoreResult')
    return
  }
  reList.tpage++
  reList.data.push(...list.map((item) => Object.freeze(item)))
  reList.total = total
  reList.isPending = false
}
const initRect = () => {
  const rect = getTarget()?.getBoundingClientRect()
  if (!rect) return
  scroll.width = selfEl.value!.clientWidth
  scroll.height = rect.height
  scroll.offsetTop = selfEl.value!.offsetTop
  scroll.start = (getTarget()?.scrollTop || 0) - scroll.offsetTop
}
/**
 * 生成队列子项
 * @param current 当前数据源
 * @param before 上一个子项
 * @param index 当前列
 */
const generateQueueListItem = (
  item: Type.DataItem,
  before: Type.ColumnsQueue['list'][0] | null,
  index: number
) => {
  const rect = awItem.value.get(item.id)
  const wid = rect?.width || 0
  const hei = rect?.height || 0
  let y = 0
  if (before) {
    y = before.h + before.y
  }
  return {
    item,
    h: hei,
    y,
    style: {
      width: `${wid}px`,
      height: `${hei}px`,
      transform: `translate3d(${index * 100}%,${y}px,0)`
    }
  }
}
/**
 * 将数据放入渲染队列
 * @param index 第几列
 * @param item 源数据
 */
const pushToQueue = (index: number, item: Type.DataItem) => {
  const q = columns.queue[index]
  const before = q.list[q.list.length - 1] || null
  const result = generateQueueListItem(item, before, index)
  q.height += result.h
  q.list.push(result)
  columns.usedDataLen++
}
/**
 * 取现有数据放入最矮的队列
 * @param size 执行次数，每次放一个数据
 */
const addToQueue = (size = 1) => {
  for (const _ of Array(size)) {
    if (!hasMoreData.value) {
      break
    }
    pushToQueue(
      columnsExtremeHeight.value.minIndex,
      reList.data[columns.usedDataLen]
    )
  }
}
/** 重绘 */
const repaint = () => {
  columns.queue = columns.queue.map((q, index) => {
    let height = 0
    const list = q.list.reduce<Type.ColumnsQueue['list']>(
      (totol, { item }, i) => {
        const before = totol[i - 1] || null
        const result = generateQueueListItem(item, before, index)
        height += result.h
        totol.push(result)
        return totol
      },
      []
    )
    return {
      height,
      list
    }
  })
}
const init = async () => {
  initRect()
  onIsBindChanged(true)
  await loadMoreData()
  addToQueue(requestSize.value)
}

// useEventListener(
//   'resize',
//   debounce(async () => {
//     initRect()
//     repaint()
//   }, 300)
// )
useResizeListener(
  getTarget,
  debounce(() => {
    if (isFirstResizeObserverRe.value) {
      isFirstResizeObserverRe.value = false
      return
    }
    initRect()
    repaint()
  }, 300)
)

onMounted(init)

onUnmounted(() => {
  onIsBindChanged(false)
})

defineExpose({
  // Type
})
</script>
<style lang="less" scoped>
.aw-virtual-waterfall {
  position: relative;
  width: 100%;

  .vw {
    &-content {
      position: relative;
      width: 100%;
    }
    &-item {
      position: absolute;
      left: 0;
      top: 0;
    }
  }
}
</style>
