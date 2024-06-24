<template>
    <SearchPageTableFrame :handle-page-change="pageChange" :totalNum="totalNum" :page-size="pageSize"
        v-model:current-page="currentPage">
        <template v-slot:top>
            <el-card shadow="always" class="select-form">
                <el-row align="top">
                    <el-col :span="10">
                        <UploaderComponent :label="nameJson.page.search.selectImage" rejected-message="an image"
                            ref="imageUploader" upload-style="max-width: 540px; width: 100%; height: 231px;"
                            accept-type=".svg,.jpg,.png,.jpeg,.bmp" />
                    </el-col>
                    <el-col :span="7" :offset="2" style="margin-top: 5px; height: 227px;">
                        <p class="select-title" style="font-size:larger; font-weight: 600; margin-top: -1.6%;">{{ nameJson.page.search.setAIQuery }}</p>
                        <el-form label-position="right" style="margin-top: 3%;">
                            <SelectInputComponent labal-width="126px" v-model="selectType" :label="nameJson.model.type"
                                :selections="typeSelection" />
                            <SelectInputComponent labal-width="126px" v-model="selectThickness"
                                :label="nameJson.model.thickness" :selections="thicknessSelection" />
                            <SelectInputComponent labal-width="126px" v-model="selectDesign"
                                :label="nameJson.model.LFDesign" :selections="designSelection" />
                            <SelectInputComponent labal-width="126px" v-model="pageSize" 
                                :label="nameJson.page.search.colNumber" :selections="imageNumber" />
                        </el-form>
                    </el-col>
                    <el-col :span="3" :offset="1"
                        style="justify-content: center; height: 231px; display: flex;flex-direction: column;align-content: center;flex-wrap: wrap;">
                        <el-switch
                            v-model="withDwg"
                            style="margin-bottom: 26px;"
                            :active-text="withDwg?nameJson.page.search.withDwg:nameJson.page.search.withoutDwg"
                        />
                        <el-button style="font-size: 1.1rem;width: 100%; max-width: 150px" type="primary" :icon="Search" ref="searchButton"
                            @click="handleModelSearch" size="large" autofocus>{{ nameJson.aiSearch }} </el-button>
                    </el-col>
                </el-row>
            </el-card>
        </template>
        <template v-slot:default>
            <!-- Default loading is better than the customize one, but they like the customize loading -->
            <!-- <CardDisplayComponent :column-number="colNumber" :loading="searchLoading" :row-number="rowNumber"> -->
            <CardDisplayComponent :column-number="colNumber"  :row-number="rowNumber">
                    <div v-for="result, index in pageResult" :key="index">
                        <ImageCardComponent :image="result.image[0]" :preview-src-list="result.image" :could-preview="true"
                            :throttle="0">
                                <div class="bottom">
                                    <el-tooltip effect="light" placement="top" :hide-after="20">
                                        <template #content>
                                            {{ nameJson.model.author }}: {{ result.designer }}<br />
                                            <!-- {{ nameJson.model.designDate }}: {{ result.designDate }}<br /> -->
                                            {{ nameJson.model.npppNo }}: {{ result.npppNo }}<br />
                                            {{ nameJson.model.artworkNo }}: {{ result.artworkNo }}<br />
                                            {{ nameJson.model.drawingNo }}: {{ result.drawingNo }}<br />
                                        </template>
                                        <div style="cursor: pointer;">
                                            <el-text style="font-size: 0.9rem;" truncated>{{ shortedStr(result.dopname, 28) }} </el-text>
                                            <div style="height: 4px;"></div>
                                            <div class="label">Similarity = {{ result.label[0] }}</div>
                                        </div>
                                    </el-tooltip>
                                    <el-button class="download-button" type="primary" :icon="Download"
                                            @click="downloadModel(result.id)" circle></el-button>
                                </div>
                             
                        </ImageCardComponent>
                    </div>
            </CardDisplayComponent>
            <SearchLoading loading-text="AI SEARCH" v-if="searchLoading"></SearchLoading>
        </template>
    </SearchPageTableFrame>
</template>

<script setup lang="ts">
import nameJson from '@/assets/json/name.json'
import { imageNumber, useSelections } from "@/common/global/selection";
import { Search, Download } from '@element-plus/icons-vue';
import { computed, ref, type Ref,onUnmounted, watch} from 'vue';
import SearchPageTableFrame from '@/components/frame/SearchPageTableFrame.vue';
import SelectInputComponent from '@/components/SelectInputComponent.vue';
import ImageCardComponent from '@/components/ImageCardComponent.vue';
import CardDisplayComponent from '@/components/CardDisplayComponent.vue';
import UploaderComponent from '@/components/ImageUploadComponent.vue';
import SearchLoading from '@/components/SearchLoading.vue'
import type { ModelSearchResult } from '@/common/type';
import { defaultMessage, defaultMessageBox } from "@/common/util/index";
import { download, searchModel, resizePicture, shortedStr } from '@/common/api/modelApi';
import { server } from '@/common/config';
import { enterDownStore } from '@/stores/index'
import { storeToRefs } from "pinia"

