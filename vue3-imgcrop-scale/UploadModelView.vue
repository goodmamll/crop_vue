<template>
  <SearchPageTableFrame v-model:current-page="currentPage" :page-size="8" :total-num="images.length">
    <template #top>
      <el-card style="width: 100%; --el-card-padding: 5px;">
        <el-row align="middle" justify="center">
          <el-col :span="8">
            <UploaderComponent upload-style="width:100%;min-height:110px;" :label="nameJson.page.upload.pick"
              :no-thumbnails="true" v-model:files="files" :multiple="true" accept-type=".dwg, .pdf"
              rejected-message="PDF/DWG" />
          </el-col>
          <el-col :span="14">
            <el-form label-position="right" label-width="105px">
              <el-row class="space-height"></el-row>
              <el-row>
                <el-col :span="13">
                  <SelectInputComponent v-model="selectDesigner" :label="nameJson.model.author" width="100%"
                    :selections="designerSelection" filterable></SelectInputComponent>
                </el-col>
                <el-col :span="7">
                  <SelectInputComponent v-model="selectType" label-width="100px" :label="nameJson.model.typethick" :selections="typeSelection">
                  </SelectInputComponent>                  
                </el-col>
                <el-col :span="3">
                  <SelectInputComponent label-width="0" width="100%" v-model="selectThickness" :selections="thicknessSelection"></SelectInputComponent>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="13">
                  <el-form-item :label="nameJson.model.designDate">
                    <el-date-picker v-model="selectDate" type="date" :placeholder="nameJson.selectPlaceholder"
                      :disabled-date="disabledDate" style="width:100%;" popper-class="data-pick" 
                      class="solve-blur" @change="handleDateChange('solve-blur')">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                    <el-form-item :label="nameJson.model.drawingNo" label-width="100px" prop="name">
                          <el-input v-model="drawing_no" clearable :placeholder="nameJson.model.drawingNo" style="width: 100%;" />
                    </el-form-item>
                </el-col>
              </el-row>
              <el-row class="space-height"></el-row>
            </el-form>
          </el-col>
          <el-col :span="2">
            <el-row class="space-height"></el-row>
            <el-row>
              <el-button type="success" style="width: 85px;" @click="handleUpdateClick" :disabled="isSearching||!hasResoure">
                <el-icon size="20">  <RefreshRight /></el-icon>
                <span>{{ nameJson.page.upload.update}}</span>
              </el-button>
            </el-row>
            <el-row style="height: 22px;"></el-row>
            <el-row>
              <el-button type="primary" style="width: 85px;" @click="handleImportClick" :disabled="isSearching">
                <el-icon size="20">
                  <UploadFilled />
                </el-icon>
                <span>{{
                  nameJson.page.upload.import
                }}</span></el-button>
            </el-row>
            <el-row class="space-height"></el-row>
          </el-col>
        </el-row>
        <el-row>
          <UploadStatusDisplayComponent :file="files">
          </UploadStatusDisplayComponent>
        </el-row>
      </el-card>
    </template>

    <template #default>
      <CardDisplayComponent :loading="loading">
        <ImageCardComponent :image="image" v-for="(image, index) in pageImage" :key="index" :choose-border="true"
          :be-choosed="getSelectRes(index)" :click="clickCard" :value="index" :throttle="0">
          <el-row justify="space-around">
            <el-col :span="18">
              <SelectInputComponent :label="nameJson.model.LFDesign" :selections="designSelection" labal-width="90px"
                v-model="selectionValues[(currentPage - 1) * 8 + index]" margin-bottom="10px" width="100%" />
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click.stop="visible = true; isEditingPictureIndex = index" style="width: 90%;">
                <el-icon>
                  <Edit />
                </el-icon>
              </el-button>
            </el-col>
          </el-row>
        </ImageCardComponent>
      </CardDisplayComponent>
    </template>
  </SearchPageTableFrame>

  <CropPictureDialogComponent v-if="visible" v-model="cropDataURL" v-model:display-image="cropDisplayDataURL"
    v-model:visible="visible" :default-image="originalDataURL" />
</template>

