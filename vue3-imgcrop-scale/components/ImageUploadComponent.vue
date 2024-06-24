<template>
    <q-uploader url="" :label="label" :multiple="multiple" batch :auto-upload="false" :no-thumbnails="noThumbnails"
        @added="addFile" @removed="removeFile" flat bordered :style="uploadStyle" :accept="acceptType"
        @rejected="handleRejected">
        <template v-slot:header="scope">
            <div class="row no-wrap items-center q-pa-sm q-gutter-xs"
                style="padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;"
                v-if="scope.queuedFiles.length == 0 || multiple">
                <q-btn v-if="scope.queuedFiles.length > 0" icon="clear_all" @click="scope.removeQueuedFiles" round dense
                    flat>
                    <q-tooltip>{{ nameJson.upload.clear }}</q-tooltip>
                </q-btn>
                <div class="col">
                    <div class="q-uploader__title" style="font-size: 1rem;">{{ label }}</div>
                </div>
                <q-btn v-if="scope.canAddFiles" type="a" icon="add_box" @click="scope.pickFiles" round dense flat>
                    <q-uploader-add-trigger />
                    <q-tooltip>{{ nameJson.upload.add }}</q-tooltip>
                </q-btn>
            </div>
        </template>
        <template v-slot:list="scope">
            <div v-for="file in scope.files" :key="file.__key" style="width:100%;height: 223px; margin-top: -5px;">
                <el-image :src="croppedDataURL" style="height: 223px;" />
                <q-item-section style="position:absolute;right:0;top:0;">
                    <q-btn class="gt-xs" size="18px" flat dense round icon="close" @click="scope.removeFile(file)" />
                </q-item-section>
                <el-button v-if="scope.files.length > 0" :type="hasEdit ? 'success' : 'primary'" :icon="Edit" circle
                    class="crop-button" @click="handleShow" />
            </div>
        </template>
    </q-uploader>
    <CropPictureDialogComponent v-model="croppedDataURL" v-model:visible="visible" :default-image="dataURL" />
</template>


<script setup lang="ts">
import nameJson from '@/assets/json/name.json'
import { fileToDataURL, setPictureScale } from '@/common/api/modelApi';
import { defaultMessage } from '@/common/util';
import { Edit } from '@element-plus/icons-vue';
import { computed, ref, type Ref } from 'vue';
import { enterDownStore } from '@/stores/index'

const enterDown = enterDownStore()

const props = defineProps({
    multiple: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: ''
    },
    uploadStyle: {
        type: String,
        default: ''
    },
    acceptType: {
        type: String,
        default: '*'
    },
    rejectedMessage: {
        type: String,
        default: ''
    },
    noThumbnails: {
        type: Boolean,
        default: false
    }
})

const file: Ref<any[]> = ref([])

function handleShow(event:KeyboardEvent){
    visible.value = true;
    enterDown.changeVisiable(visible.value)
    const target = event.currentTarget as HTMLElement;
    target.blur();
}

function addFile(files: readonly any[]) {
    // console.log(files);
    file.value.push(...files)
    changeFile(file.value)
}

function removeFile(files: readonly any[]) {
    file.value.splice(file.value.indexOf(files[0]), 1)
    changeFile(file.value)
}

async function changeFile(files: readonly any[]) {
    let fileName = ''
    let fileDataURL = ''

    if (files.length > 0) {
        fileName = files[0].name
        fileDataURL = await fileToDataURL(files[0])
        console.log("Query image is too large (>5MB) and scaled")
        fileDataURL = await setPictureScale(fileDataURL)
    }

    name.value = fileName
    dataURL.value = fileDataURL
    croppedDataURL.value = fileDataURL
}

function handleRejected(rejectedEntries: { failedPropValidation: string, file: File }[]) {
    for (const entry of rejectedEntries) {
        if (entry.failedPropValidation === "duplicate") {
            defaultMessage(`Duplicate file: ${entry.file.name}, please resubmit other files`, 'warning')
        } else if (entry.failedPropValidation === "accept") {
            defaultMessage(`Incorrect file type, please select ${props.rejectedMessage} files`, 'warning')
        }
    }
}

//crop part
const dataURL = ref('')
const croppedDataURL = ref('')
const name = ref('')
const visible = ref(false)
const hasEdit = computed(() => croppedDataURL.value !== '' && dataURL.value !== croppedDataURL.value)

function getPictureInfo() {
    return {
        name: name.value,
        file: croppedDataURL.value
    }
}
defineExpose({ hasEdit, file, getPictureInfo })
</script>

<style lang="scss" scoped>
.crop-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
}
</style>