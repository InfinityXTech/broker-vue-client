import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import ViteFonts from 'vite-plugin-fonts'
import ViteRadar from 'vite-plugin-radar'
import PurgeIcons from 'vite-plugin-purge-icons'
import { imagetools } from 'vite-imagetools'
import ImageMin from 'vite-plugin-imagemin'
import { VitePWA } from 'vite-plugin-pwa'
import purgecss from 'rollup-plugin-purgecss'
import * as fs from 'fs'
import * as path from 'path'

const SILENT = Boolean(process.env.SILENT) ?? false
const SOURCE_MAP = Boolean(process.env.SOURCE_MAP) ?? false

function PrepareFormComponents(root) {
    const files = fs
        .readdirSync(root)
        .filter((file) => file.endsWith('.vue'))
        .map((file) => path.basename(file, '.vue'))
        .sort()
    const lines: string[] = []
    lines.push('// --- File is auto-generated on build ---')
    lines.push(...files.map((name) => `import ${name} from '/@${root}${name}.vue'`))
    lines.push('')
    lines.push('export async function resolveComponents(config: any, result: any) {')
    lines.push(...files.map((name) => `\tresult['${name}'] = ${name}`))
    lines.push('}')
    fs.writeFileSync(root + '_resolver.ts', lines.join('\n'))
}
PrepareFormComponents('src/components/partials/forms/')

/**
 * This is the main configuration file for vitejs
 *
 * @see https://vitejs.dev/config
 */
