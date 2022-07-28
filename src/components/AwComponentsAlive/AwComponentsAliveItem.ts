import {
  ComponentInternalInstance,
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  VNode,
  VNodeProps
} from 'vue'
import { Cache, MoveType, ShapeFlags } from './type'

export default defineComponent({
  name: 'AwComponentsAliveItem',
  __isKeepAlive: true,
  emits: {
    mounted: (e: { key: VNodeProps['key']; itc: ComponentInternalInstance }) =>
      e,
    activated: null,
    deactivated: null
  },
  setup(_, { slots, emit }) {
    const itc = getCurrentInstance()! as any
    const sharedContext = itc.ctx

    let key: VNodeProps['key'] = undefined
    const cache = inject<Cache>('cache')!

    const {
      renderer: {
        m: move,
        o: { createElement }
      }
    } = sharedContext
    const storageContainer = createElement('div')

    sharedContext.activate = function (
      vnode: VNode,
      container: { [key: string]: any },
      anchor: { [key: string]: any }
    ) {
      move(vnode, container, anchor, MoveType.ENTER, null)
    }
    sharedContext.deactivate = function (vnode: VNode) {
      move(vnode, storageContainer, null, MoveType.LEAVE, null)
    }

    onMounted(() => {
      if (!key) return
      emit('mounted', {
        key,
        itc
      })
    })

    return () => {
      if (!slots.default) {
        return null
      }
      const root = slots.default()
      const vnode = root[0]
      if (vnode.key) {
        key = vnode.key
        const cachedVNode = cache.get(key)
        if (cachedVNode) {
          vnode.el = cachedVNode.el
          vnode.component = cachedVNode.component
          // avoid vnode being mounted as fresh
          vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        }
      }
      // avoid vnode being unmounted
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      return vnode
    }
  }
})
