<script setup lang="ts">
import { h, reactive, provide, computed, ref } from 'vue'
import { hasOwn } from '@vue/shared'
import { DatatableMethods } from '/@src/components/partials/tables/Datatable.vue'
import { schemeConfirm } from '/@src/components/partials/Form.vue'
import { customDictionary } from '/@src/utils/dictionary'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { AxiosError } from 'axios'
import { reactiveReplace } from '/@src/utils/helpers'
import { Money, MoneyColor } from '/@src/utils/datatable/simple-render'
import PageToolbarNoButton from '/@src/components/partials/PageToolbarNoButton.vue'
import VButton from '/@src/components/base/button/VButton.vue'
import { VTagColor } from '/@src/components/base/tags/VTag.vue.__VLS_script'
import VTag from '/@src/components/base/tags/VTag.vue'
import { Tippy } from 'vue-tippy'
import { format } from 'date-fns'
import { useDictionary } from '/@src/composable/useDictionary'

import SchemeList from '/@src/schemes/brokers/billing/chargebacksList.json'
import SchemeEdit from '/@src/schemes/brokers/billing/chargebackEdit.json'
import SchemeNew from '/@src/schemes/brokers/billing/chargebackEdit.json'

import SchemeFilesList from '/@src/schemes/brokers/billing/paymentRequestFilesList.json'
import SchemeFinApprove from '/@src/schemes/brokers/billing/paymentMethodFinApprove.json'

import SchemeNewWallet from '/@src/schemes/brokers/billing/paymentMethodsNew.json'

import SchemeNewPaymentRequestSecondStep from '/@src/schemes/brokers/billing/paymentRequestSecondStep.json'
import SchemeNewPaymentRequestThirdStep from '/@src/schemes/brokers/billing/paymentMethodThirdStep.json'

import VModal from '/@src/components/base/modal/VModal.vue'
import VDropdown from '/@src/components/base/dropdown/VDropdown.vue'
import { useUserSession } from '/@src/stores/userSession'
import { ApiFormValidate } from '/@src/components/partials/ApiForm.vue'

export interface BrokerProps {
    id: string
}

const props = defineProps<BrokerProps>()

const viewWrapper = useViewWrapper()

const userSession = useUserSession()
const perm = userSession.permissions('brokers')
const is_access_billing = perm.is_allow('is_billing')
let is_access_edit = perm.is_allow('all', 'edit') && userSession.roles().is('financial')
let is_access_add = perm.is_allow('all', 'add') && userSession.roles().is('financial')

if (userSession.roles().is('account_manager') && !perm.is_allow('allocate_am')) {
    is_access_add = is_access_edit = false
}

const notif = useNotyf()
const api = useApi()
api.get('/broker/' + props.id).then((response: any) =>
    viewWrapper.setPageTitle(
        'Broker: ' +
            response?.data?.partner_name_secure +
            (is_access_billing ? (' - Balance: $' + response?.data?.balance).replace('$-', '-$') : '') +
            ' - Billing Chargebacks'
    )
)

const renderMoney = Money()
const renderMoneyColor = MoneyColor()

const users = useDictionary().load({ dictionary: 'users' })