export default defineConfig({
    // Project root directory (where index.html is located).
    root: process.cwd(),
    // Base public path when served in development or production.
    // You also need to add this base like `history: createWebHistory('my-subdirectory')`
    // in ./src/router.ts
    // base: '/my-subdirectory/',
    base: '/',
    // Directory to serve as plain static assets.
    publicDir: 'public',
    // Adjust console output verbosity.
    logLevel: SILENT ? 'error' : 'info',
    /**
     * By default, Vite will crawl your index.html to detect dependencies that
     * need to be pre-bundled. If build.rollupOptions.input is specified,
     * Vite will crawl those entry points instead.
     *
     * @see https://vitejs.dev/config/#optimizedeps-entries
     */
    optimizeDeps: {
        include: [
            '@ckeditor/ckeditor5-vue',
            '@ckeditor/ckeditor5-build-classic',
            '@iconify/iconify',
            '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.min.js',
            '@vueuse/core',
            '@vueuse/head',
            '@vueform/multiselect',
            '@vueform/slider',
            'axios',
            'billboard.js',
            'dayjs',
            'dropzone',
            'dragula',
            'filepond',
            'filepond-plugin-file-validate-size',
            'filepond-plugin-file-validate-type',
            'filepond-plugin-image-exif-orientation',
            'filepond-plugin-image-crop',
            'filepond-plugin-image-edit',
            'filepond-plugin-image-preview',
            'filepond-plugin-image-resize',
            'filepond-plugin-image-transform',
            'imask',
            'nprogress',
            'notyf',
            'mapbox-gl',
            'photoswipe/dist/photoswipe',
            'photoswipe/dist/photoswipe-ui-default',
            'plyr',
            'v-calendar',
            'vee-validate',
            'vue',
            'vue-scrollto',
            'vue3-apexcharts',
            'vue-tippy',
            'simplebar',
            'simple-datatables',
            'tiny-slider/src/tiny-slider',
            'vue-accessible-color-picker',
            'yup',
        ],
    },
    // Will be passed to @rollup/plugin-alias as its entries option.
    resolve: {
        alias: [
            {
                find: '/@src/',
                replacement: `/src/`,
            },
        ],
        dedupe: ['vue'],
    },
    build: {
        minify: false,
        sourcemap: SOURCE_MAP,
        // Turning off brotliSize display can slightly reduce packaging time
        brotliSize: !SILENT,
        chunkSizeWarningLimit: 2000,
        // minify: true,
    },
    plugins: [
        /**
         * plugin-vue plugin inject vue library and allow sfc files to work (*.vue)
         *
         * @see https://github.com/vitejs/vite/tree/main/packages/plugin-vue
         */
        Vue({
            include: [/\.vue$/],
        }),

        /**
         * vite-plugin-pages plugin generate routes based on file system
         *
         * @see https://github.com/hannoeru/vite-plugin-pages
         */
        Pages({
            nuxtStyle: false,
            pagesDir: [
                {
                    dir: 'src/pages',
                    baseRoute: '',
                },
            ],
        }),

        /**
         * unplugin-vue-components plugin is responsible of autoloading components
         * documentation and md file are loaded for elements and components sections
         *
         * @see https://github.com/antfu/unplugin-vue-components
         */
        Components({
            dirs: ['documentation', 'src/components', 'src/layouts'],
            extensions: ['vue', 'md'],
            dts: true,
            include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        }),

        /**
         * vite-plugin-purge-icons plugin is responsible of autoloading icones from multiples providers
         *
         * @see https://icones.netlify.app/
         * @see https://github.com/antfu/purge-icons/tree/main/packages/vite-plugin-purge-icons
         */
        PurgeIcons(),

        /**
         * vite-plugin-fonts plugin inject webfonts from differents providers
         *
         * @see https://github.com/stafyniaksacha/vite-plugin-fonts
         */
        ViteFonts({
            google: {
                families: [
                    {
                        name: 'Fira Code',
                        styles: 'wght@400;600',
                    },
                    {
                        name: 'Montserrat',
                        styles: 'wght@500;600;700;800;900',
                    },
                    {
                        name: 'Roboto',
                        styles: 'wght@300;400;500;600;700',
                    },
                ],
            },
        }),

        /**
         * vite-plugin-radar plugin inject snippets from analytics providers
         *
         * @see https://github.com/stafyniaksacha/vite-plugin-radar
         */
        ViteRadar({
            enableDev: true,
            analytics: {
                id: '',
            },
        }),

        /**
         * vite-plugin-pwa generate manifest.json and register services worker to enable PWA
         *
         * @see https://github.com/antfu/vite-plugin-pwa
         */
        VitePWA({
            mode: process.env.DEV ? 'development' : 'production',
            base: '/',
            srcDir: './src',
            outDir: './dist',
            // filename: 'sw.ts',
            includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            workbox: {
                /*
                Если skipWaiting екгу, то старый файл /view-one.abcd1234.js будут очищены из кешей как часть activate события. Скорее всего, вы уже удалили его со своего сервера в рамках развертывания. Так что этот запрос не будет выполнен.
                Если skipWaiting false, то старый файл /view-one.abcd1234.js будет по-прежнему доступен в ваших кешах до тех пор, пока все открытые клиенты сервис-воркера не будут закрыты. Обычно это то, что вы хотите.
                */
                skipWaiting: false,
                // globPatterns: ['**/*.{js,css,svg,png,woff2}'],
                globPatterns: ['*/*.*', '*.*'],
                // Don't fallback on document based (e.g. `/some-page`) requests
                // Even though this says `null` by default, I had to set this specifically to `null` to make it work
                navigateFallback: null,
            },
            registerType: 'autoUpdate', //"prompt" | 'autoUpdate'
            manifest: {
                name: 'CRM',
                short_name: 'CRM',
                start_url: '/?utm_source=pwa',
                display: 'standalone',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
        }),

        /**
         * rollup-plugin-purgecss plugin is responsible of purging css rules
         * that are not used in the bundle
         *
         * @see https://github.com/FullHuman/purgecss/tree/main/packages/rollup-plugin-purgecss
         */
        purgecss({
            content: [`./src/**/*.vue`],
            variables: false,
            safelist: {
                standard: [
                    /(autv|lnil|lnir|fas?)/,
                    /-(leave|enter|appear)(|-(to|from|active))$/,
                    /^(?!(|.*?:)cursor-move).+-move$/,
                    /^router-link(|-exact)-active$/,
                    /data-v-.*/,
                ],
            },
            defaultExtractor(content) {
                const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, '')
                return contentWithoutStyleBlocks.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g) || []
            },
        }),

        /**
         * vite-imagetools plugin allow to perform transformation (blur, resize, crop, etc)
         * on images at build time
         *
         * @see https://github.com/JonasKruckenberg/vite-imagetools
         */
        imagetools({
            silent: SILENT,
        }),

        /**
         * vite-plugin-imagemin optimize all images sizes from public or asset folder
         *
         * @see https://github.com/anncwb/vite-plugin-imagemin
         */
        ImageMin({
            verbose: !SILENT,
            gifsicle: {
                optimizationLevel: 7,
                interlaced: false,
            },
            optipng: {
                optimizationLevel: 7,
            },
            mozjpeg: {
                quality: 60,
            },
            pngquant: {
                quality: [0.8, 0.9],
                speed: 4,
            },
            svgo: {
                plugins: [
                    {
                        name: 'removeViewBox',
                        active: false,
                    },
                    {
                        name: 'removeEmptyAttrs',
                        active: false,
                    },
                ],
            },
        }),
    ],
    server: {
        port: 4005,
    }
})