const enterDown = enterDownStore()
const { visiable } = storeToRefs(enterDown)
watch(visiable, (newValue, oldValue)=>{
    // console.log("visiable的值发生变化了", newValue)
    if(newValue){
        window.removeEventListener("keydown", handleEnterDown)
    }else{
        window.addEventListener("keydown", handleEnterDown);
    }
},{immediate:true})

const { thicknessSelection, typeSelection, designSelection } = useSelections()

const totalNum = ref(1)
const pageSize = ref(8)
const currentPage = ref(1)
const searchLoading = ref(false)
const selectThickness = ref(1)
const selectType = ref(1)
const selectDesign = ref(1)
const withDwg = ref(true)
const imageUploader = ref<InstanceType<typeof UploaderComponent> | null>(null)
const searchButton = ref(null)
const getPictureInfo = () => imageUploader.value!.getPictureInfo()
const hasEdit = computed(() => {
    return imageUploader.value?.hasEdit
})
const files = computed(() => imageUploader.value?.file)
const searchResult: Ref<ModelSearchResult[]> = ref([])
const colNumber = computed(() => pageSize.value == 8 ? 4 : 3)
const rowNumber = computed(() => pageSize.value == 8 ? 2 : 1)
const pageResult = computed(() => {
    let start = (currentPage.value - 1) * pageSize.value
    let end = start + pageSize.value > totalNum.value ? totalNum.value : start + pageSize.value
    return searchResult.value.slice(start, end);
})

function pageChange(_index: number) {
    _index
}

async function handleModelSearch() {
    if (!files.value || files.value.length == 0) {
        defaultMessage(nameJson.message.noImage, 'error')
        return
    }

    if (!hasEdit.value) {
        defaultMessageBox(nameJson.message.noCrop, 'warning', search)
        return
    } else {
        search()
    }
}

function search() {
    searchLoading.value = true
    searchResult.value = []
    totalNum.value = searchResult.value.length
    const { name, file } = getPictureInfo()
    console.log(name);

    searchModel({
        file,
        name,
        design: selectDesign.value,
        type: selectType.value,
        thickness: selectThickness.value,
        withDwg: withDwg.value
    }, currentPage.value, pageSize.value).then(async (res: any[]) => {
        if (res.length==0){
            defaultMessage(nameJson.message.noResult, 'info')
            searchLoading.value = false
        }else{
            searchResult.value = []
            for (let i = 0; i < res.length; i++) {
                const dataStrArray = [];
                for (let j = 0; j < res[i].image.length; j++) {
                    dataStrArray.push(await resizePicture(`${server}${res[i].image[j]}`))
                }
                searchResult.value.push({
                    id: res[i].id,
                    image: dataStrArray,
                    dopname: res[i].dwgnames,
                    label: res[i].label,
                    designer: res[i].designer_name,
                    designDate: res[i].design_date,
                    npppNo: res[i].nppp_no,
                    artworkNo: res[i].artwork_no,
                    drawingNo: res[i].drawing_no,
                })
            }
            totalNum.value = searchResult.value.length
            searchLoading.value = false
            if (searchResult.value.length == 0) {
                defaultMessage(nameJson.message.noResult, 'info')
            }
        }
    })
}

function downloadModel(model_id: number | string) {
    download(model_id).then((res) => {
        console.log("DWG and PDF files are download: "+res);
    })  
}

function handleEnterDown(ev: KeyboardEvent){
    if(ev.key === "Enter"){
        const button:any = searchButton.value;
        if(button){
            button.$el.click()
        }
        if (!hasEdit.value) {
            defaultMessageBox(nameJson.message.noCrop, 'warning')
        } 
    }
}

onUnmounted(()=> window.removeEventListener("keydown", handleEnterDown));

</script>

<style lang="scss" scoped>
.select-form {
    width: 100%;
    --el-card-padding: 5px;
}

.bottom {
    padding: 5px;
    line-height: 16px;
    background-color: #bec2bc26;
    position: relative;
    display: flex;
    flex-direction: column;
    align-content: center;
}

.label {
    font-size: 0.8rem;
    color: rgb(65, 158, 254);
}

.download-button {
    position: absolute;
    bottom: 5px;
    right: 5px;
}
</style>