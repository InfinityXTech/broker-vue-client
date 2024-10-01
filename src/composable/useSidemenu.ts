import { computed, ref } from 'vue'

export interface SidemenuConfig {
    id?: string
    class?: string
    title?: string
    uri_title?: string
    icon?: string
    permission_name?: string
    roles?: string[]
    roles_condition?: string
    access?: string[]
    access_condition?: string
    custom_access?: string[]
    custom_access_condition?: string
    public_features?: string[]
    public_features_condition?: string
    private_features?: string[]
    private_features_condition?: string
    to?: { name: string; params?: any }
    children?: SidemenuConfig[]
    children_desktop?: boolean
}

const stack: SidemenuConfig[] = []
const menu = ref<SidemenuConfig>({
    permission_name: '',
    roles: [],
    roles_condition: 'or',
    access: [],
    access_condition: 'or',
    custom_access: [],
    custom_access_condition: 'or',
    public_features: [],
    public_features_condition: 'or',
    private_features: [],
    private_features_condition: 'or',
})
const isVisible = computed(() => (menu.value?.children?.length ?? 0) > 0)

export function useSidemenu() {
    return {
        menu,
        isVisible,

        push(config: SidemenuConfig) {
            stack.push(menu.value)
            menu.value = config
        },

        pop() {
            menu.value = stack.pop() ?? {}
        },
    }
}
