<template>
    <el-skeleton :loading="loading" animated :throttle="throttle">
        <template #template>
            <div class="display-Container">
                <div class="skeleton" v-for="i in columnNumber * rowNumber" :key="i">                    
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
                </div>
            </div>
        </template>
        <template #default>
            <div class="display-Container">
                <slot></slot>
            </div>
        </template>
    </el-skeleton>
</template>

<script setup lang="ts">
// import { computed } from 'vue';

//columnNummber 一行多少列
//loading 是否需要加载动画
//rowNumber 加载动画行数
const props = defineProps({
    columnNumber: {
        type: Number,
        default: 4
    },
    loading: {
        type: Boolean,
        default: false
    },
    rowNumber: {
        type: Number,
        default: 2
    },
    throttle: {
        type: Number,
        default: 500
    }
})

// const width = computed(() => `${6 / props.columnNumber}fr`)
</script>

<style lang="scss" scoped>
$colnum: v-bind(columnNumber);
$rownum: v-bind(rowNumber);
// $width: v-bind(width);

.display-Container {
    width: 100%;
    display: grid;
    column-gap: 20px;
    row-gap: 10px;
    grid-template-columns: repeat($colnum, minmax(0, 1fr));
    grid-template-rows: repeat($rownum, minmax(0, 1fr));
}

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
        position: relative;
    }

    .item {
        width: 100%;
        height: 100%;
        position: absolute;
    }
}
</style>