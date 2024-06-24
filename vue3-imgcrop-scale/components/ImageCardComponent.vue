<template>
    <el-skeleton class="skeleton" :loading="loading" animated :throttle="throttle">
        <template #template>
            <div class="scale">
                <div class="item">
                    <el-skeleton-item variant="image" style="width: 100%; height: 100%" />
                </div>
            </div>
            <div class="skeleton-bottom-container">
                <el-skeleton-item variant="text" style="width: 50%" />
                <el-skeleton-item variant="button" />
                <el-skeleton-item variant="text" />
            </div>
        </template>
        <template #default>
            <el-card class="card-container" :style="styleObj" :body-style="{ padding: '0' }" shadow="hover"
                @click="clickCard">
                <div class="scale">
                    <div class="item">
                        <el-image class="image-preview" :src="image" lazy fit="contain" :preview-src-list="previewList"></el-image>
                    </div>
                </div>
                <div class="card-bottom">
                    <slot></slot>
                </div>
            </el-card>
        </template>
    </el-skeleton>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

//FUN: 用于显示result views图片的卡片组件

// chooseBorder为真时出现选中效果
// click点击卡片触发的事件
// image显示的图片url或base64地址
// currentPreview是否允许图片预览
// loading是否需要骨架屏

const props = defineProps({
    value: {
        type: Number,
        default: -1
    },
    click: {
        type: Function,
    },
    chooseBorder: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        required: true
    },
    couldPreview: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    throttle: {
        type: Number,
        default: 500
    },
    beChoosed: {
        type: Boolean,
        default: false
    },
    previewSrcList: {
        type: Array as PropType<string[]>,
        default: []
    }
})
const styleObj = computed(() => props.chooseBorder && props.beChoosed ? {
    outline: 'cornflowerblue 4px solid',
    'box-sizing': 'border-box'
} : {})
const previewList = computed(() => props.couldPreview ? (props.previewSrcList.length > 0 ? props.previewSrcList : [props.image]) : [])

function clickCard() {
    if (props.click) props.click(props.value)
}

</script>

<style lang="scss" scoped>
.skeleton {
    .skeleton-bottom-container {
        width: 100%;
        height: 40px;
        display: grid;
        margin: 10px;
        grid-template-rows: 4fr 2fr;
        grid-template-columns: 3fr 3fr;
        justify-items: start;
        align-items: center;

        div:nth-child(2) {
            grid-column-start: 2;
            grid-row-start: 1;
            grid-row-end: 3;
            margin-left: 40%;
            width: 50%;
            height: 70%;
        }
    }
    .scale {
        width: 100%;
        padding-bottom: 70.72%;
        height: 0;
    }

    .item {
        width: 100%;
        height: 100%;
    }

    .card-bottom {
        display: flex;
        justify-content: center;
    }
}

</style>