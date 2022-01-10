<template>
  <fe-modal @confirm="onOk" title="配置" v-model:visible="show" cancel="取消" done="确认">
    <Config ref="Config" v-if="show" :abled="sheetSwitch" :config="config"></Config>
  </fe-modal>
  <main>
    <div @click="addFile" class="info" v-if="!loading && !currentFile">
      <div>
        <FilePlus size="80" />
      </div>拖拽或点击上传excel
    </div>
    <fe-loading v-if="loading && !currentFile" type="success" load-type="cube" />

    <div class="left" v-if="jsonData">
      <fe-spacer :y="1" />
      <fe-checkboxGroup size="small" :key="String(group)" v-model="group">
        <fe-checkbox
          style="margin-bottom: 4px;"
          v-for="item in sheetList"
          :key="item"
          :label="item"
        >{{ item }}</fe-checkbox>
      </fe-checkboxGroup>
      <fe-spacer :y=".5" />

      <div :key="item" v-for="item in cTheKeys">
        <div class="input-item">
          <fe-input v-model="formValue[item]" :prefix="item" placeholder size="mini" />
          <fe-switch size="mini" v-model="inputCheckbox[item]" />
        </div>
        <fe-spacer :y="1" />
      </div>
      <div class="actions">
        <fe-button auto :disabled="!jsonData" @click="comfirm" ghost size="mini">
          <template #icon>
            <RefreshCw />
          </template>更新
        </fe-button>
        <fe-spacer :x=".5" inline />
        <fe-button
          :loading="loading"
          load-type="cube"
          auto
          :disabled="!jsonData"
          @click="addFile"
          ghost
          type="success"
          size="mini"
        >
          <template #icon>
            <FilePlus />
          </template>导入
        </fe-button>
        <fe-spacer :x=".5" inline />
        <fe-button size="mini" @click="onShow" auto>
          <template #icon>
            <Settings />
          </template>
        </fe-button>
      </div>
    </div>
    <vue-json-pretty
      ref="jsonViewer"
      showLength
      v-show="jsonData"
      :virtualLines="40"
      class="right"
      virtual
      :data="jsonData"
    ></vue-json-pretty>
    <div v-show="jsonData" class="fixedAction">
      <fe-button @click="reval" size="mini" auto shadow>
        <template #icon>
          <HardDrive />
        </template>
      </fe-button>
      <fe-spacer :x=".5" inline />
      <fe-button @click="exportFile" size="mini" auto shadow>
        <template #icon>
          <DownloadCloud />
        </template>
      </fe-button>
      <fe-spacer :x=".5" inline />
      <fe-button size="mini" @click="onCopy" auto shadow>
        <template #icon>
          <Copy />
        </template>
      </fe-button>
    </div>

    <fe-back-top
      :right="37"
      v-if="jsonData"
      :bottom="70"
      :target="getTarget"
      :visibility-height="100"
    >
      <div class="fect-back-top-custom">UP</div>
    </fe-back-top>
  </main>
</template>

<script>
import { ref, reactive, getCurrentInstance, computed, watch } from 'vue'
import { FilePlus, Copy, DownloadCloud, RefreshCw, Settings, HardDrive } from '@fect-ui/vue-icons'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import Config from './components/Config.vue'

