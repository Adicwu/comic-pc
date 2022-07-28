import { VNode, VNodeProps } from 'vue'

export const enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 2,
  STATEFUL_COMPONENT = 4,
  TEXT_CHILDREN = 8,
  ARRAY_CHILDREN = 16,
  SLOTS_CHILDREN = 32,
  TELEPORT = 64,
  SUSPENSE = 128,
  COMPONENT_SHOULD_KEEP_ALIVE = 256,
  COMPONENT_KEPT_ALIVE = 512,
  COMPONENT = 6
}
export const enum MoveType {
  ENTER,
  LEAVE,
  REORDER
}

export type Cache = Map<VNodeProps['key'], VNode>
