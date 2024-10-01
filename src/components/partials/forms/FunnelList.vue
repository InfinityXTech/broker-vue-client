<script setup lang="ts">
import { toRefs } from 'vue'
import VButton from '/@src/components/base/button/VButton.vue'

export interface FunnelListEmits {
    (e: 'update:modelValue', value: Array<FunnelItemValue>): void
}

export interface FunnelItemValue {
    from?: string
    to?: string
}

export interface FunnelListProps {
    label: string
    modelValue: Array<FunnelItemValue> | null
    readonly?: boolean
    errors?: string[]
}

const columns = ['From', 'To', 'Action']

const emit = defineEmits<FunnelListEmits>()
const props = withDefaults(defineProps<FunnelListProps>(), {
    label: '',
    modelValue: () => [],
    readonly: false,
    errors: undefined,
})

const { modelValue } = toRefs(props)

// const allData = ref<Array<FunnelItemValue>>(props.modelValue)

const onChangeFrom = function (index: number, value: string) {
    modelValue.value[index].from = value
    emit('update:modelValue', modelValue.value)
}

const onChangeTo = function (index: number, value: string) {
    modelValue.value[index].to = value
    emit('update:modelValue', modelValue.value)
}

const onRemoveRow = function (index: number) {
    if (confirm('Are you sure you want to delete this record?')) {
        if (modelValue.value == undefined) {
            modelValue.value = []
            emit('update:modelValue', [])
            return
        }
        modelValue.value.splice(index, 1)
        emit('update:modelValue', modelValue.value)
    }
}
const onAddRow = function () {
    if (modelValue.value == undefined) {
        modelValue.value = []
    }
    modelValue.value.push({
        from: '',
        to: '',
    })
    emit('update:modelValue', modelValue.value)
}
</script>

<template>
    <VField class="funnel-list column is-12" :class="[props.label?.trim().replace(/ /g, '-').toLowerCase()]">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <div class="dataTable-wrapper">
                <div class="dataTable-container">
                    <table class="dataTable-table table">
                        <thead>
                            <tr>
                                <th v-for="(column, key) in columns" :key="key" scope="col">
                                    {{ column }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, index) in modelValue" :key="index" :row="row">
                                <td>
                                    <input
                                        type="text"
                                        :class="['input', !row.from && 'is-danger']"
                                        :value="row.from"
                                        :required="true"
                                        @input="(ev: any) => onChangeFrom(index, ev.target.value)"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        :class="['input', !row.to && 'is-danger']"
                                        :value="row.to"
                                        :required="true"
                                        @input="(ev: any) => onChangeTo(index, ev.target.value)"
                                    />
                                </td>
                                <td>
                                    <VButton :light="true" :rounded="false" elevated icon="feather:trash-2" @click="onRemoveRow(index)"> </VButton>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="width: 100%"></td>
                                <td>
                                    <VButton :light="true" :rounded="false" elevated icon="feather:plus" @click="onAddRow"> </VButton>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
.funnel-list {
    &.column {
        .dataTable-table.table {
            width: 100%;
        }

        .dataTable-table.table input {
            border: 0;
        }

        .dataTable-container button {
            text-align: center;
            // padding: 10px 10px 10px 20px;
            padding: 0;
            width: 38px;
            height: 38px;
        }
    }
}

.control.has-validation.has-error input.is-danger {
    border: 1px solid red;
}
</style>
