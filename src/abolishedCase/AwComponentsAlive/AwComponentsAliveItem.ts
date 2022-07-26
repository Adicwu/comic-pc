import { defineComponent, getCurrentInstance, h, onMounted } from 'vue'

function getInnerChild(vnode: any) {
  return vnode.shapeFlag ? vnode.ssContent! : vnode
}

export default defineComponent({
  name: 'AwComponentsAliveItem',
  emits: {
    mounted: null
  },
  setup(props, { slots, attrs, emit }) {
    onMounted(() => {
      emit('mounted', getCurrentInstance()?.subTree)
    })
    return () => h('div', attrs, slots.default!())
  }
})
