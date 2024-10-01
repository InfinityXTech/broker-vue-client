<script setup lang="ts">
import { provide, reactive, ref, onUnmounted } from 'vue'
import { SelectFieldValue } from './SelectField.vue'
import { useApi } from '/@src/composable/useApi'
import { LayoutSize } from '/@src/utils/layout-size'

export interface ApiVendorSettingsEmits {
    (e: 'update:modelValue', value: SelectFieldValue): void
}
export interface ApiVendorSettingsProps {
    label?: string
    layout?: LayoutSize
    modelValue?: SelectFieldValue
    errors?: string[]

    data: any
}

const emit = defineEmits<ApiVendorSettingsEmits>()
const props = withDefaults(defineProps<ApiVendorSettingsProps>(), {
    label: '',
    layout: '12',
    modelValue: undefined,
    errors: undefined,
})

const api = useApi()
const isLoading = ref(false)
let integrations = reactive<Record<string, any>>({})

provide('api_vendor_settings', async () => {
    isLoading.value = true
    const { data } = await api.get('/dictionary', { params: { dictionaries: 'integrations' } })
    isLoading.value = false
    return data.integrations.map((item: any) => {
        const asArray = Object.entries(item)
        const filtered = asArray.filter((x) => x[0].indexOf('p') == 0)
        const params: any = Object.assign({}, Object.fromEntries(filtered))
        integrations[item.key] = params
        return { value: item.key, label: item.value }
    })
})

onUnmounted(() => {
    integrations = {}
})
</script>

<template>
    <div class="field column" :class="[props.layout && 'is-' + layout]">
        <div class="inv-column">
            <SelectField
                :model-value="props.modelValue"
                :label="props.label"
                :default="false"
                :options="{ custom: 'api_vendor_settings' }"
                @update:model-value="(value) => emit('update:modelValue', value)"
            />
            <!-- eslint-disable-next-line vue/no-mutating-props -->
            <InputField v-for="(title, param) in integrations[props.modelValue]" :key="param" v-model="props.data[param]" :label="title" />
        </div>
    </div>
</template>