const fs = require('fs')
const electron = require('@electron/remote')
const { dialog, shell } = electron
export default {
  name: 'App',
  components: {
    VueJsonPretty, FilePlus, Copy, DownloadCloud, RefreshCw, Settings, Config, HardDrive
  },
  setup() {
    const jsonViewer = ref(null);
    const { proxy } = getCurrentInstance()
    let workSheetsFromFile = ref(null)
    let inputCheckbox = ref({})
    let formValue = reactive({})
    let jsonData = ref(null)
    let config = ref(null)
    let currentFile = ref(null)
    let theKeys = ref([])
    const Config = ref(null)
    const group = ref([])
    const sheetSwitch = ref(false)
    const loading = ref(false)
    const show = ref(false)
    const sheetList = ref([])
    window.addEventListener('dragover', event => {
      event.preventDefault()
    })
    window.addEventListener('drop', event => {
      const file = event.dataTransfer.files[0]
      init(file)
    })
    const cTheKeys = computed(() => {
      return sheetSwitch.value ? config.value.map(item => item.value) : theKeys.value
    })
    watch(() => cTheKeys.value, (value) => {
      let o = {}
      value.forEach(item => {
        o[item] = inputCheckbox.value[item] !== false
        inputCheckbox.value = (o)
      })
    }, { immediate: true })
    const parse = (file) => {
      const piWorker = new Worker('./worker.js', { type: 'module' });
      let r
      piWorker.onmessage = event => {
        r(event.data)
      };
      piWorker.postMessage(file.path || file);
      return new Promise((resolve) => {
        r = resolve
      })
    }
    const init = async (file) => {
      if (file) {

        if (currentFile.value !== file) {
          config.value = null
        }
        loading.value = true

        workSheetsFromFile.value = await parse(file)

        currentFile.value = file
        let list = workSheetsFromFile.value.map(item => item.name)
        group.value = list
        sheetList.value = list

        const keys = []
        workSheetsFromFile.value.forEach((item) => {
          const { data } = item
          data[0].forEach((key) => {
            !keys.includes(key) && keys.push(key)
          })
        })
        theKeys.value = [...new Set(keys)]
      }
      let res = {}
      workSheetsFromFile.value.forEach((item) => {
        const { name, data } = item
        if (name && group.value.includes(name) && data && data.length) {

          let list = []
          data.forEach((item, index) => {
            if (index) {
              let o = {}
              cTheKeys.value.forEach((key, _index) => {
                let checked = inputCheckbox.value[key]
                key = formValue[key] || key

                if (checked || file) {
                  o[key] = item[_index]
                }
              })
              list.push(o)
            }
          })
          res[name] = list
        }
      })
      jsonData.value = res
      loading.value = false
    }
    const comfirm = () => {
      init()
    }
    const exportFile = () => {
      dialog.showSaveDialog({
        title: '文件另存为',
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      }).then(o => {
        const { filePath } = o
        if (filePath) {
          fs.writeFileSync(
            `${filePath}`,
            JSON.stringify(jsonData.value, null, 4)
          )
        }
      })
    }
    const addFile = () => {
      dialog.showOpenDialog({
        filters: [
          {
            name: 'Excel', extensions: ['csv', 'xlsx', 'xls']
          }],
        // properties:{multiSelections:false}
      }).then(res => {
        const { filePaths } = res
        if (filePaths[0]) {
          init(filePaths[0])
        }
      })
    }
    const onCopy = () => {
      navigator.clipboard.writeText(JSON.stringify(jsonData.value, null, 4)).then(function () {
        proxy.$toast.success({
          text: 'Copied to clipboard!',
          duration: '500'
        })
      })
    }
    const getTarget = () => {
      return document.querySelector('.vjs-tree')
    }
    const onOk = () => {
      config.value = Config.value.form
      sheetSwitch.value = Config.value.sheetSwitch
    }
    const onShow = () => {
      config.value = config.value || theKeys.value.map(item => ({ value: item }))
      show.value = true

    }
    const reval = () => {
      let p = currentFile.value.path || currentFile.value

      shell.showItemInFolder(p)
    }
    return { reval, cTheKeys, sheetSwitch, config, onShow, Config, onOk, show, jsonViewer, onCopy, getTarget, jsonData, inputCheckbox, formValue, comfirm, theKeys, exportFile, group, sheetList, loading, currentFile, addFile }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}
.fect-checkbox {
  height: auto !important;
}
::-webkit-scrollbar {
  width: 5px;
  background-color: #fafafa;
}
::-webkit-scrollbar-thumb {
  background-color: #eaeaea;
  border-radius: 5px;
}
main {
  display: flex;
  height: 100vh;
}
.left {
  height: 100vh;
  overflow-y: auto;
  width: 250px;
  padding: 0 20px;
}
.right {
  flex: 1;
  height: 100vh;
}
.input-item {
  display: flex;
  align-items: center;
}
.input-item .fect-input {
  margin-right: 10px;
}
.info {
  cursor: pointer;
  font-size: 25px;
  font-weight: 600;
  color: #aaa;
  text-align: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.actions {
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
}
.fixedAction {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.fect-back-top-custom {
  height: 40px;
  width: 40px;
  line-height: 40px;
  border-radius: 4px;
  background-color: #1088e9;
  color: #fff;
  text-align: center;
  font-size: 14px;
}
.config-line {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}
</style>
