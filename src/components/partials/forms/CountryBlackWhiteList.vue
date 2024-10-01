<script setup lang="ts">
import { computed, ref } from 'vue'
import { toArray } from '/@src/utils/helpers'
import { Dictionary, useDictionary } from '/@src/composable/useDictionary'
import VButton from '/@src/components/base/button/VButton.vue'
import Multiselect from '@vueform/multiselect'

export interface CountryBlackWhiteListEmits {
    (e: 'update:modelValue', value: CountryBlackWhiteItemValue | null): void
}

export interface BlackWhiteListItemValue {
    [country: string]: string[]
}

export interface CountryBlackWhiteItemValue {
    [listName: string]: BlackWhiteListItemValue
}

export interface CountryBlackWhiteListProps {
    label?: string
    blackList?: boolean
    whiteList?: boolean
    columnName: string
    modelValue?: CountryBlackWhiteItemValue
    options: Dictionary
    mode?: 'single' | 'multiple' | 'tags'
    readonly?: boolean
    errors?: string[]
}

const emit = defineEmits<CountryBlackWhiteListEmits>()
const props = withDefaults(defineProps<CountryBlackWhiteListProps>(), {
    label: '',
    blackList: true,
    whiteList: true,
    columnName: undefined,
    modelValue: undefined,
    mode: 'single',
    readonly: false,
    errors: undefined,
})

const columns = ['Country', props.columnName, 'Action']
const lists: Record<string, string> = {
    blacklist: 'Black List',
    whitelist: 'White List',
}

const modelValue = computed<CountryBlackWhiteItemValue>(() => {
    const result = Object.assign({}, props.modelValue ?? {}) as CountryBlackWhiteItemValue
    for (const key in lists) {
        if (!result[key]) {
            result[key] = {}
        }
    }
    return result
})

const dictionaries = useDictionary()
const countries = dictionaries.load({ dictionary: 'countries' })
const dictionary = dictionaries.load(props.options)
const options = computed(() => {
    if (props.mode == 'tags') {
        return toArray(props.modelValue).map((x: string) => {
            return { label: x, value: x }
        })
    }
    return dictionary.options
})

const countryUpdate = ref(1000)
const onChangeCountry = function (listKey: string, country: string | number, value: string) {
    for (const key in lists) {
        if (modelValue.value[key][value]) {
            alert('You already have this country: ' + countries.map[value])
            countryUpdate.value++
            return
        }
    }
    const list = modelValue.value[listKey]
    modelValue.value[listKey] = Object.assign({}, ...Object.keys(list).map((c) => ({ [c == country ? value : c]: list[c] }))) // Preserve keys order
    emit('update:modelValue', modelValue.value)
}
const onChangeValue = function (listKey: string, country: string | number, values: string[]) {
    modelValue.value[listKey][country] = values
    emit('update:modelValue', modelValue.value)
}
const onRemoveRow = function (listKey: string, country: string | number) {
    const empty = !country && modelValue.value[listKey][country].length == 0
    if (empty || confirm('Are you sure you want to delete this record?')) {
        delete modelValue.value[listKey][country]
        emit('update:modelValue', modelValue.value)
    }
}
const onAddRow = function (listKey: string) {
    if (!modelValue.value[listKey]['']) {
        modelValue.value[listKey][''] = []
        emit('update:modelValue', modelValue.value)
    }
}
</script>

<template>
    <VField class="country-black-white-list column is-12">
        <label>{{ props.label }}</label>
        <VControl :has-error="!!errors">
            <div class="dataTable-wrapper">
                <div class="dataTable-container">
                    <div v-for="(listName, listKey) in lists" :key="listKey">
                        <h4 class="title">{{ listName }}</h4>
                        <table class="dataTable-table table">
                            <thead>
                                <tr>
                                    <th v-for="(column, key) in columns" :key="key" scope="col">
                                        {{ column }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(values, country) in modelValue[listKey] ?? []" :key="country">
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
                                            @update:model-value="(value: any) => onChangeCountry(listKey, country, value)"
                                        />
                                    </td>
                                    <td>
                                        <Multiselect
                                            :model-value="values"
                                            :loading="dictionary.isLoading"
                                            :options="options"
                                            :disabled="props.readonly"
                                            :searchable="true"
                                            :allow-empty="true"
                                            :mode="props.mode == 'single' ? 'single' : 'tags'"
                                            :create-tag="props.mode == 'tags'"
                                            :placeholder="props.mode == 'single' ? 'Select Some Option' : 'Select Some Options'"
                                            :no-options-text="props.mode == 'tags' ? '' : 'The list is empty'"
                                            :no-results-text="props.mode == 'tags' ? '' : 'No results found'"
                                            @update:model-value="(value: any) => onChangeValue(listKey, country, value)"
                                        />
                                    </td>
                                    <td>
                                        <VButton :light="true" :rounded="false" icon="feather:trash-2" @click="() => onRemoveRow(listKey, country)"></VButton>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="width: 100%"></td>
                                    <td>
                                        <VButton :light="true" :rounded="false" icon="feather:plus" @click="() => onAddRow(listKey)"></VButton>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            <span v-if="!!errors" class="help-text">
                <span v-for="error in props.errors" :key="error" class="error">{{ error }}</span>
            </span>
        </VControl>
    </VField>
</template>

<style scoped lang="scss">
.country-black-white-list {
    &.column {
        .dataTable-table {
            &.table {
                width: 100%;

                input {
                    border: 0;
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