const custom = {
    PaymentMethod() {
        return (value: any) => render_payment_method_data(value).label
        // {
        //     switch (value.payment_method) {
        //         case 'crypto':
        //             return `${value.payment_method} (${value.currency_crypto_code})`.toUpperCase()
        //         case 'wire':
        //             return `${value.payment_method} (${value.currency_code}) `.toUpperCase() + value.bank_name
        //         default:
        //             return value?.payment_method?.toUpperCase()
        //     }
        // }
    },
    Status() {
        return (value: any, row: any) => {
            const result = []
            const colors: VTagColor[] = ['warning', 'success', 'danger']
            const labels = ['Waiting for approval', 'Approved', 'Rejected']
            const tag = (prefix: string, field: string) => {
                const tag = h(VTag, {
                    color: colors[row[field]] ?? colors[0],
                    label: prefix + (labels[row[field]] ?? labels[0]),
                    style: { marginRight: '5px', marginTop: '2px', marginBottom: '2px' },
                })
                return !row[field]
                    ? tag
                    : h(
                          Tippy,
                          { interactive: true },
                          {
                              default: () => tag,
                              content() {
                                  return [
                                      h('b', ['Timestamp: ']),
                                      format(new Date(+(row[field + '_changed_date']?.$date?.$numberLong ?? 0)), 'dd.MM.yyyy HH:mm:ss'),
                                      h('br'),
                                      h('b', ['Changed by: ']),
                                      users.isLoading ? 'loading...' : users.map[row[field + '_changed_user_id']],
                                      h('br'),
                                      h('b', ['IP: ']),
                                      row[field + '_changed_user_ip'],
                                      h('br'),
                                      h('b', ['User Agent: ']),
                                      row[field + '_changed_user_ua'],
                                  ]
                              },
                          }
                      )
            }

            // if (hasOwn(row, 'final_status') || row.final_status == 1) {
            result.push(tag('Financial: ', 'final_status'))
            // }

            return result
        }
    },
    Files() {
        return (value: number, row: any) => {
            const hasFiles = ['screenshots', 'proof_screenshots', 'final_approve_files'].some((key) => row[key]?.length > 0)
            return hasFiles ? h(VButton, { icon: 'fas fa-file', title: 'Files', onClick: () => (files.value = row._id) }) : []
        }
    },
    Actions() {
        return (value: any, row: any) => {
            // return h('div', { style: row.payment_request ? 'display:none' : null }, [
            //     h(VButton, { icon: 'fas fa-edit', onClick: () => (update.value = row._id) }, () => 'Edit'),
            //     ' ',
            //     h(VButton, { icon: 'fas fa-trash-alt', onClick: () => (remove.value = row._id) }, () => 'Delete'),
            // ])

            const actions: any[] = []

            if (!is_access_edit) {
                return actions
            }

            const action = (title: string, click: () => void) => {
                return h(
                    'a',
                    {
                        href: '#',
                        class: 'dropdown-item',
                        onClick: (ev: Event) => {
                            ev.preventDefault()
                            click()
                        },
                    },
                    [title]
                )
            }
            if (!hasOwn(row, 'final_status') || (row.final_status ?? 0) == 0) {
                actions.push(action('Financial Approve', () => (fin_approve.value = row)))
                actions.push(action('Financial Reject', () => (fin_reject.value = row._id)))
            }
            return actions.length > 0 ? h(VDropdown, { title: 'Action', right: true }, { content: () => actions }) : ''
        }
    },
}

const payment_method_has_fee: Record<string, boolean> = {}
const payment_methods_data = ref<any>([])
const payment_methods = ref()

const render_payment_method_data = (item: any) => {
    let _label = []
    if (item.payment_method == 'crypto') {
        _label = [
            item.payment_method?.toUpperCase(),
            item.currency_crypto_code?.toUpperCase(),
            item.currency_crypto_code == 'usdt' ? item.currency_crypto_wallet_type?.toUpperCase() : '',
            item.wallet,
            item.wallet2,
        ]
    } else {
        _label = [item.payment_method?.toUpperCase(), item.currency_code?.toUpperCase(), item.bank_name, item.account_name, item.account_number]
    }
    const label = _label
        .filter((x) => x)
        .join(' - ')
        .replace(' -  - ', ' - ')
    return { value: item._id, label, default: !!item.status }
}

const get_payment_methods = () => {
    payment_methods.value = customDictionary(`/broker/${props.id}/billing/payment_methods/all`, (item) => {
        payment_methods_data.value.push(item)
        payment_method_has_fee[item._id] = item.payment_method == 'crypto'
        return render_payment_method_data(item)
    })()
}
get_payment_methods()

provide('broker_payment_methods', () => payment_methods.value)
provide('payment_method_has_fee', (value: string) => payment_method_has_fee[value])

provide('transaction_id_required', (value: number) => {
    const item = payment_methods_data.value.find((x: any) => x._id == value)
    return item && item.payment_method == 'crypto' && (item.currency_crypto_code == 'btc' || item.currency_crypto_code == 'usdt')
})

provide('hash_url_required', (value: number) => {
    const item = payment_methods_data.value.find((x: any) => x._id == value)
    return item && item.payment_method != 'crypto'
})

