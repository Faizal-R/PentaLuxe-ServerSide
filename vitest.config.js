import {defineConfig} from 'vitest/config'

export default defineConfig({
    test:{
        globals:true,
        setupFiles:["test/setup.js"],
        isolate:false,
        testTimeout:10000
    }
})