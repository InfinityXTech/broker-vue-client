<script setup lang="ts">
import { Ref, ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { format } from 'date-fns'

const api = useApi()

const datetime_now = ref<boolean>(true)
const datetime = ref(format(new Date(), 'yyyy-MM-dd HH:mm'))
datetime.value = datetime.value.replace(' ', 'T')

const round: Record<string, number> = { btc: 100, usd: 2 }
const values: Record<string, Ref<number>> = { btc: ref(0), usd: ref(0) }

const error = ref<string | null>(null)

const convert = (function CurrencyConverter() {
    let lastCallback: any = null
    let lastUpdate = 0
    let lastRates: any = {}
    // let loading = false

    return {
        run: function (callback: any) {
            const dt = datetime_now.value ? '' : datetime.value
            if (!datetime_now.value || Date.now() - lastUpdate > 5 * 1000) {
                // if (!loading) {
                // loading = true
                error.value = null
                api.post('/dictionary/currency_rates', { datetime: dt }).then((response) => {
                    lastRates = response.data
                    // loading = false
                    lastUpdate = Date.now()

                    const values = Object.values(lastRates)
                    if (lastRates && values.length > 0 && values[0] == 0) {
                        error.value = 'No available data for this date'
                    }

                    lastCallback(lastRates)
                })
                // }
            }
            lastCallback = callback
            callback(lastRates)
        },
    }
})()

const onUpdateDateTime = (value: string | number) => {
    datetime.value = value.toString()
    if (values.btc.value) {
        onUpdate('btc', values.btc.value)
    }
}

const onUpdate = (from_currency: string, text: string | number) => {
    const value = parseFloat(text as string) || 0
    convert.run((rates: any) => {
        // console.log(rates)
        Object.keys(values).forEach((to_currency) => {
            if (from_currency == to_currency) {
                values[to_currency].value = value
            } else if (rates[from_currency + to_currency]) {
                values[to_currency].value = +(value * rates[from_currency + to_currency]).toFixed(round[to_currency])
            } else if (rates[to_currency + from_currency]) {
                values[to_currency].value = +(value / rates[to_currency + from_currency]).toFixed(round[to_currency])
            } else {
                values[to_currency].value = 0
            }
        })
    })
}
</script>

<template>
    <div class="currency-converter">
        <Tippy interactive trigger="click">
            <ToolbarItem icon="fas fa-calculator" title="Currency Converter" />
            <template #content>
                <VField class="column" :class="['is-12', 'cc-field']">
                    <label
                        >Now &nbsp;&nbsp;<input
                            v-model="datetime_now"
                            type="checkbox"
                            class="cc-date-now"
                            @change="(value) => onUpdate('btc', values.btc.value)"
                        />
                    </label>
                </VField>
                <InputField
                    v-if="!datetime_now"
                    :type="'datetime-local'"
                    class="cc-date"
                    :model-value="datetime"
                    @update:model-value="(value) => onUpdateDateTime(value)"
                />
                <InputField class="cc-field" label="Bitcoin" :model-value="values.btc.value" @update:model-value="(value) => onUpdate('btc', value)" />
                <InputField
                    class="cc-field"
                    label="United States Dollar"
                    :model-value="values.usd.value"
                    @update:model-value="(value) => onUpdate('usd', value)"
                />
                <div v-if="error" class="error" style="color: red">{{ error }}</div>
            </template>
        </Tippy>
    </div>
</template>

<style lang="scss">
.currency-converter {
    .cc-field {
        text-align: left;
        padding-top: 0;
        margin: 0 !important;

        .control {
            margin: 0 !important;
        }
    }

    .tippy-content {
        height: 255px;
    }
}
</style>
