import { createApp, Component } from 'vue'

export function mountComponent(RootComponent: Component) {
  const app = createApp(RootComponent)
  const root: HTMLDivElement = document.createElement('div')

  document.body.appendChild(root)

  return {
    instance: app.mount(root),
    unmount() {
      app.unmount()
      document.body.removeChild(root)
    }
  }
}
