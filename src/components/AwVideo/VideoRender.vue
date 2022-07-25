<template>
  <!-- 大坑：由于videojs会在video标签上套一层节点，导致裸video标签时vue无法正常卸载节点 -->
  <div class="video-render">
    <video ref="videoEl" :style="videoStyle" v-bind="$attrs" />
    <video ref="fakeVideoEl" class="fake"></video>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  CSSProperties,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch
} from 'vue'
import videojs from 'video.js'

import * as Type from './type'
import { useEventListener } from '@/utils/vant/useEventListener'
import { useIsDev } from '@/hooks/utils'

export default defineComponent({
  name: 'VideoRender',
  props: {
    src: {
      type: String,
      default: ''
    },
    /**
     * 0-100
     */
    volume: {
      type: Number,
      default: 0
    },
    fakeVideo: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    initStart: null,
    initSuccessed: null,
    initFailed: null,
    error: (e: any | Error) => e,
    canplay: (e: Event) => e,
    timeupdate: (e: Event) => e,
    ended: (e: Event) => e,
    play: (e: Event) => e,
    pause: (e: Event) => e,
    waiting: (e: Event) => e,
    playing: (e: Event) => e,
    seeking: (e: Event) => e,
    seeked: (e: Event) => e,
    volumechange: (e: Event) => e,
    loadedmetadata: (e: Event) => e,
    'update:volume': (e: number) => e
  },
  setup(props, { emit }) {
    const isDev = useIsDev().get()
    const videoInstance = ref<Type.FlvInstance>(null)
    const fakeVideoInstance = ref<Type.FlvInstance>(null)
    const videoEl = ref<HTMLVideoElement>()
    const fakeVideoEl = ref<HTMLVideoElement>()

    const videoStyle = computed(
      () =>
        ({
          // opacity: isDev ? 0.2 : 1
        } as CSSProperties)
    )
    watch(
      () => props.volume,
      (volume) => {
        emit('update:volume', volume)
        setVolume(volume)
      }
    )

    /**
     * 视频地址解析为source格式
     * @param url
     */
    const videoUrlToSource = (url: string) => {
      let type = ''
      const lastKey = url.split('.').pop()
      switch (lastKey) {
        case 'm3u8': {
          type = 'application/x-mpegURL'
          break
        }
        case 'zip': {
          type = 'video/mp4'
          break
        }
        default: {
          type = 'video/' + lastKey
        }
      }
      return {
        src: url,
        type
      }
    }
    /**
     * 初始化video
     * @param el 视频节点
     * @param url 视频地址
     */
    const videoInit = (el: HTMLVideoElement, url: string) => {
      if (!url || !el) return
      emit('initStart')
      try {
        videoInstance.value = videojs(el, {
          autoplay: true,
          preload: 'auto',
          controls: false,
          sources: [videoUrlToSource(url)]
        })
        emit('initSuccessed')
        videoInstance.value.on('error', (e) => {
          emit('error', e)
          console.log(e)
        })
        return videoInstance.value
      } catch (err) {
        emit('initFailed')
        console.log(err, 'init')
        return null
      }
    }
    /**
     * 初始化video副本
     */
    const fakeVideoInit = () => {
      if (!props.fakeVideo || !props.src) return
      fakeVideoInstance.value = videojs(fakeVideoEl.value!, {
        controls: false,
        sources: [videoUrlToSource(props.src)]
      })
    }

    /** 修改音量 */
    const setVolume = (volume: number) =>
      (videoEl.value!.volume = +(volume / 100).toFixed(1))
    /** 修改播放倍数 */
    const setPlaybackRate = (rate: number) =>
      (videoEl.value!.playbackRate = rate)
    /** 修改当前播放进度 */
    const setCurrentTime = (currentTime: number) =>
      (videoEl.value!.currentTime = currentTime)
    /** 播放 */
    const play = () => videoInstance.value?.play()
    /** 暂停 */
    const pause = () => videoInstance.value?.pause()
    /** 销毁(此方法会删除video节点 暂时不用) */
    const destroy = () => {
      videoInstance.value?.dispose()
      fakeVideoInstance.value?.dispose()
    }

    /** 监听 */
    ;(() => {
      const op = {
        target: videoEl
      }
      /** 可播放  */
      useEventListener(
        'canplay',
        (e) => {
          emit('canplay', e)
          setVolume(props.volume)
        },
        op
      )
      /** 进度  */
      useEventListener('timeupdate', (e) => emit('timeupdate', e), op)
      /** 播放结束  */
      useEventListener('ended', (e) => emit('ended', e), op)
      /** 播放  */
      useEventListener('play', (e) => emit('play', e), op)
      /** 暂停  */
      useEventListener('pause', (e) => emit('pause', e), op)
      /** 错误  */
      useEventListener('error', (e) => emit('error', e), op)
      /** 缓冲开始  */
      useEventListener('waiting', (e) => emit('waiting', e), op)
      /** 缓冲结束  */
      useEventListener('playing', (e) => emit('playing', e), op)
      /** 进度跳转开始 */
      useEventListener('seeking', (e) => emit('seeking', e), op)
      /** 进度跳转结束 */
      useEventListener('seeked', (e) => emit('seeked', e), op)
      /** 音量变化 */
      useEventListener('volumechange', (e) => emit('volumechange', e), op)
      /** 数据加载就绪 */
      useEventListener('loadedmetadata', (e) => emit('loadedmetadata', e), op)
    })()

    onMounted(() => {
      videoInit(videoEl.value!, props.src)
      fakeVideoInit()
    })
    onBeforeUnmount(() => {
      destroy()
    })

    return {
      videoEl,
      videoInstance,
      videoStyle,
      fakeVideoEl,
      play,
      pause,
      destroy,
      setVolume,
      setPlaybackRate,
      setCurrentTime
    }
  }
})
</script>
<style lang="less" scoped>
.video-render {
  position: relative;
  width: 100%;
  height: 100%;
  & > div,
  video {
    width: 100%;
    height: 100%;
  }
  ::v-deep(.vjs-v7) {
    div,
    button {
      display: none !important;
    }
  }
  .fake {
    display: none;
  }
}
</style>
