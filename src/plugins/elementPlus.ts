import { Plugin } from 'vue'
import {
  ElNotification,
  ElCarousel,
  ElCarouselItem,
  ElButton,
  ElPagination,
  ElSlider,
  ElTabs,
  ElTabPane,
  ElColorPicker,
  ElRate,
  ElTooltip,
  ElForm,
  ElFormItem,
  ElInput,
  ElPopconfirm,
  ElTimeline,
  ElTimelineItem,
  ElSelect,
  ElOption,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage
} from 'element-plus'
const comps = [
  ElCarousel,
  ElCarouselItem,
  ElButton,
  ElPagination,
  ElSlider,
  ElTabs,
  ElTabPane,
  ElColorPicker,
  ElRate,
  ElTooltip,
  ElForm,
  ElFormItem,
  ElInput,
  ElPopconfirm,
  ElTimeline,
  ElTimelineItem,
  ElSelect,
  ElOption,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu
]

const plugins = [ElNotification, ElMessage]
export const elementPlusInit: Plugin = {
  install(app) {
    comps.forEach((comp) => {
      app.component(comp.name, comp)
    })
    plugins.forEach((plugin) => {
      app.use(plugin)
    })
  }
}