provide('add_new_vallet', () => (create.newWallet.value = true))

provide(
    'broker_payment_requests',
    customDictionary(`/broker/${props.id}/billing/payment_requests/completed`, (item) => {
        if (item.chargeback) {
            return undefined
        }
        return {
            value: item._id,
            label: renderMoney(item.total),
        }
    })
)

const payment_method_validates: Record<string, ApiFormValidate> = {
    wallet: async (data: any): Promise<boolean> => {
        if (data.payment_method == 'crypto' && (data.currency_crypto_code == 'btc' || data.currency_crypto_code == 'usdt')) {
            let currency_crypto_code = data.currency_crypto_code
            if (data.currency_crypto_code == 'usdt') {
                if (data.currency_crypto_wallet_type == 'erc_20') {
                    currency_crypto_code = 'eth'
                } else if (data.currency_crypto_wallet_type == 'trc_20') {
                    currency_crypto_code = 'trx'
                } else {
                    currency_crypto_code = 'eth'
                }
            }
            if ((data.wallet ?? '').length == 0) {
                return false
            }
            const { data: validate } = await api.get(`/validate/cryptocurrency-address/${currency_crypto_code}/${data.wallet}`)
            return validate.validate
        }
        return true
    },
}

const fin_approve = ref<any | false>(false)
const fin_reject = ref<string | false>(false)
const files = ref<string | false>(false)

const update = ref<string | false>(false)
const remove = ref<string | false>(false)
const create = (function () {
    const isLoading = ref(false)
    const isActive = ref(false)
    const step = ref(1)
    const gauth = ref(false)
    const newWallet = ref(false)
    const errors = reactive<any>({})

    const initial = reactive({
        __auth_code__: '',
        data: {
            brokerId: props.id,
            use_payment_request: null,
            payment_request: null,
            amount: null,
        },
        wallet: {
            payment_method: null,
        },
        proof: {
            screenshots: null,
            proof_screenshots: null,
            proof_description: null,
        },
    })

    const isDisabled = computed(
        () =>
            (initial.proof.proof_screenshots ?? []).length == 0 ||
            (initial.proof.screenshots ?? []).length == 0 ||
            (initial.proof.proof_description ?? '').length == 0
    )

    const isStepDisabled = computed(
        () => (step.value == 1 && (initial.data.amount ?? 0) == 0) || (step.value == 2 && (initial.wallet.payment_method ?? '').length == 0)
    )

    const formEvents: Record<string, any> = reactive({
        first_step: null,
        second_step: null,
        third_step: null,
    })

    const show = () => {
        isActive.value = true
        step.value = 1
        // Object.assign(query, { payment_request_type: 'payment' })
        // Object.assign(errors, {})
        initial.__auth_code__ = ''
        initial.wallet.payment_method = null
        initial.proof.screenshots = null
        initial.proof.proof_screenshots = null
        initial.proof.proof_description = null
        newWallet.value = false
    }

    const store_new_payment_method = () => {
        get_payment_methods()
        formEvents['second_step']?.forceReRenderForm()
        newWallet.value = false
    }

    const next = async () => {
        if (step.value == 1 && !formEvents['first_step']?.checkValidate()) {
            return
        }

        if (step.value == 2) {
            const item = payment_methods_data.value.find((x: any) => x._id == initial.wallet.payment_method)
            const wallet_validate = await payment_method_validates['wallet'](item)
            if (wallet_validate == false) {
                alert("This Wallet doesn't have validate number. Please go to this Payment method and update information")
                return
            }
            if ((item?.files ?? []).length == 0) {
                alert("This Wallet doesn't have attachment files. Please go to this Payment method and attach proof files")
                return
            }
            if (!formEvents['second_step']?.checkValidate()) {
                return
            }
        }

        if (step.value == 3 && !formEvents['third_step']?.checkValidate()) {
            return
        }

        step.value++
    }

    const onCreate = async () => {
        if (isLoading.value) {
            return
        }
        try {
            gauth.value = false
            isLoading.value = true

            const data_request: any = {
                ...{ __auth_code__: initial.__auth_code__ },
                ...initial.data,
                ...initial.wallet,
                ...initial.proof,
            }

            const form = new FormData()
            for (let n in data_request) {
                form.append(n, data_request[n])
            }

            const files = ['screenshots', 'proof_screenshots']
            files.forEach((file: string) =>
                (data_request[file] ?? []).forEach((file_object: any) => {
                    form.delete(file)
                    form.append(file + '[]', file_object._id)
                })
            )

            try {
                const { data } = await api.post(`/broker/${props.id}/billing/chargeback/create`, form)
                if ((data.error ?? '').length > 0) {
                    if (data.error.__auth_code__) {
                        initial.__auth_code__ = ''
                        notif.error(data.error.__auth_code__[0])
                        gauth.value = true
                        return
                    }

                    notif.error(data.error)
                } else {
                    isActive.value = false
                    datatable?.value?.fetchData()
                }
            } catch (ex) {
                const error = ex as AxiosError
                const response = error.response?.data

                if (response.exception) {
                    notif.dismissAll()
                    notif.error({ message: error?.response?.data?.error ?? response.message, duration: 9000 })
                }

                if (response.__auth_code__) {
                    initial.__auth_code__ = ''
                    notif.error(response.__auth_code__[0])
                    gauth.value = true
                }
            }
        } catch (ex) {
            const error = ex as AxiosError
            const response = error.response?.data

            if (response.exception) {
                notif.dismissAll()
                notif.error({ message: response?.data?.error ?? response.message, duration: 9000 })
            } else {
                reactiveReplace(errors, response)
                notif.dismissAll()
                notif.error(error?.response?.data?.error ?? error.message)
            }
        } finally {
            isLoading.value = false
        }
    }

    return {
        isLoading,
        isActive,
        isDisabled,
        isStepDisabled,
        step,
        newWallet,
        formEvents,
        gauth,
        errors: errors,
        initial: initial,
        show,
        next,
        store_new_payment_method,
        onCreate,
    }
})()
const datatable = ref<DatatableMethods>()

