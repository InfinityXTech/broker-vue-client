import { isString } from '@vue/shared'
import { useUserSession } from '/@src/stores/userSession'
// import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'

interface BrokerData {
    account_manager: string | null
    created_by: string | null
}

function _check_access(data: BrokerData) {
    // const router = useRouter()
    const userSession = useUserSession()
    const perm = userSession.permissions('brokers')
    if (perm.is_allow('is_only_assigned')) {
        const user_id = userSession.user?.id
        if (data.account_manager != user_id && data.created_by != user_id) {
            // console.log('/403')
            location.href = '/403'
            // router.push({ name: '403' })
        }
    }
}

export function checkBrokerAccess(data: string | BrokerData) {
    if (isString(data)) {
        const api = useApi()
        api.get('/broker/' + data).then((response: any) => _check_access(response?.data))
    } else {
        _check_access(data)
    }
}
