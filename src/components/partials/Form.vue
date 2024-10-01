<script lang="ts">
import { isString, hasOwn } from '@vue/shared'
import { isFunction } from '@vueuse/shared'
import { defineComponent, h, PropType, reactive } from 'vue'
import { resolveComponents } from '/@src/components/partials/forms/_resolver'

export interface FormComponent {
    component: string
    data?: string | Record<string, string>
    props?: Record<string, any>
    children?: FormComponent[]
}

export type FormCheckComponentAccess = (component: FormComponent) => boolean

export function forEachProperty(data: string | Record<string, string | undefined> | undefined, callback: (target: string, property: string) => void) {
    const properties = isString(data) ? { modelValue: data } : data
    for (const property in properties) {
        const target = properties[property]
        if (target) {
            callback(target, property)
        }
    }
}

export function schemeConfirm(message: string) {
    return {
        type: 'Form',
        content: [
            {
                component: 'HtmlField',
                props: { html: '<div class="column">' + message + '</div>' },
            },
        ],
    }
}

export function getFormVal(obj: any, path: string) {
    let current = obj
    path.split('.').forEach(function (p) {
        current = current != undefined ? current[p] : undefined
    })
    return current
}

/**
 * If the path is a string, convert it to an array
 * @param  {String|Array} path The path
 * @return {Array}             The path array
 */
var stringToPath = function (path: string): Array<any> {
    // If the path isn't a string, return it
    if (typeof path !== 'string') return path

    // Create new array
    var output: Array<any> = []

    // Split to an array with dot notation
    path.split('.').forEach(function (item, index) {
        // Split to an array with bracket notation
        item.split(/\[([^}]+)\]/g).forEach(function (key) {
            // Push to the new array
            if (key.length > 0) {
                output.push(key)
            }
        })
    })

    return output
}

export function setFormVal(obj: any, val: any, path: string): void {
    // Convert the path to an array if not already
    var path2 = stringToPath(path)

    // Cache the path length and current spot in the object
    var length = path2.length
    var current = obj

    // Loop through the path
    path2.forEach(function (key, index) {
        // If this is the last item in the loop, assign the value
        if (index == length - 1) {
            current[key] = val
        }

        // Otherwise, update the current place in the object
        else {
            // If the key doesn't exist, create it
            if (!current[key]) {
                current[key] = {}
            }

            // Update the current place in the objet
            current = current[key]
        }
    })

    // old version
    // let current = obj
    // let p = path.split('.')
    // for (let i = 0; i < p.length - 1; i++) {
    //     current = current != undefined ? current[p[i]] : {}
    // }
    // if (!current) {
    //     current = {}
    // }
    // current[p[p.length - 1]] = val
}

export default defineComponent({
    props: {
        data: {
            type: Object as PropType<any>,
            required: true,
        },
        children: {
            type: Array as PropType<FormComponent[]>,
            required: true,
        },
        errors: {
            type: Object as PropType<Record<string, string[]>>,
            required: true,
        },
        checkComponentAccess: {
            type: Object as PropType<FormCheckComponentAccess>,
            default: undefined,
            required: false,
        },
    },
    emits: ['update:data'],
    async setup(props, { emit }) {
        const data = reactive(props.data)
        const errors = reactive(props.errors)
        const checkComponentAccess = props.checkComponentAccess ? reactive(props.checkComponentAccess) : undefined
        const components: any = {}
        await resolveComponents(props, components)

        function build(items: FormComponent[]) {
            const result: any[] = []
            for (let i in items) {
                const item = items[i]
                const children = item.children && build(item.children)

                const component = components[item.component]
                const props = Object.assign({}, item.props)
                const error: string[] = []

                const children_errors = children?.filter((x) => (x?.props?.errors ?? []).length > 0) ?? []
                if (item.component == 'ToggleBlock' && children_errors.length > 0) {
                    props.errors = children_errors.map((y: any) => y?.props?.errors)
                }

                forEachProperty(item.data, (target: string, property: string) => {
                    props[property] = getFormVal(data, target) // data[target]

                    props['onUpdate:' + property] = (v: any) => {
                        setFormVal(data, v, target) // data[target] = v
                        emit('update:data', data, target, v)
                    }

                    if (errors[target]) {
                        error.push(...errors[target])
                    }
                })

                if (error.length > 0) {
                    props.errors = error
                }
                if (hasOwn(component.props, 'data')) {
                    props.data = data
                }
                if (hasOwn(component.props, 'scheme')) {
                    props.scheme = item
                }

                if (isFunction(checkComponentAccess) && !checkComponentAccess(item)) {
                    continue
                }
                result.push(h(component, props, () => children))
            }
            return result
        }

        return () => build(props.children, [])
    },
    methods: {
        checkValidate() {
            let required_errors: any = {}
            for (let i in this.$props.children) {
                const item = this.$props.children[i]
                if (item && item.props?.required && isString(item.data)) {
                    const val = hasOwn(this.$props.data, item.data) ? this.$props.data[item.data] : ''
                    if (item.props.required && (val == undefined || val == null || val == '')) {
                        required_errors[item.data] = ['The "' + item.props.label + '" field is required.']
                    }
                }
            }

            return required_errors
        },
    },
})
</script>
