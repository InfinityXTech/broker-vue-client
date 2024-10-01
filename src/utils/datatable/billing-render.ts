import { Money, MoneyColor } from '/@src/utils/datatable/simple-render'
import { format } from 'date-fns'
import { useDictionary } from '/@src/composable/useDictionary'
import { h } from 'vue'
import { VTagColor } from '/@src/components/base/tags/VTag.vue.__VLS_script'
import { Tippy } from 'vue-tippy'
import { hasOwn } from '@vue/shared'
import VButton from '/@src/components/base/button/VButton.vue'
import VTag from '/@src/components/base/tags/VTag.vue'

const renderMoney = Money()
const renderMoneyColor = MoneyColor()
const users = useDictionary().load({ dictionary: 'users' })

export default function BillingRenders(handlers: Record<string, (row: any) => any>, module: string = '') {
    return {
        Details() {
            return (value: any, row: any) => {
                const actions: any[] = []
                if (row.type == 'payment') {
                    actions.push(
                        h(
                            VButton,
                            { title: 'View Calculation', icon: 'fas fa-calculator', onClick: () => handlers.calculations(row) } /*, () => 'View Calculation'*/
                        )
                    )
                    actions.push(' ')
                }
                if (module != 'master') {
                    if (row.status > 0) {
                        actions.push(
                            h(
                                VButton,
                                { title: 'Download Invoice', icon: 'fas fa-file-invoice', onClick: () => handlers.invoice(row) } /*, () => 'Download Invoice'*/
                            )
                        )
                        actions.push(' ')
                    }
                }
                return actions
            }
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

                if (hasOwn(row, 'status')) {
                    result.push(tag('', 'status'))
                }
                if (module == 'master' || module == 'endpoint') {
                    if (hasOwn(row, 'master_status')) {
                        result.push(tag('Master: ', 'master_status'))
                    }
                    if (hasOwn(row, 'final_status') || (row.status == 1 && row.affiliate_status != 2)) {
                        result.push(tag('Financial: ', 'final_status'))
                    }
                } else {
                    if (hasOwn(row, 'final_status') || row.status == 1) {
                        result.push(tag('Financial: ', 'final_status'))
                    }
                }

                if (row.chargeback) {
                    result.push(
                        h(VTag, {
                            color: 'danger',
                            label: 'Chargeback',
                            style: { marginRight: '5px' },
                        })
                    )
                }
                return result
            }
        },
        Count() {
            return (value: string, row: any) => (row.type == 'prepayment' ? 'Prepayment' : value)
        },
        Type() {
            return (value: string, row: any) => row.type
        },
        Fees() {
            return (value: number) => (value > 0 ? value.toFixed(2) + '%' : '')
        },
        Total() {
            return (value: number, row: any) => {
                if (module == 'broker') {
                    return h(
                        'span',
                        {
                            title: [
                                'Total: ' + renderMoney(row.total),
                                row.total_adjust && 'Real Income: ' + renderMoney(row.total + row.total_adjust),
                                row.total_fee && 'Fee: ' + renderMoney(row.total_fee),
                            ]
                                .filter((x) => x)
                                .join('\n'),
                        },
                        [renderMoneyColor(row.total + row.total_adjust + row.total_fee), row.total_fee ? ` (Fee: ${renderMoney(row.total_fee)})` : '']
                    )
                }
                return h(
                    'span',
                    {
                        title: ['Total: ' + renderMoney(row.total), row.total_adjust && 'Real Income: ' + renderMoney(row.total + row.total_adjust)]
                            .filter((x) => x)
                            .join('\n'),
                    },
                    [renderMoneyColor(row.total + row.total_adjust)]
                )
            }
        },
        Files() {
            return (value: number, row: any) => {
                let hasFiles = false
                if (handlers.hasFiles != undefined) {
                    hasFiles = handlers.hasFiles(row)
                } else {
                    hasFiles = ['affiliate_approve_files', 'master_approve_files', 'final_approve_files'].some((key) => row[key]?.length > 0)
                }
                return hasFiles ? h(VButton, { icon: 'fas fa-file', title: 'Files', onClick: () => handlers.files(row) } /*, () => 'Files'*/) : ''
            }
        },
    }
}