<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue';
import nameJson from '@/assets/json/name.json'
import SearchPageTableFrame from '@/components/frame/SearchPageTableFrame.vue';
import ImageCardComponent from '@/components/ImageCardComponent.vue';
import CardDisplayComponent from '@/components/CardDisplayComponent.vue';
import SelectInputComponent from '@/components/SelectInputComponent.vue';
import UploaderComponent from '@/components/UploaderComponent.vue';
import CropPictureDialogComponent from '@/components/CropPictureDialogComponent.vue';
import UploadStatusDisplayComponent from '@/components/UploadStatusDisplayComponent.vue';
import { useSelections } from "@/common/global/selection";
import { uploadModel, convertPdfToImage, fileToDataURL } from '@/common/api/modelApi';
import dayjs from 'dayjs';
import type { FileInfo, UploadRes } from '@/common/type';
import { baseTimeFormat, defaultMessage, defaultMessageBox, promiseMessageBox, handleDateChange } from '@/common/util';
import { uploadStore } from '@/stores/upload';
import { v5 as uuidv5 } from 'uuid';


const { thicknessSelection, typeSelection, designerSelection, designSelection } = useSelections()
const selectThickness = ref(1)
const selectType = ref(1)
const selectDesigner = ref(1)
const selectDate = ref(dayjs().format('YYYY-MM-DD'))
const drawing_no = ref('')
const hasPdf = ref(false)
const hasDwg = ref(false)
const loading = ref(false)
const hasErr = ref(false)
const isSearching = ref(false)
const files: Ref<any[]> = ref([])
const images: Ref<any[]> = ref([])
const selectionValues: Ref<number[]> = ref([])
const pickArray: Ref<number[]> = ref([])
const currentPage = ref(1)
const pdfFileIndex = ref(-1)
const pdfFileName = computed(() => pdfFileIndex.value == -1 ? '' : files.value[pdfFileIndex.value].name)
const AllFileName: Ref<string[]> = ref([])
const hasResoure = ref(false)
const originalImage: Ref<string[]> = ref([])
const displayImages: Ref<any[]> = ref([])
const isEditingPictureIndex = ref(0)
const visible = ref(false)
const originalDataURL = computed(() => originalImage.value[(currentPage.value - 1) * 8 + isEditingPictureIndex.value])
const cropDataURL = computed({
  get() { return images.value[(currentPage.value - 1) * 8 + isEditingPictureIndex.value] },
  set(value) { images.value[(currentPage.value - 1) * 8 + isEditingPictureIndex.value] = value }
})
const cropDisplayDataURL = computed({
  get() { return displayImages.value[(currentPage.value - 1) * 8 + isEditingPictureIndex.value] },
  set(value) { displayImages.value[(currentPage.value - 1) * 8 + isEditingPictureIndex.value] = value }
})

watch(files, (newVal) => {
  hasPdf.value = false
  hasDwg.value = false
  hasErr.value = false
  loading.value = false
  images.value = []
  displayImages.value = []
  originalImage.value = []
  pickArray.value = []
  pdfFileIndex.value = -1
  AllFileName.value = []  

  console.log(newVal);
  for (let i = 0; i < newVal.length; i++) {

    if (newVal[i].name.endsWith('.pdf')) {
      if (hasPdf.value == true) {
        hasErr.value = true
        continue
      }
      hasPdf.value = true
      loading.value = true
      getImage(newVal[i])
      pdfFileIndex.value = i
    } else if (newVal[i].name.endsWith('.dwg')) {
      hasDwg.value = true
    }

    AllFileName.value.push(newVal[i].name)
  }
}, { deep: true })

function getImage(file: any) {
  fileToDataURL(file).then((f) => {
    convertPdfToImage(f).then(async ({src,previewSrc}) => {
      images.value = src
      displayImages.value = previewSrc
      // for(const src of srcs) {
      //     images.value.push(await autoCropImage(src))
      //   }
        for (let i = 0; i < images.value.length; i++) {
          selectionValues.value.push(1)
        }
        
        for (let i = 0; i < images.value.length; i++) {
          originalImage.value.push(src[i])
      }
      loading.value = false
    })
  })
}

