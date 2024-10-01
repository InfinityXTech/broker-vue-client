<script setup lang="ts">
import { h, provide, ref, onUnmounted } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink } from 'vue-router'
import { useNotyf } from '/@src/composable/useNotyf'
import VButton from '/@src/components/base/button/VButton.vue'
import Scheme from '/@src/schemes/planning/planningForm.json'
import SchemeList from '/@src/schemes/planning/planningList.json'
//import PageToolbar from '/@src/components/partials/PageToolbar.vue'
import PageToolbarButtonDown from '/@src/components/partials/PageToolbarButtonDown.vue'
//import HtmlField from '/@src/components/partials/forms/HtmlField.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import { DatatableColumn } from '/@src/components/partials/tables/Datatable.vue'
import { useApi } from '/@src/composable/useApi'
import { AxiosResponse } from 'axios'

const api = useApi()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(SchemeList.title)

const dataValue = ref([])
const showModal = ref(false)

const initial = {
    regulated: 'all',
}

const onStored = (data: any) => {
    //console.log(data)
    dataValue.value = data
    //notif.success('Updated Successfully')
}
/*
const onFetched  = (data: any) => {
    console.log( data,'short list')
}*/

const custom = {
    BrokerName() {
        return (value: string, row: any) => {
            return h(RouterLink, { to: { name: 'brokers-id', params: { id: row.broker._id } } }, () => value)
        }
    },
    renderBTNModal() {
        return (value: string, row: any, column: DatatableColumn, index: number) => {
            if (!value || !value.length) return ''

            return h(
                VButton,
                {
                    icon: 'far fa-edit',
                    onClick: () =>
                        //showModal.value  =  true
                        //console.log(value,row, column),
                        custom.makeHTMLforModal(column.label, value),
                },
                () => 'Show ' + column.label
            )
        }
    },
    titleModal: ref(''),
    ModalHTML: ref(''),
    makeHTMLforModal(label: any, value: any) {
        let html = ''
        if (label == 'Geos') {
            for (var i = 0; i < value.length; i++) {
                html +=
                    '<div>' +
                    value[i].country.title +
                    (value[i].language && value[i].language.code != '' ? '(' + value[i].language.code.toUpperCase() + ')' : '') +
                    '- $' +
                    value[i].payout +
                    '</div>'
            }
        }

        if (label == 'Desk') {
            //html += value
            for (var i = 0; i < value.length; i++) {
                html += value[i].language.title
                if (value.length - 1 > i) html += ', '
            }
        }
        if (label == 'Restricted Traffic') {
            //html += value
            for (var i = 0; i < value.length; i++) {
                html += value[i].title
                if (value.length - 1 > i) html += ', '
            }
        }

        if (label == 'Regulations') {
            html += `<div class="dataTable-wrapper"><div class="dataTable-container"><table class="dataTable-table table">
                <thead >
                    <tr>
                        <th scope="col">Integration Name</th>
                        <th scope="col">Regulated</th>
                        <th scope="col">Countries</th>
                        <th scope="col">Languages</th>
                    </tr>
                </thead>
                <tbody>`
            for (var i = 0; i < value.length; i++) {
                html += '<tr>'
                html += '<td>' + value[i].integration.name + '</td>'
                html += '<td>' + (value[i].regulated ? 'YES' : 'NO') + '</td>'
                html += '<td>' + value[i].countries.toString().toUpperCase() + '</td>'
                html += '<td>' + value[i].languages + '</td>'
                html += '</tr>'
            }
            html += `</tbody>
            </table></div></div>`
        }

        if (label == 'CRG Deals') {
            html += `<div class="dataTable-wrapper"><div class="dataTable-container"><table class="dataTable-table table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Type</th>
                        <th scope="col">Countries</th>
                        <th scope="col">Languages</th>
                        <th scope="col">Min CRG</th>
                        <th scope="col">Endpoint</th>
                        <th scope="col">Ignored Endpoints</th>
                    </tr>
                </thead>
                <tbody>`

            for (var i = 0; i < value.length; i++) {
                html += '<tr>'
                html += '<td>' + value[i].broker_crg.name + '</td>'
                html += '<td>' + value[i].broker_crg_type.title + '</td>'
                html += '<td>' + value[i].countries.toString().toUpperCase() + '</td>'
                html += '<td>' + value[i].languages + '</td>'
                html += '<td>' + value[i].min_crg + '</td>'

                let endpoints = []
                for (var e = 0; e < value[i].endpoints.length; e++) {
                    endpoints.push(value[i].endpoints[e].title)
                }
                html += '<td>' + endpoints + '</td>'

                let ignore_endpoints = []
                for (var e = 0; e < value[i].ignore_endpoints.length; e++) {
                    ignore_endpoints.push(value[i].ignore_endpoints[e].title)
                }
                html += '<td>' + ignore_endpoints + '</td>'
                html += '</tr>'
            }
            html += `</tbody>
            </table></div></div>`
        }

        //console.log(html)
        custom.ModalHTML.value = html

        //VModal.title.value = label
        custom.titleModal.value = label

        showModal.value = true
    },
}

const promiseCountriesAndLanguages = api.get('/planning/countries_and_languages')
const promiseCountries = promiseCountriesAndLanguages.then((response: AxiosResponse<any>) => response.data.countries)
const promiseLanguages = promiseCountriesAndLanguages.then((response: AxiosResponse<any>) => response.data.languages)

provide('custom_countries', () => promiseCountries)
provide('custom_languages', () => promiseLanguages)

onUnmounted(() => {
    dataValue.value = []
})
</script>

<template>
    <ApiForm
        title=""
        :wrapper="PageToolbarButtonDown"
        :scheme="Scheme"
        :fetch-data="initial"
        store-label="Search"
        store-method="post"
        :store-data="'/planning'"
        @store-data="onStored"
    />
    <br />
    <Datatable :columns="SchemeList.columns" :model-value="dataValue" :custom="custom" />

    <VModal :open="showModal" :title="custom.titleModal.value" size="big" cancel-label="Close" actions="right" @close="showModal = false">
        <template #content>
            <div v-html="custom.ModalHTML.value"></div>
        </template>
    </VModal>
</template>