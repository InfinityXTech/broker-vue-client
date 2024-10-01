import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isString, useStorage } from '@vueuse/core'
import { useSidemenu, SidemenuConfig } from '/@src/composable/useSidemenu'
import type { RouteLocationRaw } from 'vue-router'
import { toBoolean } from '/@src/utils/helpers'
import { hasOwn } from '@vue/shared'
import { useApi } from '/@src/composable/useApi'

export type UserData = Record<string, any> | null

export const useUserSession = defineStore('userSession', () => {
    // token will be synced with local storage
    // @see https://vueuse.org/core/usestorage/

    const numOfHours = 1
    const session_expire_default = new Date()
    session_expire_default.setTime(session_expire_default.getTime() + numOfHours * 60 * 60 * 1000)

    const token = useStorage('token', '')
    const user_activity = useStorage('user_activity', new Date())
    const session_hash = useStorage('session_hash', '')
    const session_expire = useStorage('session_expire', session_expire_default)

    const needRelogin = ref(false)
    const user = ref<Partial<UserData>>()
    const loading = ref(true)
    let renewalTime: any = undefined

    const api = useApi()

    const b64DecodeUnicode = (str: string) =>
        decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))

    const parseJwt = (token: string) => JSON.parse(b64DecodeUnicode(token.split('.')[1].replace('-', '+').replace('_', '/')))

    const isLoggedIn = computed(() => {
        // return token.value?.length > 0
        if (token.value?.length > 0) {
            // const jwtDetails = parseJwt(token.value)
            // return new Date(jwtDetails.exp * 1000).getTime() > new Date().getTime()
            return new Date(session_expire.value).getTime() > new Date().getTime()
        }
        return false
    })

    //An array of DOM events that should be interpreted as
    //user activity.
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

    //add these events to the document.
    //register the activity function as the listener parameter.
    let activityMinuteEvents: Record<string, { lastDate: Date; count: number }> = {}
    activityEvents.forEach(function (eventName) {
        const activity = (eventName: string) => {
            if (!activityMinuteEvents[eventName]) {
                activityMinuteEvents[eventName] = { lastDate: new Date(), count: 1 }
            } else {
                activityMinuteEvents[eventName].lastDate = new Date()
                activityMinuteEvents[eventName].count++
            }
            // console.log(activityMinuteEvents)
            // if (activityTimeout != undefined) {
            //     clearTimeout(activityTimeout)
            // }
            // activityTimeout = setTimeout(() => {
            //     user_activity.value = new Date()
            //     activityTimeout = undefined
            // }, 5000)
        }
        document.addEventListener(eventName, () => activity(eventName), true)
    })

    setInterval(() => {
        const is_another_count = ['mousedown', 'keydown', 'scroll', 'touchstart'].some((event: string) => activityMinuteEvents[event]?.count > 0)
        const count_mouse_move = activityMinuteEvents['mousemove']?.count
        if (count_mouse_move > 40 || is_another_count) {
            user_activity.value = new Date()
            // console.log('set user_activity ' + user_activity.value)
        }
        // console.log(activityMinuteEvents)
        activityMinuteEvents = {}
    }, 1000 * 60)

    function checkRenewalJwt() {
        if (renewalTime != undefined) {
            clearTimeout(renewalTime)
            renewalTime = undefined
        }

        if (token.value?.length > 0) {
            const jwtDetails = parseJwt(token.value)

            if (typeof jwtDetails.exp !== 'undefined') {
                const ttl = Math.max(new Date(jwtDetails.exp * 1000).getTime() - new Date().getTime() - 60000, 2000)
                renewalTime = setTimeout(() => {
                    const jwtDetails = parseJwt(token.value)
                    if (new Date(jwtDetails.exp * 1000).getTime() - new Date().getTime() > 1000 * 60 * 3) {
                        renewalTime = undefined
                        checkRenewalJwt()
                        return
                    }
                    renewalJwt()
                    renewalTime = undefined
                }, ttl)
            }
        }
    }

    // setInterval(() => {
    //     const diff = Math.abs(new Date().getTime() - new Date(user_activity.value).getTime())
    //     const minutes = Math.floor(diff / 1000 / 60)
    //     console.log('activiry ' + minutes + ' minutes')
    // }, 1000)

    function renewalJwt() {
        const diff = Math.abs(new Date().getTime() - new Date(user_activity.value).getTime())
        const minutes = Math.floor(diff / 1000 / 60)
        if (minutes <= 30) {
            const request = api.post('/auth/renewal', { session_hash: session_hash.value })
            request.then((response: any) => {
                if (response?.data?.access_token?.length > 0) {
                    setToken(response.data.access_token)
                    setSessionHash(response.data.session_hash)
                }
            })
        }
    }

    function setUser(newUser: Partial<UserData>) {
        user.value = newUser
    }

    function setToken(newToken: string) {
        setNeedRelogin(false)
        if (newToken?.length > 0 && token.value != newToken) {
            token.value = newToken
            const jwtDetails = parseJwt(token.value)
            session_expire.value = new Date(jwtDetails.exp * 1000)
            checkRenewalJwt()
        }
    }

    function setSessionHash(newToken: string) {
        if (session_hash.value != newToken) {
            session_hash.value = newToken
        }
    }

    function getSessionHash(): string {
        return session_hash.value
    }

    function setLoading(newLoading: boolean) {
        loading.value = newLoading
    }

    function setNeedRelogin(value: boolean) {
        if (needRelogin.value != value) {
            needRelogin.value = value
        }
    }

    function roles() {
        return (() => {
            const is = (..._roles: string[]) => {
                const roles = user.value?.roles ?? []
                for (const index in _roles) {
                    if (roles.indexOf(_roles[index]) >= 0) {
                        return true
                    }
                }
                return false
            }
            return { is: is }
        })()
    }

    function features() {
        return (() => {
            const is = (..._features: string[]) => {
                const private_features = (user.value?.client ?? {}).private_features ?? []
                const public_features = (user.value?.client ?? {}).public_features ?? []
                for (const index in _features) {
                    if (private_features.indexOf(_features[index]) >= 0 || public_features.indexOf(_features[index]) >= 0) {
                        return true
                    }
                }
                return false
            }
            const is_public = (..._features: string[]) => {
                const public_features = (user.value?.client ?? {}).public_features ?? []
                for (const index in _features) {
                    if (public_features.indexOf(_features[index]) >= 0) {
                        return true
                    }
                }
                return false
            }
            const is_private = (..._features: string[]) => {
                const private_features = (user.value?.client ?? {}).private_features ?? []
                for (const index in _features) {
                    if (private_features.indexOf(_features[index]) >= 0) {
                        return true
                    }
                }
                return false
            }
            return { is: is, is_public: is_public, is_private: is_private }
        })()
    }

    function permissions(permission_name: string) {
        return (() => {
            const permissions = user.value?.permissions ?? {}
            const is_active = (): boolean => {
                return toBoolean(permissions[permission_name]?.active ?? 0)
            }
            const is_allow = (...accesses: string[]): boolean => {
                const check = (pn: string, access: string) => {
                    if (permissions[pn]) {
                        if (toBoolean(permissions[pn]['access'] == access) == true || (permissions[pn][access] && toBoolean(permissions[pn][access]) == true)) {
                            return true
                        }
                    }
                }
                for (const index in accesses) {
                    const access = accesses[index]
                    if (check(permission_name, access) || check('*', access)) {
                        return true
                    }
                }
                return false
            }
            const is_custom_allow = (...accesses: string[]): boolean => {
                const check = (pn: string, access: string): boolean | undefined => {
                    if (permissions[pn] && permissions[pn]['custom'] && permissions[pn]['custom'][access]) {
                        return toBoolean(permissions[pn]['custom'][access]) == true
                    }
                    return is_allow(...accesses); // Since nothing happens if it is undefined
                }
                for (const index in accesses) {
                    const access = accesses[index]
                    const p1 = check(permission_name, access)
                    const p2 = p1 == true || check('*', access)
                    if (p1 == true || p2 == true /* || (p1 == undefined && p2 == undefined)*/) {
                        return true
                    }
                }
                return false
            }
            return {
                is_active,
                is_allow,
                is_custom_allow,
            }
        })()
    }

    function menu() {
        return (() => {
            const _roles = roles()
            const _features = features()
            const is_allow_menu = (permission_name: string, menu_item: SidemenuConfig): boolean => {
                let result = true

                // roles
                if (menu_item?.roles && menu_item?.roles.length > 0) {
                    if ((menu_item?.roles_condition ?? 'or').toLowerCase() == 'or') {
                        if (_roles && _roles.is(...menu_item?.roles) === false) {
                            result = false
                        }
                    } else {
                        menu_item?.roles.forEach((n) => {
                            if ((_roles && _roles.is(n)) === false) {
                                result = false
                            }
                        })
                    }
                }

                // public_features
                if (result && menu_item?.public_features && menu_item?.public_features.length > 0) {
                    if ((menu_item?.public_features_condition ?? 'or').toLowerCase() == 'or') {
                        if (_features && _features.is_public(...menu_item?.public_features) === false) {
                            result = false
                        }
                    } else {
                        menu_item?.public_features.forEach((n) => {
                            if ((_features && _features.is_public(n)) === false) {
                                result = false
                            }
                        })
                    }
                }

                // private_features
                if (result && menu_item?.private_features && menu_item?.private_features.length > 0) {
                    if ((menu_item?.private_features_condition ?? 'or').toLowerCase() == 'or') {
                        if (_features && _features.is_private(...menu_item?.private_features) === false) {
                            result = false
                        }
                    } else {
                        menu_item?.private_features.forEach((n) => {
                            if ((_features && _features.is_private(n)) === false) {
                                result = false
                            }
                        })
                    }
                }

                if (result && permission_name) {
                    const permission = permissions(permission_name)

                    // access
                    if (result && menu_item?.access && menu_item?.access.length > 0) {
                        if ((menu_item?.access_condition ?? 'or').toLowerCase() == 'or') {
                            if (permission && permission.is_allow(...menu_item?.access) === false) {
                                result = false
                            }
                        } else {
                            menu_item?.access.forEach((n) => {
                                if ((permission && permission.is_allow(n)) === false) {
                                    result = false
                                }
                            })
                        }
                    }

                    // custom access
                    if (result && menu_item?.custom_access && menu_item?.custom_access.length > 0) {
                        if ((menu_item?.custom_access_condition ?? 'or').toLowerCase() == 'or') {
                            if (permission && permission.is_custom_allow(...menu_item?.custom_access) === false) {
                                result = false
                            }
                        } else {
                            menu_item?.custom_access.forEach((n) => {
                                if ((permission && permission.is_custom_allow(n)) === false) {
                                    result = false
                                }
                            })
                        }
                    }
                }
                return result
            }

            const only_allows = (permission_name: string, children: SidemenuConfig[]): SidemenuConfig[] => {
                return (children ?? []).filter((menu_item: SidemenuConfig) => is_allow_menu(menu_item?.permission_name ?? permission_name, menu_item))
            }

            const get_first_allow = (menu: SidemenuConfig): SidemenuConfig | undefined => {
                const allows = only_allows(menu.permission_name ?? '', menu?.children ?? [])
                const subAllows = allows.filter((x: any) => {
                    if (x?.title?.toLowerCase().indexOf('back') < 0) {
                        return true
                    }
                    return false
                })

                let result: SidemenuConfig | undefined = undefined
                subAllows.forEach((smenu) => {
                    if (result != undefined) {
                        return
                    }
                    if (hasOwn(smenu, 'to')) {
                        result = smenu
                        return
                    } else {
                        const sub_allows = only_allows(menu.permission_name ?? '', smenu.children ?? [])
                        if (sub_allows.length > 0) {
                            result = sub_allows[0]
                            return
                        }
                        smenu?.children?.forEach((dmenu) => {
                            if (hasOwn(dmenu, 'children') && (dmenu.children ?? []).length > 0) {
                                const sub_allows = only_allows(menu.permission_name ?? '', dmenu.children ?? [])
                                if (sub_allows.length > 0) {
                                    result = sub_allows[0]
                                    return
                                }
                            }
                        })
                    }
                })
                return result
            }

            return {
                only_allows,
                get_first_allow,
            }
        })()
    }

    async function logoutUser() {
        token.value = undefined
        user.value = undefined
    }

    if (isLoggedIn.value) {
        checkRenewalJwt()
    }

    return {
        needRelogin,
        user,
        token,
        isLoggedIn,
        loading,
        logoutUser,
        setUser,
        setToken,
        setLoading,
        setNeedRelogin,
        setSessionHash,
        getSessionHash,
        roles,
        permissions,
        features,
        menu,
    } as const
})

/**
 * Pinia supports Hot Module replacement so you can edit your stores and
 * interact with them directly in your app without reloading the page.
 *
 * @see https://pinia.esm.dev/cookbook/hot-module-replacement.html
 * @see https://vitejs.dev/guide/api-hmr.html
 */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useUserSession, import.meta.hot))
}
