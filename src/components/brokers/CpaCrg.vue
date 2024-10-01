<script setup lang="ts">
import { ref, computed } from 'vue'
// import { SelectOption, useDictionary } from '/@src/composable/useDictionary'

export interface CpaCrgProps {
    data: any
    countryCode: string
    languageCodes: any[]
    sign: string
}

const props = defineProps<CpaCrgProps>()
const amounts = ref<string[]>([])

// const dictionary_traffic_endpoints = useDictionary().load({ dictionary: 'traffic_endpoints' })

const payouts_crg = computed<string>(() => {
    const li: string[] = []
    const get_language = (country_language: string): string => {
        const p = country_language?.split('_')
        return p && p.length > 1 ? p[1] : 'general'
    }
    for (const amount in props.data) {
        const _amount: string = (props.sign == '$' ? props.sign : '') + amount + (props.sign == '%' ? props.sign : '')

        const items = props.data[amount].filter((f: any) => {
            const location = f?.country_language?.split('_')
            const country = (location.length > 0 ? location[0] : '').trim()
            const language = (location.length > 1 ? location[1] : '').trim()
            return country == props.countryCode && (language.length == 0 || props.languageCodes.some((x: any) => x.code == language))
        })

        const languages = items.filter((c: any) => (c.endpoint ?? []).length == 0).map((x: any) => get_language(x?.country_language))
        const language_endpoints = items
            .filter((c: any) => {
                return (
                    (c.endpoint ?? []).length > 0 &&
                    (c.country_language.length == 0 ||
                        props.languageCodes.some((x: any) => x.code.replace('general', '') == get_language(c.country_language).replace('general', '')))
                )
            })
            .map((x: any) => {
                return { endpoint: x.endpoint, country_language: x.country_language }
            })
        if (languages.length > 0) {
            amounts.value.push(_amount)
            li.push(_amount + ': ' + languages.join(', '))
        }
        if (language_endpoints.length > 0) {
            language_endpoints.forEach((endpoints: any) => {
                // const _endpoint = computed(() => dictionary_traffic_endpoints.options.filter((opt: SelectOption) => opt.value == endpoints?.endpoint)) as any
                amounts.value.push(_amount)
                li.push(
                    'Traffic: Endpoint "' +
                        (endpoints.endpoint.length > 0 ? endpoints.endpoint[0].token : endpoints?.endpoint) +
                        '"' +
                        ': ' +
                        _amount +
                        ': ' +
                        get_language(endpoints?.country_language)
                )
            })
        }
    }

    let s = ''
    if (li.length > 0) {
        s =
            '<ul>' +
            li.reduce((previousValue: string, currentValue: string) => {
                return previousValue + '<li>' + currentValue + '</li>'
            }) +
            '</ul>'
    }
    return s
})

const distinct_amounts = computed<string>(() => {
    return [...new Set(amounts.value)].join(', ')
})
// const is_amounts = computed<boolean>(() => amounts.value.length > 0)
</script>

<template>
    <span class="cpa-crg-container">
        <Tippy interactive>
            <!-- <div class="p-0 column cpa-crg-popover-icon">{{ is_amounts ? '&darr;' : '' }}</div> -->
            {{ distinct_amounts }}
            <template #content>
                <span class="cpa-crg-popover" v-html="payouts_crg"></span>
            </template>
        </Tippy>
    </span>
</template>

<style lang="scss">
.cpa-crg-container {
    max-width: 255px;
}

.cpa-crg-popover-icon {
    text-align: center;
    position: relative;
    border-radius: 12px;
    width: 24px;
    margin-right: 10px;
    line-height: 24px;
    margin-left: 5px;
    background: var(--background-grey);
    overflow: hidden;

    &.filled {
        background: var(--danger) !important;
        color: var(--white);
    }
}

.cpa-crg-popover {
    padding: 1rem 0.5rem;
    width: 255px;

    .column {
        padding-top: 3px;
        padding-bottom: 3px;
    }
}

.is-dark {
    .cpa-crg-popover-icon {
        background: var(--dark-sidebar);
    }

    .cpa-crg-popover {
        .cap-progress {
            background: var(--dark-sidebar-light-6);
        }
    }
}
</style>