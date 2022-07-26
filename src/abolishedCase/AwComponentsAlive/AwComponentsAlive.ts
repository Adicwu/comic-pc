import { defineComponent, h, onMounted, PropType, reactive, ref } from 'vue'
import AwComponentsAliveItem from './AwComponentsAliveItem'

export default defineComponent({
  name: 'AwComponentsAlive',
  components: {
    AwComponentsAliveItem
  },
  props: {
    list: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    itemClass: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots, attrs }) {
    const items = reactive(new Map<string | number, any>())

    onMounted(() => {
      console.log(items)
    })

    return () => {
      return props.list.map((item) =>
        items.has(item.id)
          ? items.get(item.id)
          : h(
              AwComponentsAliveItem,
              {
                key: item.id,
                'data-id': item.id,
                class: props.itemClass,
                style: {
                  ...item.style
                },
                onMounted(e) {
                  items.set(item.id, e)
                }
              },
              {
                /**
                 * 解决以下警告
                 * Non-function value encountered for default slot. Prefer function slots for better performance.
                 */
                default: () =>
                  slots.item!({
                    item
                  })
              }
            )
      )
    }
  }
})
