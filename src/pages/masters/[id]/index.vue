<script setup lang="ts">
import { h, ref, provide } from 'vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useRouter, RouteLocationRaw } from 'vue-router'
import { useUserSession } from '/@src/stores/userSession'
import { useSidemenu } from '/@src/composable/useSidemenu'
import Scheme from '/@src/schemes/masters/masterEdit.json'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import ThinPageFullWidth from '/@src/components/partials/ThinPageFullWidth.vue'
import VModal from '/@src/components/base/modal/VModal.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import VDropdown from '/@src/components/base/dropdown/VDropdown.vue'
import { useDictionary } from '/@src/composable/useDictionary'
import VPlaceload from '/@src/components/base/loader/VPlaceload.vue'

export interface MasterProps {
    id: string
}
export interface DictionaryItem {
    value: string
    label: {
        title: string
        default_value: string
        symbol: string
    }
}
const props = defineProps<MasterProps>()

const notif = useNotyf()
const viewWrapper = useViewWrapper()
const sidemenu = useSidemenu()
const userSession = useUserSession()
const router = useRouter()

const perm = userSession.permissions('masters')
const is_access_edit = perm.is_allow('all', 'edit') && perm.is_allow('general')
const is_access_add = perm.is_allow('all', 'add') && perm.is_allow('general')

if (!perm.is_allow('general')) {
    const allow_menu = userSession.menu().get_first_allow(sidemenu.menu?.value)
    if (allow_menu) {
        router.push(allow_menu.to as RouteLocationRaw)
    } else {
        router.push({ name: '403' })
    }
}

const dictionary = useDictionary().load({ dictionary: 'master_type_of_calculations' })

const masterData = ref<any>({})

const onFetched = (data: any) => {
    masterData.value = data
    viewWrapper.setPageTitle('Master: ' + data.token)
}
const onStored = () => {
    notif.success('Updated Successfully')
}

const resetPassword = ref(false)

provide('custom.ResetPassword', () => {
    const isLoading = ref(false)

    if (is_access_edit) {
        return () =>
            h(
                VButton,
                {
                    color: 'primary',
                    loading: isLoading.value,
                    disabled: !is_access_edit,
                    onClick() {
                        resetPassword.value = true
                    },
                },
                () => 'Reset Password'
            )
    } else {
        return h('span')
    }
})

provide('custom.TypeOfCalculation', () => {
    const selected = ref<string>(masterData.value.type_of_calculation)
    const actions = dictionary.options.map((item: DictionaryItem) => {
        return h(
            'a',
            {
                class: 'dropdown-item',
                onClick: () => {
                    selected.value = item.value
                    masterData.value.type_of_calculation = item.value
                    masterData.value.calculation_price = dictionary.map[selected.value]?.default_value
                },
            },
            [item.label.title]
        )
    })
    return () => {
        if (dictionary.isLoading) {
            return h(VPlaceload)
        }
        let results = []
        if (is_access_edit) {
            results.push(
                h(
                    VDropdown,
                    {
                        color: 'info',
                        title: dictionary.map[selected.value]?.title,
                        spaced: true,
                    },
                    { content: () => actions }
                )
            )
        }
        results.push(
            h('input', {
                class: 'input',
                style: 'width:150px;height: 35px;margin-left: 10px;',
                value: masterData.value?.calculation_price,
                type: 'number',
                max: dictionary.map[selected.value]?.default_value,
                min: 0,
                readonly: !is_access_edit,
                onChange: (e: any) => {
                    const min = parseInt(e.target.getAttribute('min'))
                    const max = parseInt(e.target.getAttribute('max'))
                    const v = parseInt(e.target.value)

                    if (v < min) e.target.value = min
                    if (v > max) e.target.value = max

                    masterData.value.calculation_price = e.target.value
                },
            })
        )

        results.push(
            h(
                'span',
                {
                    style: 'margin-left: 10px; margin-top: 7px;display: inline-block;',
                },
                dictionary.map[selected.value]?.symbol
            )
        )

        return results
    }
})

const resetPassowrdModal = (function () {
    const active = ref(false)
    const password = ref('')
    return {
        active,
        password,
    }
})()
</script>

<template>
    <!-- v-if="userSession.permissions('masters').is_allow('all', 'edit')" -->
    <ApiForm
        :wrapper="ThinPageFullWidth"
        title="Master"
        :fetch-data="'/master/' + props.id"
        :scheme="Scheme"
        :readonly="!is_access_edit"
        store-label="Update"
        store-method="put"
        store-on="delay"
        :store-data="'/master/update/' + props.id"
        @fetch-data="onFetched"
        @store-data="onStored"
    />

    <ApiForm
        v-if="resetPassword"
        :wrapper="VModal"
        size="small"
        title="Reset Password"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reset the password?')"
        store-method="put"
        :readonly="!is_access_edit"
        :store-data="'/master/reset_password/' + props.id"
        @store-data="
            (response) => {
                resetPassowrdModal.password = response.password
                onStored()
                resetPassword = false
                resetPassowrdModal.active.value = true
            }
        "
        @close="resetPassword = false"
    />

    <VModal :open="resetPassowrdModal.active.value" title="New Password" cancel-label="Close" actions="right" @close="resetPassowrdModal.active.value = false">
        <template #content> A new password is {{ resetPassowrdModal.password }} </template>
    </VModal>
</template>
