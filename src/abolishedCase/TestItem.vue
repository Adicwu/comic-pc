<template>
  <div class="test-item" @click="num++">{{ id }} + {{ num }}</div>
</template>

<script lang="ts">
import {
  defineComponent,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref
} from 'vue'
export default defineComponent({
  props: {
    id: Number
  },
  setup(props) {
    onActivated(() => {
      console.log('act', props.id)
    })
    onDeactivated(() => {
      console.log('deact', props.id)
    })
    onMounted(() => {
      console.log('moun', props.id)
    })
    onUnmounted(() => {
      console.log('unmoun', props.id)
    })
    return {
      num: ref(0)
    }
  }
})
</script>
<style lang="less" scoped>
.test-item {
  font-size: 30px;
}
</style>
