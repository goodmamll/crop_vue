<template>
  <el-dialog v-model="dialogVisible" title="Edit picture" width="1024px" align-center destroy-on-close>
    <div class="content">
      <section class="cropper-area">
        <div class="img-cropper">
          <Cropper ref="cropper" class="cropper" :src="modelValue" :stencil-props="{ aspectRatio }"
            :stencil-component="circleStencil ? CircleStencil : RectangleStencil" />
        </div>

      </section>
      <section class="preview-area">
        <div>
          <el-text size="large">Cropped Image</el-text>
          <div class="cropped-image">
            <el-image v-if="displayImg" :src="displayImg" alt="Cropped Image" :preview-src-list="[displayImg]" />
            <div v-else class="crop-placeholder" />
          </div>
          <div class="actions">
            <!--  <slot name="actions" :actionsObj="actionsObj"></slot>-->
            <el-button type="primary" @click.prevent="actionsObj.rotate(90)" style="margin-left: 12px;width:100px;"
              :loading="cropButtonLoading">
              <template #icon>
                <el-icon size="20">
                  <RefreshRight />
                </el-icon>
              </template>
              <span>Rotate</span>
            </el-button>
            <el-button type="primary" @click.prevent="actionsObj.cropImage" style="margin: 0;width:100px;">
              <el-icon size="20">
                <Crop />
              </el-icon>
              <span>Crop</span>
            </el-button>
            <el-button type="primary" @click.prevent="actionsObj.reset" style="margin-left: 12px;width:100px;">
              <template #icon>
                <el-icon size="20">
                  <Refresh />
                </el-icon>
              </template>
              <span>Reset</span>
            </el-button>
            <el-button type="primary" @click.prevent="actionsObj.autoCrop" style="margin: 0;width:100px;"
              :loading="autoButtonLoading">
              <template #icon>
                <el-icon size="20">
                  <Scissor />
                </el-icon>
              </template>
              <span>Auto</span>
            </el-button>
          </div>
        </div>
        <el-button type="primary" style="width: 100%;" @click="editPicture">{{ nameJson.ok }}</el-button>
      </section>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import nameJson from '@/assets/json/name.json'
import { Cropper, RectangleStencil, CircleStencil } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import { computed, ref } from 'vue';
import { autoCropImage } from '@/common/util/harris';
import { resizePicture } from '@/common/api/modelApi';
import { enterDownStore } from '@/stores/index';

const enterDown = enterDownStore()

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  defaultImage: {
    type: String,
  },
  displayImage: {
    type: String,
  },
  aspectRatio: {
    type: Number
  },
  circleStencil: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:displayImage', value: string): void
  (e: 'update:visible', value: boolean): void
}>()

const hasEdited = ref(false)

const dialogVisible = computed<boolean>({
  set(value) {
    emit('update:visible', value)
    enterDown.changeVisiable(value)
  },
  get() {
    return props.visible
  }
})


function editPicture() {
  emit('update:modelValue', convertPicture())
  if (props.displayImage) {
    emit('update:displayImage', hasEdited.value ? displayImg.value : props.displayImage)
  }
  dialogVisible.value = false
  enterDown.changeVisiable(dialogVisible.value)
}

function convertPicture() {
  return hasEdited.value ? cropImg.value : props.modelValue
}

// crop组件部分
const cropImg = ref('')
const displayImg = ref('')
const cropper = ref<any>()
const cropButtonLoading = ref(false)
const autoButtonLoading = ref(false)
const hasRotate = ref(0)

async function cropImage() {
  const { canvas } = cropper.value.getResult();
  cropImg.value = canvas.toDataURL()
  displayImg.value = await resizePicture(canvas.toDataURL(), true)

  hasEdited.value = true
}

function move(offsetX: number, offsetY: number) {
  cropper.value.move(offsetX, offsetY)
}

async function reset() {
  cropper.value.reset()
  hasEdited.value = true
  hasRotate.value = 0

  if (props.defaultImage) {
    if (props.displayImage) {
      displayImg.value = await resizePicture(props.defaultImage, true)
      emit('update:displayImage', hasEdited.value ? displayImg.value : props.displayImage)
    }

    emit('update:modelValue', props.defaultImage)
    cropImg.value = props.defaultImage
  }
}

function rotate(deg: number) {
  // const {coordinates: beforeCoordinates, visibleArea: beforeVisibleArea} = cropper.value.getResult()
  cropButtonLoading.value = true
  cropper.value.rotate(deg)
  hasRotate.value++
  setTimeout(() => {
    zoom(0)
    setTimeout(() => {
      cropButtonLoading.value = false
    }, 500)
    // setTimeout(() => {
    //   const {coordinates:afterCoordinates, visibleArea:afterVisibleArea} = cropper.value.getResult()
    //   const width = beforeCoordinates.height / afterVisibleArea.width * beforeVisibleArea.height
    //   const height = beforeCoordinates.width / afterVisibleArea.height * beforeVisibleArea.width
    //   console.log(beforeCoordinates.height,beforeCoordinates.width,width,height)
    //   cropper.value.setCoordinates([() => ({
    //         width,
    //         height,
    //       }),
    //       // There will be coordinates after first transformation
    //       () => ({
    //         left: beforeCoordinates.left,
    //         top: beforeCoordinates.top
    //       })])
    // })
  }, 500)
}

function zoom(percent: number) {
  cropper.value.zoom(percent)
}

function flip(horizontal: boolean, vertical: boolean) {
  cropper.value.flip(horizontal, vertical)
}

function autoCrop() {
  autoButtonLoading.value = true
  let currentImage: any = undefined
  if (hasRotate.value % 4 !== 0) {
    // [Maximize stencil]: the entire ratated image used as the input
    // cropper.value.setCoordinates(({ imageSize }) => ({
    //   width: imageSize.width,
    //   height: imageSize.height
    // }))
    // setTimeout(() => {
    const { canvas } = cropper.value.getResult();
    currentImage = canvas.toDataURL()
    // }, 300)
  } else {
    currentImage = props.defaultImage ? props.defaultImage : props.modelValue
  }

  setTimeout(() => {
    autoCropImage(currentImage).then(async (value) => {
      cropImg.value = value
      displayImg.value = await resizePicture(value, true)
      hasEdited.value = true
      autoButtonLoading.value = false
    })
  }, 400)
}

const actionsObj = {
  move,
  reset,
  rotate,
  zoom,
  cropImage,
  flip,
  autoCrop,
}
</script>

<style scoped lang="scss">
.content {
  display: flex;
  justify-content: space-between;
}

.cropper {
  width: 730px;
  min-height: 500px;
  max-height: 700px;
}

.actions {
  margin-top: 1rem;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.preview-area {
  width: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.crop-placeholder {
  width: 100%;
  height: 200px;
  background: #ccc;
}

.cropped-image {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.cropped-image img {
  max-width: 100%;
}
</style>