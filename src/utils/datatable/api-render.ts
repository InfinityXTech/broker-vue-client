import { AxiosError, Method } from 'axios'
import { h, reactive } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import ToggleSwitchField from '/@src/components/partials/forms/ToggleSwitchField.vue'

const api = useApi()
const notif = useNotyf()

export function ToggleSwitchApiCell(method: Method, url: string, row: any, key: string) {
    const current: Record<string, boolean> = reactive({})
    current[key] = row[key]

    return h({
        setup() {
            return () =>
                h(ToggleSwitchField, {
                    label: '',
                    modelValue: current[key],
                    'onUpdate:modelValue': async (newValue: boolean) => {
                        try {
                            current[key] = newValue

                            await api.request({ method, url, data: current })

                            notif.success('Updated Successfully')
                            current[key] = row[key] = newValue
                        } catch (ex) {
                            console.error(ex)
                            const error = ex as AxiosError
                            notif.dismissAll()
                            notif.error(error.message)
                            current[key] = row[key]
                        }
                    },
                })
        },
    })
}
