<script setup lang="ts">
import { ref, h } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import SchemeList from '/@src/schemes/admin/logsList.json'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Logs')

const custom = {
    Data() {
        return (value: string) => {
            return h('pre', { innerHTML: value }, () => value)
        }
    },
}

const page = (function () {
    const current = ref<number>(1)
    const total = ref<number>(10)
    const uri = ref<string>('/logs/' + current.value)

    const set = (page: number) => {
        current.value = page
        total.value = page + 10
        uri.value = '/logs/' + current.value
        // datatable.value?.fetchData()
    }

    const pages = () => {
        let numShown = 10 // This sets the number of page tabs
        numShown = Math.min(numShown, total.value)
        let first = current.value - Math.floor(numShown / 2)
        first = Math.max(first, 1)
        first = Math.min(first, total.value - numShown + 1)
        return [...Array(numShown)].map((k, i) => i + first)
    }

    return {
        current,
        total,
        uri,
        set,
        pages,
    }
})()

const datatable = ref<DatatableMethods>()
</script>

<template>
    <Datatable :columns="SchemeList.columns" :uri="page.uri.value" :custom="custom" @init="(value) => (datatable = value)">
        <template #bottom>
            <div class="dataTable-info">Showing {{ (page.current.value - 1) * 10 }} to {{ page.current.value * 10 }} of ? entries</div>
            <nav class="dataTable-pagination">
                <ul class="dataTable-pagination-list">
                    <li
                        v-for="pageNumber in page.pages()"
                        :key="pageNumber"
                        :class="{
                            active: page.current.value === pageNumber,
                            last: pageNumber == page.total.value - 1 && Math.abs(pageNumber - page.current.value) > 3,
                            first: pageNumber == 0 && Math.abs(pageNumber - page.current.value) > 3,
                        }"
                    >
                        <a href="#" data-page="{{pageNumber}}" @click="page.set(pageNumber)">
                            {{ pageNumber }}
                        </a>
                    </li>

                    <!-- <li class=""><a href="#" data-page="6">6</a></li>
                <li class=""><a href="#" data-page="7">7</a></li>
                <li class="ellipsis"><a href="#">…</a></li>
                <li class=""><a href="#" data-page="11">11</a></li>
                <li class="pager"><a href="#" data-page="2">›</a></li> -->
                </ul>
            </nav>
        </template>
    </Datatable>
</template>

<style lang="scss">
pre {
    max-width: 400px;
    text-align: left;
}
.is-dark pre {
    color: white;
}
.dataTable-bottom {
    margin-top: 20px;
}
.dataTable-top > nav:first-child,
.dataTable-top > div:first-child,
.dataTable-bottom > nav:first-child,
.dataTable-bottom > div:first-child {
    float: left;
}
.dataTable-top > nav:last-child,
.dataTable-top > div:last-child,
.dataTable-bottom > nav:last-child,
.dataTable-bottom > div:last-child {
    float: right;
}
.dataTable-pagination li {
    list-style: none;
    float: left;
}
.dataTable-wrapper .dataTable-bottom .dataTable-pagination li.active a {
    background: var(--primary);
    box-shadow: var(--primary-box-shadow);
    color: var(--primary--color-invert);
}
</style>