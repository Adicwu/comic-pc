<template>
  <!-- :style="{ opacity: src ? 1 : 0 }" -->
  <div
    ref="selfEl"
    class="aw-video"
    :class="{
      'web-fullscreen': player.webFullScreen,
      'pointer-hide': !controlBar.visible
    }"
    @mousemove="controlBarVisibleHandler"
    @touchmove="controlBarVisibleHandler"
  >
    <AwVideoMask
      :status="player.status"
      :src="src"
      :play-handler="playHandler"
      :waiting="requesting"
      @notify="notify"
    />
    <div
      :class="{ show: src && player.status !== -1 && controlBar.visible }"
      class="aw-video__control"
    >
      <AwVideoProgress
        ref="awVideoProgressComp"
        :btn-icon="btnIcon"
        :preview-img="player.preview"
        :duration="player.duration"
        :current-time="player.currentTime"
        :buffered-list="player.bufferedList"
        @timePreview="computedPreview"
        @change="onProgressChange"
        @progressing="progress.isProgressing = true"
      />
      <Icon
        class="control-icon control-icon__play"
        :name="player.status === PlayerStatus.Playing ? 'pause' : 'play'"
        @click="playHandler"
      />
      <el-tooltip effect="dark" content="下一集" placement="top-start">
        <Icon
          class="control-icon control-icon__next scale"
          name="iconfontsvgnext"
          @click="$emit('next')"
        />
      </el-tooltip>
      <div class="control-time">
        <div
          v-show="!progress.inputing"
          class="control-time__show"
          @click="startProgressInput"
        >
          {{ sToMs(player.currentTime) }}
          <span>/</span>
          {{ sToMs(player.duration) }}
        </div>
        <div
          v-show="progress.inputing"
          v-click-outside="() => (progress.inputing = false)"
          class="control-time__input"
        >
          <input
            v-model="progress.inputVal"
            type="text"
            @keyup.enter="endProgressInput"
          />
        </div>
      </div>
      <!-- <div
        v-if="quality.length > 0"
        v-click-outside="() => (qualitySelectVisible = false)"
        class="control-select quality"
      >
        <span @click="qualitySelectVisible = !qualitySelectVisible">
          {{ currentQualityName }}
        </span>
        <ul v-show="qualitySelectVisible">
          <li
            v-for="{ name, value } in quality"
            :key="value"
            :class="{ active: currentQuality === value }"
            @click="changeQuality(value)"
          >
            {{ name }}
          </li>
        </ul>
      </div> -->
      <div
        v-click-outside="() => (playbackRate.visible = false)"
        class="control-select playback-rate"
      >
        <span @click="playbackRate.visible = !playbackRate.visible">
          {{ playbackRate.current }}
        </span>
        <ul v-show="playbackRate.visible">
          <li
            v-for="item in playbackRate.list"
            :key="item.value"
            :class="{ active: playbackRate.current === item.name }"
            @click="changePlayBackRate(item)"
          >
            {{ item.name }}
          </li>
        </ul>
      </div>
      <el-tooltip effect="dark" content="快退15秒" placement="top-start">
        <Icon
          class="control-icon active-style"
          style="transform: rotateY(180deg)"
          name="rotate_b"
          @click="fastProgressChange(-15)"
        />
      </el-tooltip>
      <el-tooltip effect="dark" content="快进15秒" placement="top-start">
        <Icon
          class="control-icon active-style"
          name="rotate_b"
          @click="fastProgressChange(15)"
        />
      </el-tooltip>
      <div class="control-icon control-volume">
        <Icon
          :name="player.isMuted ? 'mute' : 'volume'"
          @click="volumeCutover"
        />
        <div class="control-volume__inner">
          <el-slider
            v-model="player.volume"
            vertical
            height="100px"
            :show-tooltip="false"
          />
        </div>
      </div>
      <el-tooltip effect="dark" content="画中画" placement="top-start">
        <Icon
          class="control-icon scale active-style"
          :name="
            player.pip
              ? 'picture-in-picture-exit-fill'
              : 'picture-in-picture-2-fill'
          "
          @click="pipCutover"
        />
      </el-tooltip>
      <el-tooltip effect="dark" content="网页全屏" placement="top-start">
        <Icon
          class="control-icon scale active-style"
          :name="
            player.webFullScreen ? 'exit-fullscreen-4-3' : 'fullscreen-4-3'
          "
          @click="webFullScreenCutover"
        />
      </el-tooltip>
      <el-tooltip effect="dark" content="全屏" placement="top-start">
        <Icon
          class="control-icon scale active-style"
          :name="player.fullScreen ? 'exit-full-screen' : 'full-screen'"
          @click="fullScreenCutover"
        />
      </el-tooltip>
    </div>
    <AwVideoMsg ref="awVideoMsgComp" />
    <VideoRender
      v-if="src"
      ref="videoInstance"
      :key="src"
      v-model:volume="player.volume"
      fake-video
      :src="src"
      @initStart="videoInits.start"
      @initSuccessed="videoInits.successed"
      @initFailed="videoInits.failed"
      @error="videoEvents.error"
      @loadedmetadata="videoEvents.loadedmetadata"
      @canplay="videoEvents.canplay"
      @timeupdate="videoEvents.timeupdate"
      @ended="videoEvents.ended"
      @play="videoEvents.play"
      @pause="videoEvents.pause"
      @waiting="videoEvents.waiting"
      @playing="videoEvents.playing"
      @seeking="videoEvents.waiting"
      @seeked="videoEvents.playing"
      @volumechange="videoEvents.volumechange"
    />
  </div>
