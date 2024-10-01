<script setup lang="ts">
import { h, ref } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { RouterLink } from 'vue-router'
import { DatatableMethods, SearchFunc } from '/@src/components/partials/tables/Datatable.vue'
import VButton from '/@src/components/base/button/VButton.vue'
// import ApiCallButton from '/@src/components/partials/forms/ApiCallButton.vue'
import VPhotosSwipe from '/@src/components/base/plugins/VPhotosSwipe.vue'
import SchemeSearch from '/@src/schemes/admin/adminUserSearch.json'
import SchemeResetPassword from '/@src/schemes/admin/userResetPassword.json'
import Scheme from '/@src/schemes/admin/usersList.json'
import SchemeNew from '/@src/schemes/admin/userEdit.json'
import VModal from '/@src/components/base/modal/VModal.vue'
import { useUserSession } from '/@src/stores/userSession'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Users')

const datatable = ref<DatatableMethods>()

const userSession = useUserSession()
const is_admin = userSession.roles().is('admin')

if (!is_admin) {
    window.location.href = '/403'
}

const custom = {
    StuffName() {
        return (value: string, row: any) => {
            return [h(RouterLink, { to: { name: 'admin-id', params: { id: row._id } } }, () => h('b', value)), h('br'), h('small', row._id)]
        }
    },
    QRCode() {
        return (value: string) => {
            const src = value?.replace('&size=200x200', '&size=600x600')
            const thumbnail = value?.replace('&size=200x200', '&size=60x60')
            const items = [
                {
                    src: src,
                    thumbnail: thumbnail,
                    w: 600,
                    h: 600,
                    alt: 'QR Code of User',
                },
            ]
            return h(VPhotosSwipe, { items: items, thumbnailRadius: '5' }, () => value)
            // return h('img', { src: value, style: 'width: 60px' }, () => value)
        }
    },
    ResetPassword() {
        return (value: string, row: any) => {
            // return h(
            //     ApiCallButton,
            //     {
            //         uri: '/user/reset_password/' + row._id,
            //         method: 'PUT',
            //         confirm: 'Are you sure you want to reset the password?',
            //         onStoreData: onStoreResetPassword,
            //     },
            //     () => 'Reset Password'
            // )
            return h(VButton, { color: 'primary', icon: 'fas fa-sync', onClick: () => (resetPassowrd.modalActive.value = row._id) }, () => 'Reset Password')
        }
    },
}

const initial = {}

const create = ref(false)

const onStoreResetPassword = (response: any) => {
    resetPassowrd.password.value = response.password
    resetPassowrd.active.value = true
    resetPassowrd.modalActive.value = false
}

const resetPassowrd = (function () {
    const modalActive = ref<boolean | string>(false)
    const active = ref(false)
    const password = ref('')
    return {
        active,
        modalActive,
        password,
    }
})()

const searchData = ref<any[] | null>(null)
const searchFunc = ref<SearchFunc>()
</script>

<template>
    <DatatableSearch :config="SchemeSearch" :data="searchData" _layout="7" @changed="(value) => (searchFunc = value)">
        <VButton color="primary" icon="fas fa-plus" elevated @click="create = true"> Add User </VButton>
    </DatatableSearch>

    <Datatable
        :columns="Scheme.columns"
        uri="/user/all"
        :custom="custom"
        :search="searchFunc"
        @init="(value) => (datatable = value)"
        @changed="(value) => (searchData = value)"
    />

    <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add User"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        store-data="/user/create"
        @store-data="datatable?.fetchData(), (create = false)"
        @close="create = false"
    />

    <ApiForm
        v-if="resetPassowrd.modalActive.value"
        :wrapper="VModal"
        size="small"
        title="Reset Password"
        :fetch-data="{}"
        :scheme="SchemeResetPassword"
        store-method="put"
        :store-data="'/user/reset_password/' + resetPassowrd.modalActive.value"
        @store-data="onStoreResetPassword"
        @close="resetPassowrd.modalActive.value = false"
    />

    <VModal :open="resetPassowrd.active.value" title="New Password" cancel-label="Close" actions="right" @close="resetPassowrd.active.value = false">
        <template #content> A new password is {{ resetPassowrd.password }} </template>
    </VModal>
</template>
