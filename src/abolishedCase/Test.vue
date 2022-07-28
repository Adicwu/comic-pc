<template>
  <div class="test">
    <!-- <keep-alive>
      <keep-alive v-for="item in list" :key="item.id">
        <TestItem :id="item.id" />
      </keep-alive>
    </keep-alive> -->
    <AwComponentsAlive>
      <TestItem v-for="item in list" :id="item.id" :key="item.id" />
    </AwComponentsAlive>

    <button @click="list.pop()">pop</button>
    <button @click="list.push({ id: 3 })">push</button>
    <button @click="list.push({ id: Math.random() })">random</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import TestItem from './TestItem.vue'
import { AwComponentsAlive } from '@/components/AwComponentsAlive'
const list = ref([{ id: 1 }, { id: 2 }, { id: 3 }])
</script>
<style lang="less" scoped>
.test {
  color: #fff;
}
</style>
