<template>
  <el-dialog v-model="dialogVisible" title="Edit picture" width="500px" align-center
             destroy-on-close>
    <div class="content">
      <Cropper ref="cropper" class="cropper" :src="modelValue" :stencil-props="{ aspectRatio }"
               :stencil-component="circleStencil ? CircleStencil : RectangleStencil"/>
    </div>
    <template #footer>
      <el-button type="primary" @click.prevent="reset" style="width:100px;">
        <el-icon size="20">
          <Refresh/>
        </el-icon>
        <span>Reset</span>
      </el-button>
      <el-button type="primary" @click.prevent="editPicture" style="width:100px;">
        <el-icon size="20">
          <Crop/>
        </el-icon>
        <span>Crop</span>
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {Cropper, RectangleStencil, CircleStencil} from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import {computed, ref} from 'vue';
import {Crop, Refresh} from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  aspectRatio: {
    type: Number
  },
  circleStencil: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'CropImage', value:string):void
}>()

const hasEdited = ref(false)

const dialogVisible = computed<boolean>({
  set(value) {
    emit('update:visible', value)
  },
  get() {
    return props.visible
  }
})


function editPicture() {
  cropImage().then(()=> {
    emit('CropImage', cropImg.value)
    dialogVisible.value = false
  })
}

function convertPicture() {
  return hasEdited.value ? cropImg.value : props.modelValue
}

// crop组件部分
const cropImg = ref('')
const cropper = ref<any>()

async function cropImage() {
  const {canvas} = cropper.value.getResult();
  cropImg.value = canvas.toDataURL()
  hasEdited.value = true
}

function reset() {
  cropper.value.reset()
}
</script>

<style scoped>
.content {
  display: flex;
  justify-content: space-between;
}

.cropper {
  width: 540px;
  min-height: 300px;
  max-height: 500px;
}

.cropped-image img {
  max-width: 100%;
}
</style>