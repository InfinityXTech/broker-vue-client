<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { DatatableColumn, DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import { DateField } from '/@src/components/partials/forms/DateField.vue'
import { RouterLink } from 'vue-router'
import { useDictionary } from '/@src/composable/useDictionary'
import { SelectOption } from '/@src/composable/useDictionary'
import SchemeSearch from '/@src/schemes/marketing_suite/marketingSuiteSearch.json'
import SchemeList from '/@src/schemes/marketing_suite/marketingSuiteList.json'
import SchemeNew from '/@src/schemes/marketing_suite/marketingSuiteNew.json'
import ThinPage from '/@src/components/partials/ThinPage.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

export interface MarketingSuiteProps {
    id: string
}

const props = defineProps<MarketingSuiteProps>()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const userSession = useUserSession()
const perm = userSession.permissions('traffic_endpoint')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('marketing_suite')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('marketing_suite')
const is_access_market_suit_dashboard_links = perm.is_allow('all', 'add') && perm.is_custom_allow('market_suit_dashboard_links')

const custom = {
    Token() {
        return (value: string, row: any) => {
            return [
                row.private
                    ? h('i', {
                          'aria-hidden': true,
                          class: 'iconify',
                          'data-icon': 'feather:lock',
                      })
                    : h('span'),
                h(RouterLink, { to: { name: 'marketing_suite-id', params: { id: row._id } } }, () => value),
                h('br'),
                h('small', row._id),
            ]
        }
    },
    Name() {
        return (value: string) => {
            return value
        }
    },
    Languages() {
        return (value: string[], row: any) => {
            if (is_access_market_suit_dashboard_links && row.tracking_links) {
                let items = []
                items.push(h('br'))
                for (let i = 0; i < row.tracking_links.length; i++) {
                    const link = row.tracking_links[i]
                    let url = link.url
                    if (endpointId.value) {
                        const v = dictionary.options.find((x: any) => x.value == endpointId.value)
                        url = link.url.replace('tp_point=', 'tp_point=' + v.label)
                    }
                    if (i > 0) {
                        items.push(h('span', { innerHTML: ', ' }))
                    }
                    items.push(h('a', { href: url, target: '_blank', innerHTML: link.language }))
                }
                return items
            }
            return value && value.length > 0 ? value.join(', ') : ''
        }
    },
}

const initial = {}

const create = ref(false)
const datatable = ref<DatatableMethods>()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()

const endpointId = ref<boolean | string>(false)
const dictionary = useDictionary().load({ dictionary: 'traffic_endpoints' })
// if (is_access_market_suit_dashboard_links) {
// dictionary.load({ dictionary: 'traffic_endpoints' })
// }

const onSelectTrafficEndpoint = (value: any) => {
    endpointId.value = value.toString()
    datatable.value?.fetchData()
}
</script>

<template>
    <DatatableSearch
        :config="SchemeSearch"
        :data="searchData"
        _:layout="is_access_market_suit_dashboard_links ? '7' : '6'"
        @changed="(value) => (searchFunc = value)"
    >
        <div v-if="is_access_market_suit_dashboard_links" class="wraper_market_suit_dashboard_multiselect">
            <label>Traffic Endpoint</label>
            <Multiselect
                :model-value="endpointId"
                :loading="dictionary.isLoading"
                :options="dictionary.options"
                :searchable="true"
                :placeholder="''"
                @update:model-value="onSelectTrafficEndpoint"
            />
        </div>

        <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create = true"> Add Offer </VButton>
    </DatatableSearch>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/marketing_suite/all`"
        :custom="custom"
        :show-only-screen-data="true"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        size="big"
        title="Add Offer"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/marketing_suite/create`"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />
</template>

<style lang="scss">
.wraper_market_suit_dashboard_multiselect {
    width: 120px;
    margin-right: 20px;

    .multiselect {
        min-width: 60px !important;
    }
}
</style> 