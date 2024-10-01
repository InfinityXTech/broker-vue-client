<script setup lang="ts">
import { computed, ref } from 'vue'
import { toArray } from '/@src/utils/helpers'
import { Dictionary, useDictionary } from '/@src/composable/useDictionary'
import { InputFieldProps } from '/@src/components/partials/forms/InputField.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import Multiselect from '@vueform/multiselect'

export interface CountryInputPairEmits {
    (e: 'update:modelValue', value: CountryInputPairItemValue | null): void
}

export interface CountryInputPairItemValue {
    [country: string]: string
}

export interface CountryInputPairProps {
    label?: string
    columnName: string
    modelValue?: CountryInputPairItemValue
    mode?: 'single' | 'multiple' | 'tags'
    input?: InputFieldProps
    readonly?: boolean
    errors?: string[]
}

const emit = defineEmits<CountryInputPairEmits>()
const props = withDefaults(defineProps<CountryInputPairProps>(), {
    label: '',
    columnName: undefined,
    modelValue: undefined,
    mode: 'single',
    input: undefined,
    readonly: false,
    errors: undefined,
})

const columns = ['Country', props.columnName, 'Action']

const modelValue = computed<CountryInputPairItemValue>(() => {
    const result = Object.assign({}, props.modelValue ?? {}) as CountryInputPairItemValue
    return result
})

const dictionaries = useDictionary()
const countries = dictionaries.load({ dictionary: 'countries' })

const countryUpdate = ref(1000)
const onChangeCountry = function (country: string | number, value: string) {
    if (modelValue.value[value] != undefined) {
        alert('You already have this country: ' + countries.map[value])
        countryUpdate.value++
        return
    }
    modelValue.value[value] = `${modelValue.value[country] ?? modelValue.value['-']}` // Object.assign({}, ...Object.keys(list).map((c) => ({ [c == country ? value : c]: list[c] }))) // Preserve keys order
    if (modelValue.value[country] != undefined) {
        delete modelValue.value[country]
    }
    if (modelValue.value['-'] != undefined) {
        delete modelValue.value['-']
    }
    emit('update:modelValue', modelValue.value)
}
const onChangeValue = function (country: string | number, value: string) {
    modelValue.value[country] = value
    emit('update:modelValue', modelValue.value)
}
const onRemoveRow = function (country: string | number) {
    const empty = !country && modelValue.value[country].length == 0
    if (empty || confirm('Are you sure you want to delete this record?')) {
        delete modelValue.value[country]
        emit('update:modelValue', modelValue.value)
    }
}
const onAddRow = function () {
    if (!modelValue.value['-']) {
        modelValue.value['-'] = ''
        emit('update:modelValue', modelValue.value)
    }
}
</script>

<template>
    <VField class="country-input-pair column is-12">
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
                            <tr v-for="(input_value, country) in modelValue ?? []" :key="country">
                                <td>
                                    <Multiselect
                                        :key="countryUpdate"
                                        :model-value="country"
                                        :loading="countries.isLoading"
                                        :options="countries.options"
                                        :disabled="props.readonly"
                                        :searchable="true"
                                        :allow-empty="true"
                                        :can-clear="false"
                                        :can-deselect="false"
                                        mode="single"
                                        placeholder="Select Some Option"
                                        no-options-text="The listName is empty"
                                        no-results-text="No results found"
                                        @update:model-value="(value: any) => onChangeCountry(country, value)"
                                    />
                                </td>
                                <td>
                                    <InputField
                                        v-bind="props.input"
                                        :model-value="input_value"
                                        @update:model-value="(value: any) => onChangeValue(country, value)"
                                    />
                                </td>
                                <td>
                                    <VButton :light="true" :rounded="false" icon="feather:trash-2" @click="() => onRemoveRow(country)"></VButton>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="width: 100%"></td>
                                <td>
                                    <VButton :light="true" :rounded="false" icon="feather:plus" @click="() => onAddRow()"></VButton>
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

<style lang="scss">
.country-input-pair {
    &.column {
        .dataTable-table {
            &.table {
                width: 100%;

                .field {
                    .control {
                        width: 100% !important;
                    }

                    input {
                        // border: 0;
                        width: 100% !important;
                    }
                }
            }
        }

        .dataTable-container {
            button {
                text-align: center;
                padding: 0;
                // padding: 7px 7px 7px 17px;
                width: 38px;
                height: 38px;
            }

            .title {
                font-size: 16px;
                text-decoration: underline;
            }
        }
    }
}

.control.has-validation.has-error input.is-danger {
    border: 1px solid red;
}
</style>
