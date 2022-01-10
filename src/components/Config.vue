<template>
  <div class="config-line">
    表头配置
    <fe-spacer :x=".5" inline></fe-spacer>
    <fe-switch v-model="sheetSwitch" />
  </div>
  <fe-spacer :x=".5"></fe-spacer>
  <div class="config">
    <div class="wrapper">
      <div class="config-item" :key="index" v-for="(item,index) in form">
        <fe-input v-model="item.value" size="mini" placeholder />
        <fe-button ghost size="mini" @click.stop="onRemove(item)" auto>
          <template #icon>
            <MinusCircle />
          </template>
        </fe-button>
      </div>
    </div>

    <fe-button
      @click="onAdd"
      size="mini"
      style="margin-top:10px;width: 100%;"
      ghost
      type="success"
    >添加一项</fe-button>
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs,ref } from 'vue'
import { MinusCircle } from '@fect-ui/vue-icons'
export default defineComponent({
  name: 'Config',
  props: ['config','abled'],
  components: { MinusCircle },
  setup(props) {

    const { config ,abled} = toRefs(props)
    const sheetSwitch = ref(abled.value)
    const form = reactive(config.value.map(item => ({ ...item })))
    const onRemove = (item) => {
      form.splice(form.indexOf(item) >>> 0, 1)
    }
    const onAdd = () => {
      form.push({ value: '' })
    }
    return {
      form, onRemove, onAdd,sheetSwitch
    }
  }
})
</script>
<style scoped>
.config {
  margin-bottom: 10px;
}
.config-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.config .fect-input {
  flex: 1;
  margin-right: 10px;
  width: 100% !important;
}
.wrapper {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 1px;
}
</style>