</template>

<script lang="ts">
import {
  checkFullscreen,
  fullscreen,
  pictureInPicture,
  sToMs,
  timeToS
} from 'adicw-utils'
import { defineComponent, reactive, Ref, ref, shallowReactive } from 'vue'

import AwVideoMask from './AwVideoMask.vue'
import AwVideoMsg, { NotifyItem } from './AwVideoMsg.vue'
import AwVideoProgress from './AwVideoProgress.vue'
import VideoRender from './VideoRender.vue'

import ClickOutside from '@/directs/clickOutside.direct'
import { debounce, throttle } from '@/utils/adLoadsh'
import { getVideoScreenshot } from '@/utils/media'
import { useEventListener } from '@/utils/vant/useEventListener'
import * as Type from './type'

export * from './type'

// type Props = ExtractPropTypes<typeof props>
type VideoInstance = InstanceType<typeof VideoRender>
type AwVideoProgressComp = InstanceType<typeof AwVideoProgress>

/** 播放倍数模块 */
function playbackRateModule(videoInstance: Ref<VideoInstance | undefined>) {
  /** 播放倍数集合 */
  const playbackRate = shallowReactive({
    /** 选项显隐 */
    visible: false,
    /** 当前倍数名称 */
    current: '1.0x',
    /** 倍数列表 */
    list: [
      {
        name: '2.0x',
        value: 2
      },
      {
        name: '1.5x',
        value: 1.5
      },
      {
        name: '1.0x',
        value: 1
      },
      {
        name: '0.5x',
        value: 0.5
      }
    ]
  })
  /**
   * 倍数修改
   * @param item
   */
  const changePlayBackRate = (item: typeof playbackRate['list'][0]) => {
    playbackRate.current = item.name
    videoInstance.value?.setPlaybackRate(item.value)
    playbackRate.visible = false
  }
  return {
    changePlayBackRate,
    playbackRate
  }
}
/** 播放进度模块 */
function progressModule(
  videoInstance: Ref<VideoInstance | undefined>,
  player: Type.Player
) {
  const progress = shallowReactive({
    isProgressing: false,
    inputing: false,
    inputVal: ''
  })

  /**
   * 进度修改
   * @param val ms
   */
  const changeProgress = (val: number) => {
    videoInstance.value?.setCurrentTime(val)
  }
  /**
   * 进度切换
   * @param val 0-100
   */
  const onProgressChange = (val: number) => {
    const realTime = player.duration * (+val / 100)
    changeProgress(realTime)
    progress.isProgressing = false
  }
  /**
   * 进度快速切换
   * @param limit s
   */
  const fastProgressChange = (limit: number) => {
    const num = player.currentTime + limit
    if (num < 0 || num > player.duration) return
    changeProgress(num)
  }
  const startProgressInput = () => {
    progress.inputing = true
    progress.inputVal = sToMs(player.currentTime)
  }
  const endProgressInput = () => {
    if (progress.inputVal.includes(':')) {
      changeProgress(timeToS(progress.inputVal))
    } else if (!isNaN(+progress.inputVal)) {
      changeProgress(+progress.inputVal)
    }
    progress.inputing = false
  }

  return {
    progress,
    startProgressInput,
    changeProgress,
    onProgressChange,
    fastProgressChange,
    endProgressInput
  }
}

