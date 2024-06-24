<template>
    <el-collapse style="width: 100%; margin-top: 8px;" v-if="hasHistory">
        <el-collapse-item title="0000">
            <template #title>
                <span style="font-weight: 600; font-size: 1rem;">{{ nameJson.components.uploadStatus.history}}</span>
            </template>            
            <el-descriptions class="border-container" :column="3" border>
                <template #extra v-if="couldPreviewImg">
                    <el-button type="primary" @click="showImageViewer = true" :disabled="state != 200">
                        <el-icon size="23">
                            <Picture />
                        </el-icon>
                        <span>{{ nameJson.components.uploadStatus.checkPicture }}</span></el-button>
                </template>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Memo />
                            </el-icon>
                            {{ nameJson.model.pdfName }}
                        </div>
                    </template>
                    <el-popover placement="top"  width="auto" trigger="hover">
                        <template #reference>
                            <el-text :type="pdfInfo.localSize === pdfInfo.uploadSize ? 'success' : 'danger'">{{
                                data.pdf_name
                            }}</el-text>
                        </template>
                        <el-row>{{ nameJson.components.uploadStatus.localName }}: {{ pdfInfo.loaclName }}</el-row>
                        <el-row>{{ nameJson.components.uploadStatus.localSize }}: {{ pdfInfo.localSize }} Bytes</el-row>
                        <el-row>{{ nameJson.components.uploadStatus.serverSize }}: {{ pdfInfo.uploadSize }} Bytes</el-row>
                    </el-popover>
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Postcard />
                            </el-icon>
                            {{ nameJson.model.type }}
                        </div>
                    </template>
                    <el-text size="small">{{ getChiptype(data.type) }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Guide />
                            </el-icon>
                            {{ nameJson.model.id }}
                        </div>
                    </template>
                    {{ data.model_id }}
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Files />
                            </el-icon>
                            {{ nameJson.model.dwgName }}
                        </div>
                    </template>
                    <el-space spacer=",">
                        <el-popover placement="bottom" width="auto" trigger="hover" v-for="item, index in dwgInfoList"
                            :key="index">
                            <template #reference>
                                <el-text :type="item.localSize === item.uploadSize ? 'success' : 'danger'">{{
                                    dwgName[index]
                                }}</el-text>
                            </template>
                            <el-row>{{ nameJson.components.uploadStatus.localName }}: {{ item.localName }}</el-row>
                            <el-row>{{ nameJson.components.uploadStatus.localSize }}: {{ item.localSize }} Bytes</el-row>
                            <el-row>{{ nameJson.components.uploadStatus.serverSize }}: {{ item.uploadSize }} Bytes</el-row>
                        </el-popover>
                    </el-space>
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Crop />
                            </el-icon>
                            {{ nameJson.model.thickness }}
                        </div>
                    </template>
                    <el-text >{{ getChipthickness(data.thickness) }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Calendar />
                            </el-icon>
                            {{ nameJson.model.designDate }}
                        </div>
                    </template>
                    {{ baseTimeFormat('date', data.design_date) }}
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <OfficeBuilding />
                            </el-icon>
                            {{ nameJson.model.author }}
                        </div>
                    </template>
                    <el-text >{{ getDesigner(data.designer) }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item>
                    <template #label>
                        <div class="cell-item">
                            <el-icon>
                                <Position />
                            </el-icon>
                            {{ nameJson.components.uploadStatus.title }}
                        </div>
                    </template>
                    <el-text :type="state == 200 ? 'success' : 'danger'">{{ message }}</el-text>
                </el-descriptions-item>
            </el-descriptions>
            <el-image-viewer v-if="showImageViewer" :url-list="imgList" hide-on-click-modal teleported
                @close="showImageViewer = false" />
        </el-collapse-item>
    </el-collapse>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import nameJson from '@/assets/json/name.json';
import { getChipthickness, getChiptype, getDesigner } from '@/common/global/selection';
import { uploadStore } from '@/stores/upload';
import { baseTimeFormat } from '@/common/util';

const uploadS = uploadStore()
const hasHistory = computed(() => uploadS.hasHsitory)
const couldPreviewImg = computed(() => uploadS.couldPreviewImg)
const data = computed(() => uploadS.data)
const state = computed(() => uploadS.state)
const message = computed(() => uploadS.message)
const imgList = computed(() => uploadS.imgList)
const pdfInfo = computed(() => uploadS.pdfInfo)
const dwgInfoList = computed(() => uploadS.dwgInfoList)
const dwgName = computed(() => data.value.dwg_name.split(','))

// image-view
const showImageViewer = ref(false)//控制图片预览组件显示
</script>

<style scoped>
.border-container {
    width: 100%;
}

:deep(.el-collapse-item__arrow){
    font-size: 39px;   /* Override the default icon size the el-collapse component */
    font-weight: bold;
    color: #0a89de;
    /* flex: 1 0 auto; */
    /* order: 0; */
}
</style>

