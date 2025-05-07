<template>
  <div class="api-doc-container">
    <iframe
      :src="apiDocUrl"
      class="api-doc-iframe"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { getBaseApiUrl } from '@/config/env/api-config'

  // API文档URL，根据当前环境的baseURL拼接doc.html路径
  const apiDocUrl = ref('')

  onMounted(() => {
    // 获取当前环境的baseURL
    const baseUrl = getBaseApiUrl() || window.location.origin
    // 移除URL末尾的斜杠（如果有）
    const baseUrlWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    // 拼接Knife4j文档路径
    apiDocUrl.value = `${baseUrlWithoutTrailingSlash}/doc.html`
  })
</script>

<style lang="scss" scoped>
  .api-doc-container {
    width: 100%;
    height: calc(100vh - 160px);
    padding: 0;
    overflow: hidden;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 10%);

    .api-doc-iframe {
      border: none;
    }
  }
</style>
