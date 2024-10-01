<script setup lang="ts">
import { computed, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import Scheme from '/@src/schemes/admin/userPermissionEdit.json'
import ThinPage from '/@src/components/partials/ThinPageFullWidth.vue'
import { isArray, hasOwn } from '@vue/shared'
import { useUserSession } from '/@src/stores/userSession'

export interface UserPermissionProps {
    id: string
}
const props = defineProps<UserPermissionProps>()
const notif = useNotyf()
const viewWrapper = useViewWrapper()
const userSession = useUserSession()

const isLoading = ref(true)
const isChanged = ref(false)
const data = ref({})
const formEvents = ref()
const active = ref('Brokers')

const access_by_features = (scheme_content: any) => {
    if (scheme_content && isArray(scheme_content)) {
        for (let i = 0; i < scheme_content?.length; i++) {
            // array
            if (scheme_content[i] && isArray(scheme_content[i]) && scheme_content[i].length > 0) {
                access_by_features(scheme_content[i])
            }
            // public_features
            else if (
                hasOwn(scheme_content[i], 'public_features') &&
                scheme_content[i].public_features &&
                isArray(scheme_content[i].public_features) &&
                scheme_content[i].public_features.length > 0
            ) {
                if (!userSession.features().is_public(...scheme_content[i].public_features)) {
                    scheme_content.splice(i, 1)
                    access_by_features(scheme_content)
                    return
                }
            }
            // private_features
            else if (
                hasOwn(scheme_content[i], 'private_features') &&
                scheme_content[i].private_features &&
                isArray(scheme_content[i].private_features) &&
                scheme_content[i].private_features.length > 0
            ) {
                if (!userSession.features().is_private(...scheme_content[i].private_features)) {
                    scheme_content.splice(i, 1)
                    access_by_features(scheme_content)
                    return
                }
            }
            // obsolete
            else if (hasOwn(scheme_content[i], 'obsolete') && scheme_content[i].obsolete === true) {
                scheme_content.splice(i, 1)
                access_by_features(scheme_content)
                return
            }

            // children
            if (
                hasOwn(scheme_content[i], 'children') &&
                scheme_content[i].children &&
                isArray(scheme_content[i].children) &&
                scheme_content[i].children.length > 0
            ) {
                access_by_features(scheme_content[i].children)
            }
        }
    }
}
access_by_features(Scheme.content)

const toggle = (value: any) => {
    isChanged.value = false
    active.value = value
    setTimeout(() => (isChanged.value = true), 600)
    // formEvents.value?.fetchData()
}
// const tabScheme = computed(() => {
//     const parts = Scheme.content.find((item) => item.props.label == active.value)
//     return {
//         type: 'Form',
//         content: [parts],
//     }
// })
const tabScheme = (tabLabel: string) => {
    const parts = Scheme.content.find((item) => item.props.label == tabLabel)
    return {
        type: 'Form',
        content: [parts],
    }
}

const tabData = async () => data.value

const api = useApi()
const onFetched = () => {
    api.get(`/user/${props.id}/permissions`).then((response) => {
        data.value = response.data
        viewWrapper.setPageTitle('User permissions: ' + response.data.name)
        isLoading.value = false
        isChanged.value = false
        formEvents.value?.fetchData()
        setTimeout(() => (isChanged.value = true), 510)
    })
}
const onStored = async (form_data: any) => {
    if (isChanged.value && form_data?.permissions) {
        await api.request({ method: 'put', url: `/user/${props.id}/permissions/update`, data: form_data })
        notif.success('Updated Successfully')
    }
}
onFetched()
</script>

<template>
    <VLoader :active="isLoading" size="xl" style="min-height: 100px">
        <div class="columns is-multiline">
            <div class="list-wrapper column is-2">
                <div class="list-inner">
                    <div class="list is-centered2">
                        <ul>
                            <li v-for="(tab, key) in Scheme.content" :key="key" :class="[active === tab.props.label && 'is-active']">
                                <slot name="tab-link" :activeValue="active" :tab="tab" :index="key" :toggle="toggle">
                                    <a tabindex="0" @keydown.space.prevent="toggle(tab?.props?.label)" @click="toggle(tab?.props?.label)">
                                        <!-- <VIcon v-if="tab.icon" :icon="tab.icon" /> -->
                                        <span>
                                            <slot name="tab-link-label" :activeValue="active" :tab="tab" :index="key">
                                                {{ tab?.props?.label }}
                                            </slot>
                                        </span>
                                    </a>
                                </slot>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="tabs-wrapper-content column is-10">
                <div class="tabs-wrapper">
                    <div class="tabs-inner">
                        <div class="tabs is-centered2">
                            <ul>
                                <li class="is-active">
                                    <slot name="tab-link" :activeValue="0" :tab="0" :index="0">
                                        <a tabindex="0">
                                            <!-- <VIcon v-if="tab.icon" :icon="tab.icon" /> -->
                                            <span>
                                                <slot name="tab-link-label" :activeValue="0" :tab="0" :index="0"> Permissions </slot>
                                            </span>
                                        </a>
                                    </slot>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div v-for="item in Scheme.content" :key="item.props.label">
                    <ApiForm
                        v-if="item.props.label == active"
                        :wrapper="ThinPage"
                        class="permissions"
                        title=""
                        store-on="delay"
                        :fetch-data="tabData"
                        :scheme="tabScheme(item.props.label)"
                        store-label="Update"
                        store-method="put"
                        :store-data="{}"
                        @store-data="onStored"
                        @events="(value) => (formEvents = value)"
                    />
                </div>
            </div>
        </div>
    </VLoader>
</template>

<style lang="scss">
.list-inner {
    li {
        padding: 10px 5px;
        border-bottom: 1px solid gray;

        &.is-active {
            background-color: #e4e6e9;

            a {
                color: black;
            }
        }
    }
}

.tabs-wrapper-content {
    padding: 0 20px;
}

.permissions {
    .wide-vertical-block .field > .control {
        display: block;
        width: 100%;
    }

    .wide-vertical-block .field > label {
        width: auto;
        padding: 0;
        font-size: 0.9rem;
        color: var(--light-text) !important;
    }
}
</style>