const totalSum = ref(0)
const onChanged = (data: any[] | null) => (totalSum.value = data?.reduce((sum, row) => sum + row.amount, 0) ?? 0)
</script>

<template>
    <LocalToolbar>
        <CurrencyConverter />
    </LocalToolbar>

    <div class="list-flex-toolbar">
        <div>
            <VCard>Total: <component :is="{ render: () => renderMoneyColor(totalSum) }" /></VCard>
        </div>

        <VButtons>
            <VButton v-if="is_access_add" color="primary" icon="fas fa-plus" elevated @click="create.show()"> Add Chargeback </VButton>
        </VButtons>
    </div>

    <Datatable
        :columns="SchemeList.columns"
        :uri="`/broker/${props.id}/billing/chargeback/all`"
        :custom="custom"
        :classes="['padding-b-100-to-container']"
        @init="(value) => (datatable = value)"
        @changed="onChanged"
    />

    <VModal :open="create.isActive.value" title="Add Chargeback" cancel-label="Close" actions="right" @close="create.isActive.value = false">
        <template #content>
            <template v-if="create.step.value == 1">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :fetch-data="create.initial.data"
                    :model-value="create.initial.data"
                    :errors="create.errors"
                    :scheme="SchemeNew"
                    store-method="post"
                    store-data=""
                    @events="(value) => (create.formEvents['first_step'] = value)"
                />
            </template>
            <template v-else-if="create.step.value == 2">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :fetch-data="create.initial.wallet"
                    :model-value="create.initial.wallet"
                    :errors="create.errors"
                    :scheme="SchemeNewPaymentRequestSecondStep"
                    store-method="post"
                    store-data=""
                    @events="(value) => (create.formEvents['second_step'] = value)"
                />
            </template>
            <template v-else-if="create.step.value == 3">
                <ApiForm
                    title=""
                    :wrapper="PageToolbarNoButton"
                    :fetch-data="create.initial.proof"
                    :model-value="create.initial.proof"
                    :errors="create.errors"
                    :scheme="SchemeNewPaymentRequestThirdStep"
                    store-method="post"
                    store-data=""
                    @events="(value) => (create.formEvents['third_step'] = value)"
                />
            </template>
        </template>
        <template #action>
            <VButton v-if="create.step.value <= 2" :disabled="create.isStepDisabled.value" color="primary" elevated @click="create.next"> Next </VButton>
            <VButton
                v-if="create.step.value == 3"
                :loading="create.isLoading.value"
                :disabled="create.isDisabled.value"
                color="primary"
                elevated
                @click=";(create.gauth.value = true), (create.initial.__auth_code__ = '')"
            >
                Create Chargeback
            </VButton>
        </template>
    </VModal>

    <VModal
        v-if="create.gauth.value !== undefined"
        :classes="['google_auth']"
        :open="create.gauth.value"
        size="small"
        title="Confirm operation by Google authentication"
        actions="right"
        @close="create.gauth.value = false"
        @enter="create.onCreate"
    >
        <template #content>
            <InputField v-model="create.initial.__auth_code__" :maxlength="6" :required="true" label="Enter Authentication Code" />
        </template>
        <template #action>
            <VButton color="primary" :disabled="create.initial.__auth_code__?.length < 6" elevated @click="create.onCreate">Confirm</VButton>
        </template>
    </VModal>

    <!-- New Wallet -->
    <ApiForm
        v-if="create.newWallet.value"
        :wrapper="VModal"
        title="Add Payment Method"
        :fetch-data="{}"
        :scheme="SchemeNewWallet"
        :validates="payment_method_validates"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/payment_methods/create`"
        @store-data="create.store_new_payment_method"
        @events="(value) => (create.formEvents['new_wallet'] = value)"
        @close="create.newWallet.value = false"
    />

    <!-- <ApiForm
        v-if="create"
        :wrapper="VModal"
        title="Add Chargeback"
        :fetch-data="initial"
        :scheme="SchemeNew"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/chargeback/create`"
        @store-data="datatable?.fetchData(), (create.isActive.value = false)"
        @close="create.isActive.value = false"
    /> -->

    <ApiForm
        v-if="update"
        :wrapper="VModal"
        title="Update Chargeback"
        :fetch-data="`/broker/${props.id}/billing/chargeback/${update}`"
        :scheme="SchemeEdit"
        store-method="post"
        :readonly="!is_access_edit"
        :store-data="`/broker/${props.id}/billing/chargeback/update/${update}`"
        @store-data="datatable?.fetchData(), (update = false)"
        @close="update = false"
    />

    <ApiForm
        v-if="remove"
        :wrapper="VModal"
        size="small"
        title="Delete Chargeback"
        :fetch-data="{}"
        :gauth="true"
        :scheme="schemeConfirm('Are you sure you want to delete this record?')"
        store-method="delete"
        :store-data="`/broker/${props.id}/billing/chargeback/delete/${remove}`"
        @store-data="datatable?.fetchData(), (remove = false)"
        @close="remove = false"
    />

    <VModal v-if="files" :open="true" :tabs="true" title="Files" cancel-label="Close" actions="right" @close="files = false">
        <template #content>
            <Datatable :columns="SchemeFilesList.columns" :uri="`/broker/${props.id}/billing/chargeback/files/${files}`" :custom="custom" />
        </template>
    </VModal>

    <ApiForm
        v-if="fin_approve"
        :wrapper="VModal"
        title="Financial Approval"
        :fetch-data="{ date_pay: new Date(), is_request_transaction_id: fin_approve.is_request_transaction_id }"
        :scheme="SchemeFinApprove"
        store-method="post"
        :store-data="`/broker/${props.id}/billing/chargeback/fin_approve/${fin_approve._id}`"
        @store-data="datatable?.fetchData(), (fin_approve = false)"
        @close="fin_approve = false"
    />

    <ApiForm
        v-if="fin_reject"
        :wrapper="VModal"
        size="small"
        title="Financial Reject"
        :fetch-data="{}"
        :scheme="schemeConfirm('Are you sure you want to reject the payment request?')"
        store-method="put"
        :store-data="`/broker/${props.id}/billing/chargeback/fin_reject/${fin_reject}`"
        @store-data="datatable?.fetchData(), (fin_reject = false)"
        @close="fin_reject = false"
    />
</template>
