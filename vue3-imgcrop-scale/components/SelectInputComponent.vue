<template>
    <el-form-item :label="label" :label-width="labalWidth" :style="{ 'margin-bottom': marginBottom }">
        <el-select v-model="value" :placeholder="nameJson.selectPlaceholder" :style="{ 'width': width }"
            :clearable="clearable" :filterable="filterable">
            <el-option v-for=" item  in  selections " :key="item.value" :label="item.label" :value="item.value">
            </el-option>
        </el-select>
    </el-form-item>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import nameJson from '@/assets/json/name.json'

const props = defineProps({
    label: {
        type: String,
        default: ''
    },
    modelValue: {
        type: [Number, String],
        required: true
    },
    selections: {
        type: Array<{
            value: Number,
            label: String
        }>,
        required: true
    },
    marginBottom: {
        type: String,
        default: '22px'
    },
    width: {
        type: String,
        default: '90%'
    },
    labalWidth: {
        type: String,
        default: '105px'
    },
    clearable: {
        type: Boolean,
        default: false
    },
    filterable: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

</script>

<style scoped></style>