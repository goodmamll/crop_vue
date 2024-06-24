<template>
    <q-uploader url="" :label="label" :multiple="multiple" batch :auto-upload="false" :no-thumbnails="noThumbnails"
        @added="addFile" @removed="removeFile" :filter="fileFilter" flat bordered :style="uploadStyle" :accept="acceptType"
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
    </q-uploader>
</template>


<script setup lang="ts">
import nameJson from '@/assets/json/name.json'
import { defaultMessage } from '@/common/util';
import { ref, type Ref } from 'vue';

const props = defineProps({
    multiple: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: ''
    },
    files: {
        type: Array<File>,
        required: true
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

function fileFilter(fileList:readonly any[] | FileList) {
    let pdfIndex = hasPdf()
    console.log(pdfIndex);

    const ans:File[] = []
    let uploadPdf = false

    for (const f of fileList) {
        if (f.name.length >= 64) {
            defaultMessage(nameJson.message.longfilename,'warning')
            continue
        }
        const pattern_Ch = new RegExp("[\u4E00-\u9FA5]");
        const pattern_EnSy = new RegExp("[A-Za-z0-9 -.!@#$%^&*()=|{}':;',~！@#￥……（）——【】‘；：”“'。，、+-_/]");
        if (pattern_Ch.test(f.name) == true || pattern_EnSy.test(f.name) == false) {
        // if (f.name.match(/^[A-Za-z0-9 -.!@#$%^&*()=|{}':;',~！@#￥……（）——【】‘；：”“'。，、+-_/]*$/) == null || pattern_Ch.test(f.name) == true ) {
            defaultMessage(nameJson.message.noenglish,'warning')
            continue
        }        
        if(!f.name.endsWith('.pdf') && f.name.toLowerCase().endsWith('.pdf')) {
            defaultMessage(nameJson.message.mPDFSuffix, 'warning')
            continue
        }
        if(!f.name.endsWith('.dwg') && f.name.toLowerCase().endsWith('.dwg')) {
            defaultMessage(nameJson.message.mDWGSuffix, 'warning')
            continue
        }
        if (f.name.endsWith('.pdf')) {
            if (pdfIndex >= 0) {
                defaultMessage(nameJson.message.mPDFSelected,'warning')
            }else if(uploadPdf) {
                defaultMessage(nameJson.message.mpPDFSelected,"warning")
            }else{
                uploadPdf = true
                ans.push(f)
            }
        }else {
            ans.push(f)
        }
    }

    return ans
}

function addFile(files: readonly any[]) {
    console.log(files);
    
    file.value.push(...files)
    changeFiles(file.value)
}

function removeFile(files: readonly any[]) {
    file.value.splice(file.value.indexOf(files[0]), 1)
    changeFiles(file.value)
}

const emit = defineEmits<{
    (e: 'update:files', value: readonly any[]): void
}>()

function changeFiles(files: readonly any[]) {
    emit('update:files', files)
}

function handleRejected(rejectedEntries: { failedPropValidation: string, file: File }[]) {
    for (const entry of rejectedEntries) {
        if (entry.failedPropValidation === "duplicate") {
            defaultMessage(`Duplicate file: ${entry.file.name}, please resubmit other files`,'warning')
        } else if (entry.failedPropValidation === "accept") {
            defaultMessage(`Incorrect file type, please select ${props.rejectedMessage} files`,'warning')
        }
    }
}

function hasPdf() {
    let ans = -1
    let i = 0
    for (const fileObj of file.value) {
        if (fileObj.name.endsWith('.pdf')) {
            ans = i
        }
        i++
    }

    return ans
}
</script>

<style lang="scss" scoped></style>