const pageImage = computed(() => {
  let start = (currentPage.value - 1) * 8
  let end = start + 8 > displayImages.value.length ? displayImages.value.length : start + 8
  return displayImages.value.slice(start, end)
})

function clickCard(index: number) {
  const imgIndex = (currentPage.value - 1) * 8 + index
  const i = pickArray.value.indexOf(imgIndex)

  if (i >= 0) {
    pickArray.value.splice(i, 1)
  } else {
    pickArray.value.push(imgIndex)
  }
}

function getSelectRes(index: number) {
  const imgIndex = (currentPage.value - 1) * 8 + index
  return pickArray.value.indexOf(imgIndex) >= 0
}

async function handleUpdateClick(event: Event) {
  handleImportClick(event, true)
}

function simaryChoose() {
  let sd = false
  let ud = false
  for (let index of pickArray.value) {
    if (selectionValues.value.length > index) {
      if (selectionValues.value[index] == 1) {
        sd = true
      } else {
        ud = true
      }
    }
  }
  console.log((sd && ud));
  return !(sd && ud)
}

async function handleImportClick(_event: Event, update = false) {
  if (hasErr.value) {
    defaultMessage(nameJson.message.hasPdf, 'error')
    return
  }
  if (!hasPdf.value) {
    defaultMessage(nameJson.message.noPdf, 'error')
    return
  }
  if (pickArray.value.length == 0) {
    defaultMessage(nameJson.message.noChipDesign, 'error')
    return
  }
  if (!hasDwg.value) {
    const ok = await promiseMessageBox(nameJson.message.noDwg, 'error')
    if(!ok) return
  }
  if (drawing_no.value == null || drawing_no.value.trim() == '') {
    const ok = await promiseMessageBox(nameJson.message.noDrawingNo, 'error')
    if(!ok) return
  }
  
  if (simaryChoose()) {
    defaultMessageBox(nameJson.message.chipDesignCheck, 'warning', () => {
      uploadFileAndModel(update)
    }, () => {
    })
  } else {
    uploadFileAndModel(update)
  }
}

async function uploadFileAndModel(update: boolean) {
  isSearching.value = true
  const pickImgs: Array<FileInfo> = []
  const fileName = pdfFileName.value.substring(0, pdfFileName.value.length - 4)
  const UIDNAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
  for (let i = 0; i < pickArray.value.length; i++) {
    const obj: FileInfo = {
      name: `${fileName}-${pickArray.value[i]}.png`,
      uuidstr: uuidv5(`${fileName}-${pickArray.value[i]}.png`, UIDNAMESPACE),
      design: selectionValues.value[pickArray.value[i]],
      base64: images.value[pickArray.value[i]]
    }    
    pickImgs.push(obj)
  }

  const fileBase64s: Array<FileInfo> = []
  try {
    for (let i = 0; i < files.value.length; i++) {
      fileBase64s.push({
        name: AllFileName.value[i],
        base64: await fileToDataURL(files.value[i])
      })
    }
  } catch (error) {
    console.log(error);
  }
  const res: UploadRes = {
    img_list: [],
    size_list: [],
    file: [],
    model: {
      model_id: '',
      pdf_name: '',
      dwg_name: '',
      designer: 0,
      thickness: 0,
      type: 0,
      design_date: '',
      download_times: 0,
    },
    state: 400,
    message: nameJson.message.network
  }
  hasResoure.value = await uploadModel({
    imgList: pickImgs,
    fileList: fileBase64s,
    type: selectType.value,
    thickness: selectThickness.value,
    designer: selectDesigner.value,
    uploadTime: baseTimeFormat('date', selectDate.value),
    drawing_no: drawing_no.value    
  }, update, res)
  isSearching.value = false
  
  const uploadS = uploadStore()
  uploadS.getUploadData(res, files.value, pdfFileIndex.value)
}

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}
</script>

<style lang="scss" scoped>
.img-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  font-size: 1rem;
}

.el-form-item {
  margin-bottom: 0px;
}

.space-height {
  height: 12px;
}
</style>