export default defineComponent({
  name: 'AwVideo',
  components: {
    AwVideoProgress,
    AwVideoMsg,
    AwVideoMask,
    VideoRender
  },
  directives: {
    ClickOutside
  },
  props: {
    /** 视频源地址 */
    src: {
      type: String,
      default: ''
    },
    /** 画质列表 */
    // quality: {
    //   type: Array as PropType<Type.Quality[]>,
    //   default: () => [
    //     {
    //       name: '1080p 超清',
    //       value: 0
    //     },
    //     {
    //       name: '720p 高清',
    //       value: 1
    //     },
    //     {
    //       name: '自动',
    //       value: -1
    //     }
    //   ]
    // },
    /** 初始化时是否静音 */
    muted: {
      type: Boolean,
      default: false
    },
    /**
     * 视频初始进度，ms
     */
    initCurrentTime: {
      type: Number,
      default: 0
    },
    /**
     * 是否处于资源获取中，用于确定请求是否完成
     */
    requesting: {
      type: Boolean,
      default: false
    },
    btnIcon: {
      type: String,
      default: ''
    }
  },
  emits: ['changeQuality', 'ended', 'error', 'next', 'fullscreen'],
  setup(props, { emit }) {
    const awVideoMsgComp = ref<InstanceType<typeof AwVideoMsg>>()
    const awVideoProgressComp = ref<AwVideoProgressComp>()
    const videoInstance = ref<VideoInstance>()
    const selfEl = ref<HTMLElement>()

    const player: Type.Player = reactive({
      currentTime: 0,
      duration: 0,
      status: Type.PlayerStatus.None,
      volume: props.muted ? 0 : 60,
      bufferedList: [],
      preview: '',
      oldVolume: 0,
      fullScreen: false,
      get isMuted() {
        return this.volume === 0
      },
      isListened: false,
      pip: false,
      webFullScreen: false
    })
    /**
     * 底部控制bar集合
     */
    const controlBar = reactive({
      /** 是否显示 */
      visible: false,
      /**  */
      timer: null as null | NodeJS.Timeout
    })
    const {
      changeProgress,
      onProgressChange,
      fastProgressChange,
      progress,
      ...progressModuleArgs
    } = progressModule(videoInstance, player)
    // const qualityModule =
    //   /** 画质切换模块 */
    //   (() => {
    //     /** 当前画质 */
    //     const currentQuality = ref<Type.Quality['value']>(-1)
    //     /** 画质选项选项显隐 */
    //     const qualitySelectVisible = ref(false)
    //     /** 当前选择的画质名称 */
    //     const currentQualityName = computed(
    //       () =>
    //         props.quality.find((item) => item.value === currentQuality.value)
    //           ?.name || '-'
    //     )

    //     /**
    //      * 画质切换
    //      * @param value 画质值
    //      */
    //     const changeQuality = (value: Type.Quality['value']) => {
    //       currentQuality.value = value
    //       qualitySelectVisible.value = false
    //       emit('changeQuality', value)
    //     }

    //     return {
    //       currentQuality,
    //       currentQualityName,
    //       changeQuality,
    //       qualitySelectVisible
    //     }
    //   })()

    /**
     * 计算进度预览图
     * @param val ms
     */
    const computedPreview = debounce(async (val: number) => {
      const el = videoInstance.value?.fakeVideoEl
      if (!el) return
      player.preview = await getVideoScreenshot(el, val)
    }, 100)

    const play = () => {
      player.status = Type.PlayerStatus.Playing
      videoInstance.value?.play()
    }
    /** 播放控制 */
    const playHandler = () => {
      switch (player.status) {
        case Type.PlayerStatus.Loading: {
          break
        }
        case Type.PlayerStatus.Playing: {
          videoInstance.value?.pause()
          break
        }
        case Type.PlayerStatus.Paused: {
          videoInstance.value?.play()
          break
        }
        case Type.PlayerStatus.Failed: {
          break
        }
      }
    }
    /** 全屏切换 */
    const fullScreenCutover = () => {
      player.fullScreen = !player.fullScreen
      player.webFullScreen = false
      fullscreen(selfEl.value!, player.fullScreen ? 'to' : 'exit')
    }
    /** 画中画切换 */
    const pipCutover = () => {
      player.pip = !player.pip
      const videoEl = selfEl.value!.querySelector('video')

      videoEl && pictureInPicture(videoEl, player.pip ? 'to' : 'exit')
    }
    /** 网页全屏切换 */
    const webFullScreenCutover = () => {
      player.webFullScreen = !player.webFullScreen
      emit('fullscreen', player.webFullScreen)
      setTimeout(() => {
        awVideoProgressComp.value?.initStyle()
      }, 1000)
    }
    /** 静音切换 */
    const volumeCutover = () => {
      if (player.isMuted) {
        player.volume = player.oldVolume
      } else {
        player.oldVolume = player.volume
        player.volume = 0
      }
    }
    /**
     * 消息提示
     * @param item
     */
    const notify = (item: NotifyItem) => {
      return awVideoMsgComp.value!.notify(item)
    }
    const clearNotify = () => {
      return awVideoMsgComp.value!.clearNotify()
    }
    const hideControlBar = () => {
      controlBar.visible = false
      controlBar.timer = null
      controlBar.timer && clearTimeout(controlBar.timer)
    }
    /** 控制bar显隐控制器 */
    const controlBarVisibleHandler = throttle(() => {
      if (controlBar.timer) {
        clearTimeout(controlBar.timer)
        controlBar.timer = null
      }
      controlBar.visible = true
      controlBar.timer = setTimeout(hideControlBar, 3000)
    }, 100)
    /** 增加音量 */
    const increaseVolume = () => {
      let newVol = player.volume + 10
      if (newVol >= 100) {
        newVol = 100
      }
      player.volume = newVol
    }
    /** 减少音量 */
    const lowerVolume = () => {
      let newVol = player.volume - 10
      if (newVol <= 0) {
        newVol = 0
      }
      player.volume = newVol
    }

    /** 视频初始化钩子 */
    const videoInits = {
      start() {
        player.status = Type.PlayerStatus.Loading
      },
      successed() {
        // player.status = 2
      },
      failed() {
        player.status = Type.PlayerStatus.Failed
      }
    }
    /** 视频响应事件 */
    const videoEvents = {
      /** 准备就绪 */
      loadedmetadata(e: Event) {
        const { duration } = e.target as HTMLVideoElement
        player.duration = duration
        props.initCurrentTime && changeProgress(props.initCurrentTime)
      },
      /** 每次播放就绪 */
      canplay() {
        player.status = Type.PlayerStatus.Paused
      },
      /** 进度 监听 */
      timeupdate(e: Event) {
        if (progress.isProgressing) return
        const video = e.target as HTMLVideoElement

        player.currentTime = video.currentTime
        player.bufferedList = Array(video.buffered.length)
          .fill(0)
          .map((_, index) => {
            return [video.buffered.start(index), video.buffered.end(index)]
          })
      },
      /** 播放结束 监听 */
      ended() {
        player.status = Type.PlayerStatus.Paused
        notify({
          content: '本集已播放完成~',
          duration: 5000
        })
        emit('ended')
      },
      /** 播放 监听 */
      play() {
        player.status = Type.PlayerStatus.Playing
      },
      /** 暂停 监听 */
      pause() {
        player.status = Type.PlayerStatus.Paused
      },
      /** 错误 监听 */
      error(e: Error) {
        console.error(e)
        player.status = Type.PlayerStatus.Failed
        emit('error')
        notify({
          content: '视频加载错误，emmm~',
          duration: 5000
        })
      },
      /** 缓冲开始 监听 */
      waiting: () => {
        player.status = Type.PlayerStatus.Loading
      },
      /** 缓冲结束 监听 */
      playing: () => {
        play()
      },
      volumechange(e: Event) {
        player.volume = (e.target as HTMLMediaElement).volume * 100
      }
    }

    /** 监听 */
    ;(() => {
      // ps: 全屏下无法监听keydown等
      useEventListener('resize', () => {
        !checkFullscreen() && (player.fullScreen = false)
      })
      useEventListener('leavepictureinpicture', () => {
        player.pip = false
      })
      useEventListener('keydown', (e) => {
        if (progress.inputing) return
        const evt = e as KeyboardEvent
        e.preventDefault()
        switch (evt.key) {
          // 方向键左
          case 'ArrowLeft': {
            fastProgressChange(-10)
            break
          }
          // 方向键右
          case 'ArrowRight': {
            fastProgressChange(10)
            break
          }
          case 'ArrowUp': {
            increaseVolume()
            break
          }
          case 'ArrowDown': {
            lowerVolume()
            break
          }
          // 空格键
          case ' ': {
            playHandler()
            break
          }
          // esc
          case 'Escape': {
            player.webFullScreen && webFullScreenCutover()
            break
          }
        }
      })
    })()

    return {
      PlayerStatus: Type.PlayerStatus,
      videoInits,
      videoEvents,
      awVideoProgressComp,
      videoInstance,
      selfEl,
      awVideoMsgComp,
      player,
      controlBar,
      progress,
      hideControlBar,
      playHandler,
      sToMs,
      fullScreenCutover,
      pipCutover,
      volumeCutover,
      changeProgress,
      computedPreview,
      notify,
      webFullScreenCutover,
      clearNotify,
      onProgressChange,
      fastProgressChange,
      controlBarVisibleHandler,
      ...progressModuleArgs,
      ...playbackRateModule(videoInstance)
      // ...qualityModule
    }
  }
})
</script>
<style lang="less" scoped>
@import './styles/aw-video';
</style>
