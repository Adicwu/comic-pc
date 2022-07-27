import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function usePixivMainAnmId() {
  const $route = useRoute()
  const pixivMainId = ref('')

  watch(
    () => $route.params,
    (params) => {
      const id = String(params.id)
      if (!params.id) {
        setTimeout(() => {
          pixivMainId.value = ''
        }, 625)
      }
      if (pixivMainId.value === '') {
        pixivMainId.value = id
      }
    }
  )

  return {
    pixivMainId
  }
}
