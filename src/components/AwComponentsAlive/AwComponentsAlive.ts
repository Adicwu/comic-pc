import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  provide,
  reactive,
  VNode
} from 'vue'
import AwComponentsAliveItem from './AwComponentsAliveItem'
import { Cache, ShapeFlags } from './type'

function resetShapeFlag(vnode: VNode) {
  let shapeFlag = vnode.shapeFlag
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
  }
  if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
  }
  vnode.shapeFlag = shapeFlag
}

export default defineComponent({
  name: 'AwComponentsAlive',
  // 标记此组件使用keep-alive执行逻辑
  __isKeepAlive: true,
  components: {
    AwComponentsAliveItem
  },
  setup(_, { slots }) {
    const itc = getCurrentInstance()! as any
    const {
      renderer: { um: _unmount }
    } = itc.ctx

    const cache: Cache = reactive(new Map())

    const unmount = (vnode: VNode) => {
      // reset the shapeFlag so it can be properly unmounted
      resetShapeFlag(vnode)
      _unmount(vnode, itc, null, true)
    }

    provide('cache', cache)
    onBeforeUnmount(() => {
      cache.forEach((cached) => {
        unmount(cached)
      })
    })

    return () => {
      if (!slots.default) {
        return null
      }
      const root = slots.default()[0].children as VNode[]
      return root.map((vnode) =>
        h(
          AwComponentsAliveItem,
          {
            onMounted({ key, itc }) {
              if (key && !cache.has(key)) {
                cache.set(key, itc.subTree)
              }
            }
          },
          {
            /**
             * 解决以下警告
             * Non-function value encountered for default slot. Prefer function slots for better performance.
             */
            default: () => vnode
          }
        )
      )
    }
  }
})
