<template>
  <transition-group
    v-bind="$attrs"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
  >
    <slot />
  </transition-group>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    max?: number
    duration?: number
    keframes?: Keyframe[]
  }>(),
  {
    max: 5,
    duration: 525,
    keframes: () => [
      {
        opacity: 0,
        transform: `translateY(${-40}%)`
      },
      {
        opacity: 1,
        transform: `translateY(0)`
      }
    ]
  }
)

const childEls = ref<Element[]>([])

const onBeforeEnter = (el: Element) => {
  if (childEls.value.length < props.max) {
    ;(el as HTMLElement).style.opacity = '0'
  }
  childEls.value.push(el)
}

const onEnter = (el: Element, done: () => void) => {
  const index = childEls.value.indexOf(el)
  if (index >= props.max) {
    return done()
  }
  el.animate(props.keframes, {
    delay: (index + 1) * (props.duration / 2),
    duration: props.duration
  }).onfinish = () => {
    ;(el as HTMLElement).style.opacity = '1'
    done()
  }
}
</script>
