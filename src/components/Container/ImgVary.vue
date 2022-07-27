<template>
  <div ref="selfDom" class="img-vary" :style="selfStyle">
    <transition-group
      enter-active-class="low animate__fadeIn"
      leave-active-class="fast animate__fadeOut"
    >
      <img v-show="img.visible" key="1" :src="img.paths[1]" />
      <img v-show="!img.visible" key="2" :src="img.paths[0]" />
    </transition-group>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  watch,
  CSSProperties,
  ref,
  onMounted,
  nextTick,
  toRefs,
  Ref
} from 'vue'
import { useEventListener } from '@/utils/vant/useEventListener'
import { throttle } from '@/utils/adLoadsh'
import { numLimit } from 'adicw-utils'
import { onWindowSizeChange } from '@/utils/vant/useWindowSize'
import { getRealStyle } from '@/utils/dom'

interface Img {
  paths: any[]
  visible: boolean
}
function styleModule(animate: Ref<boolean>) {
  const selfDom = ref<HTMLElement>()
  const scale = 1.3
  const mouse = reactive({
    x: 0,
    y: 0
  })
  const screen = reactive({
    width: 0,
    height: 0
  })
  const self = reactive({
    width: 0,
    height: 0
  })

  const transformLimit = computed(() => {
    const { width, height } = self
    const multiple = scale - 1
    let xLimit = (width * multiple) / 3,
      yLimit = (height * multiple) / 3
    return {
      x: {
        min: -xLimit,
        max: xLimit
      },
      y: {
        min: -yLimit,
        max: yLimit
      }
    }
  })

  const selfStyle = computed(() => {
    // 0.5为移动的缩小倍率，提升画面流畅度
    let x = -numLimit(
      (mouse.x - screen.width / 2) * 0.5,
      transformLimit.value.x.min,
      transformLimit.value.x.max
    )
    let y = -numLimit(
      (mouse.y - screen.height / 2) * 0.5,
      transformLimit.value.y.min,
      transformLimit.value.y.max
    )
    return {
      transform: `scale(${scale}) translate(${x}px,${y}px)`
    } as CSSProperties
  })

  const onMouseMove = (e: MouseEvent) => {
    if (!animate.value) return
    const { clientX, clientY } = e
    ;[mouse.x, mouse.y] = [clientX, clientY]
  }
  const styleInit = async () => {
    await nextTick()
    const { innerWidth, innerHeight } = window
    const { width, height } = getRealStyle(selfDom.value!)
    ;[screen.width, screen.height] = [innerWidth, innerHeight]
    ;[self.width, self.height] = [width, height]
  }

  onWindowSizeChange(styleInit)
  onMounted(styleInit)
  useEventListener('mousemove', throttle(onMouseMove, 10))

  return {
    selfStyle,
    selfDom
  }
}
export default defineComponent({
  name: 'ImgVary',
  props: {
    src: {
      type: String,
      default: ''
    },
    animate: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { animate } = toRefs(props)
    const img: Img = reactive({
      paths: ['', ''],
      visible: false
    })
    const imgHandler = (newSrc: string) => {
      img.visible = false
      img.paths.push(newSrc)
      img.paths.shift()
      const image = new Image()
      image.src = newSrc
      image.onload = () => (img.visible = true)
    }
    watch(() => props.src, imgHandler, {
      immediate: true
    })
    return {
      img,
      ...styleModule(animate)
    }
  }
})
</script>
<style lang="less" scoped>
.fast {
  animation-duration: 0.8s;
}
.low {
  animation-direction: 1.4s;
}
.img-vary {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: inherit;
    height: inherit;
  }
}
</style>
