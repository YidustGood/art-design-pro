<template>
  <div class="jsplugin-management-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="header-card">
          <template #header>
            <div class="header-card-title">
              <el-icon><Platform /></el-icon>
              <span>JS插件管理</span>
            </div>
          </template>
          <div class="header-card-content">
            <p>管理系统中的所有JS插件，您可以启用、禁用或重新加载插件。</p>
            <div class="operation-buttons">
              <el-button type="primary" @click="refreshPlugins" :loading="isLoading">
                <el-icon><Refresh /></el-icon>刷新插件列表
              </el-button>
              <el-button type="success" @click="reloadAllPlugins" :loading="isAllReloading">
                <el-icon><RefreshRight /></el-icon>重新加载所有插件
              </el-button>
              <el-button type="warning" @click="showUploadDialog">
                <el-icon><Upload /></el-icon>上传新插件
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="filter-row">
      <el-col :xs="24" :sm="16" :md="16" :lg="16" :xl="16">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索插件名称、描述或作者"
          clearable
          @clear="filterPlugins"
          @input="filterPlugins"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
        <el-select
          v-model="statusFilter"
          placeholder="插件状态"
          style="width: 100%"
          clearable
          @change="filterPlugins"
        >
          <el-option label="全部插件" value="" />
          <el-option label="已启用" value="enabled" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
      </el-col>
    </el-row>

    <el-row v-loading="isLoading" :gutter="24" class="plugin-cards">
      <template v-if="Object.keys(pluginList).length > 0">
        <el-col
          v-for="(plugin, key) in pluginList"
          :key="key"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="6"
          class="plugin-col"
        >
          <el-card class="plugin-card" :body-style="{ padding: '0' }">
            <div class="plugin-header" :class="{ disabled: !plugin.enable }">
              <div class="plugin-icon">
                <img
                  :src="plugin.pluginIconUrl || 'https://icon-library.com/images/latte.png'"
                  alt="插件图标"
                  @error="handleImageError"
                />
              </div>
              <div class="plugin-info">
                <div class="plugin-name">{{ plugin.pluginName }}</div>
                <div class="plugin-version">v{{ plugin.pluginVersion }}</div>
              </div>
              <div class="plugin-status">
                <el-switch
                  v-model="plugin.enable"
                  @update:model-value="(val) => togglePluginStatus(plugin.pluginName, Boolean(val))"
                  :active-text="plugin.enable ? '已启用' : '已禁用'"
                  :disabled="isProcessing[plugin.pluginName]"
                />
              </div>
            </div>
            <div class="plugin-content">
              <p class="plugin-desc">{{ plugin.pluginDesc || '暂无描述' }}</p>
              <p class="plugin-author">作者: {{ plugin.pluginAuthor || '未知' }}</p>
            </div>
            <div class="plugin-footer">
              <el-button
                type="primary"
                text
                @click="reloadPlugin(plugin.pluginName)"
                :loading="isProcessing[plugin.pluginName]"
                :disabled="!plugin.enable"
              >
                <el-icon><RefreshRight /></el-icon>热重载
              </el-button>
              <el-button type="primary" text @click="showPluginDetails(plugin.pluginName)">
                <el-icon><InfoFilled /></el-icon>详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </template>
      <el-empty v-else description="暂无插件数据" />
    </el-row>

    <!-- 上传插件对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传新插件" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="插件名称" required>
          <el-input
            v-model="uploadForm.pluginName"
            placeholder="请输入插件名称，如：my-plugin"
          ></el-input>
        </el-form-item>
        <el-form-item label="插件描述">
          <el-input
            v-model="uploadForm.pluginDesc"
            type="textarea"
            placeholder="请输入插件功能描述"
          ></el-input>
        </el-form-item>
        <el-form-item label="插件版本">
          <el-input
            v-model="uploadForm.pluginVersion"
            placeholder="请输入版本号，如：1.0.0"
          ></el-input>
        </el-form-item>
        <el-form-item label="插件作者">
          <el-input v-model="uploadForm.pluginAuthor" placeholder="请输入作者信息"></el-input>
        </el-form-item>
        <el-form-item label="作者主页">
          <el-input
            v-model="uploadForm.pluginIconUrl"
            placeholder="请输入作者主页URL或头像URL"
          ></el-input>
        </el-form-item>
        <el-form-item label="插件文件" required>
          <el-upload
            class="plugin-upload"
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".js,.zip"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-button type="primary">
              <el-icon><Plus /></el-icon>选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip"> 请上传 .js 或 .zip 格式的插件文件（最大10MB） </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadPlugin" :loading="isUploading"> 上传 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, reactive } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Platform,
    Refresh,
    RefreshRight,
    InfoFilled,
    Search,
    Upload,
    Plus
  } from '@element-plus/icons-vue'
  import { jsPluginService, PluginInfo } from '@/api/jsPluginApi'
  import { JSPluginApi } from '@/api/config/apiConfig'

  // 插件列表数据
  const pluginList = ref<Record<string, PluginInfo>>({})
  // 原始插件列表（用于筛选和搜索）
  const originalPluginList = ref<Record<string, PluginInfo>>({})
  // 加载状态
  const isLoading = ref(false)
  // 处理中的插件（避免重复操作）
  const isProcessing = reactive<Record<string, boolean>>({})
  // 重载所有插件的状态
  const isAllReloading = ref(false)
  // 搜索和筛选
  const searchKeyword = ref('')
  const statusFilter = ref('')

  // 插件上传相关
  const uploadDialogVisible = ref(false)
  const isUploading = ref(false)
  const uploadForm = reactive({
    pluginName: '',
    pluginDesc: '',
    pluginVersion: '1.0.0',
    pluginAuthor: '',
    pluginIconUrl: '',
    file: null as File | null
  })

  // 获取插件列表
  const getPluginList = async () => {
    isLoading.value = true
    console.log('开始获取插件列表，请求URL:', JSPluginApi.GET_PLUGIN_LIST)
    try {
      const res = await jsPluginService.getPluginList()
      console.log('获取插件列表响应:', res)
      if (res.code === 200 && res.data) {
        // 确保enable字段为布尔类型
        const processedData: Record<string, PluginInfo> = {}
        Object.keys(res.data).forEach((key) => {
          // 检查是否为合法的插件数据对象（必须包含pluginName, pluginVersion等字段）
          if (
            typeof res.data[key] === 'object' &&
            res.data[key] !== null &&
            'pluginName' in res.data[key] &&
            'pluginVersion' in res.data[key]
          ) {
            processedData[key] = {
              ...res.data[key],
              enable: Boolean(res.data[key].enable)
            }
          }
        })
        originalPluginList.value = processedData
        pluginList.value = processedData
      } else {
        ElMessage.error(res.message || '获取插件列表失败')
      }
    } catch (error) {
      console.error('获取插件列表异常:', error)
      ElMessage.error('获取插件列表发生异常')
    } finally {
      isLoading.value = false
    }
  }

  // 筛选插件
  const filterPlugins = () => {
    if (!searchKeyword.value && !statusFilter.value) {
      // 如果没有筛选条件，恢复原始列表
      pluginList.value = { ...originalPluginList.value }
      return
    }

    // 基于关键字和状态筛选插件
    const filteredPlugins: Record<string, PluginInfo> = {}
    Object.entries(originalPluginList.value).forEach(([key, plugin]) => {
      const matchesKeyword =
        !searchKeyword.value ||
        plugin.pluginName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        (plugin.pluginDesc &&
          plugin.pluginDesc.toLowerCase().includes(searchKeyword.value.toLowerCase())) ||
        (plugin.pluginAuthor &&
          plugin.pluginAuthor.toLowerCase().includes(searchKeyword.value.toLowerCase()))

      const matchesStatus =
        !statusFilter.value ||
        (statusFilter.value === 'enabled' && plugin.enable) ||
        (statusFilter.value === 'disabled' && !plugin.enable)

      if (matchesKeyword && matchesStatus) {
        filteredPlugins[key] = plugin
      }
    })

    pluginList.value = filteredPlugins
  }

  // 刷新插件列表
  const refreshPlugins = () => {
    getPluginList()
  }

  // 重新加载所有插件
  const reloadAllPlugins = async () => {
    ElMessageBox.confirm(
      '确定要重新加载所有插件吗？这将重新加载插件系统中的所有插件，可能需要一点时间。',
      '操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        isAllReloading.value = true
        try {
          const res = await jsPluginService.reloadAllPlugins()
          if (res.code === 200) {
            // 提取耗时信息
            const timeInfo = res.data || ''

            // 显示成功消息，包含耗时信息
            ElMessage({
              message: `所有插件已重新加载，${timeInfo}`,
              type: 'success',
              duration: 5000, // 延长显示时间
              showClose: true
            })

            // 刷新插件列表
            await getPluginList()
          } else {
            ElMessage.error(res.message || '重新加载所有插件失败')
          }
        } catch (error) {
          console.error('重新加载所有插件异常:', error)
          ElMessage.error('重新加载所有插件发生异常')
        } finally {
          isAllReloading.value = false
        }
      })
      .catch(() => {
        ElMessage.info('已取消操作')
      })
  }

  // 切换插件状态
  const togglePluginStatus = async (pluginName: string, status: boolean) => {
    // 保存原始状态，以便操作失败时回滚
    const originalStatus = pluginList.value[pluginName]?.enable
    // 先设置为处理中状态
    isProcessing[pluginName] = true

    try {
      // 先显示UI变化，优化用户体验
      pluginList.value[pluginName].enable = status

      // 发送API请求
      const res = status
        ? await jsPluginService.enablePlugin(pluginName)
        : await jsPluginService.disablePlugin(pluginName)

      // 处理请求结果
      if (res.code === 200) {
        // 提取耗时信息
        const timeInfo = res.data || ''

        // 显示成功消息，包含耗时信息
        ElMessage({
          message: `插件 ${pluginName} ${status ? '已启用' : '已禁用'}，${timeInfo}`,
          type: 'success',
          duration: 3000
        })
      } else {
        // 操作失败，回滚UI状态
        pluginList.value[pluginName].enable = originalStatus
        ElMessage.error(res.message || `${status ? '启用' : '禁用'}插件失败`)
      }
    } catch (error) {
      // 发生异常，回滚UI状态
      pluginList.value[pluginName].enable = originalStatus
      console.error(`${status ? '启用' : '禁用'}插件异常:`, error)
      ElMessage.error(`${status ? '启用' : '禁用'}插件发生异常`)
    } finally {
      // 无论成功失败，结束处理状态
      isProcessing[pluginName] = false
    }
  }

  // 重新加载插件
  const reloadPlugin = async (pluginName: string) => {
    isProcessing[pluginName] = true
    try {
      const res = await jsPluginService.hotReloadPlugin(pluginName)
      if (res.code === 200) {
        // 提取耗时信息
        const timeInfo = res.data || ''

        // 显示成功消息，包含耗时信息
        ElMessage({
          message: `插件 ${pluginName} 已重新加载，${timeInfo}`,
          type: 'success',
          duration: 3000
        })
      } else {
        ElMessage.error(res.message || '重新加载插件失败')
      }
    } catch (error) {
      console.error('重新加载插件异常:', error)
      ElMessage.error('重新加载插件发生异常')
    } finally {
      isProcessing[pluginName] = false
    }
  }

  // 查看插件详情
  const showPluginDetails = async (pluginName: string) => {
    try {
      // 调用API获取插件配置详情
      const res = await jsPluginService.getPluginConfig(pluginName)
      if (res.code === 200 && res.data) {
        // 格式化插件配置信息
        const configData = res.data
        const detailsHtml = `
        <div class="plugin-details">
          <div class="detail-item">
            <span class="label">插件名称:</span> 
            <span class="value">${configData.pluginName || pluginName}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件版本:</span> 
            <span class="value">${configData.pluginVersion || '未知'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件作者:</span> 
            <span class="value">${configData.pluginAuthor || '未知'}</span>
          </div>
          <div class="detail-item">
            <span class="label">作者邮箱:</span> 
            <span class="value">${configData.pluginAuthorEmail || '未提供'}</span>
          </div>
          <div class="detail-item">
            <span class="label">作者主页:</span> 
            <span class="value">${configData.pluginAuthorUrl || '未提供'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件描述:</span> 
            <span class="value">${configData.pluginDescription || '暂无描述'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件图标:</span> 
            <span class="value">${configData.pluginIconUrl || '未设置'}</span>
          </div>
          <div class="detail-item">
            <span class="label">当前状态:</span> 
            <span class="value ${configData.system_enable ? 'status-enabled' : 'status-disabled'}">
              ${configData.system_enable ? '已启用' : '已禁用'}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">默认启用:</span> 
            <span class="value">${configData.defaultEnable ? '是' : '否'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件语言:</span> 
            <span class="value">${configData.pluginLanguage || 'JavaScript'}</span>
          </div>
          <div class="detail-item">
            <span class="label">合并代码:</span> 
            <span class="value">${configData.mergeCodeMode ? '是' : '否'}</span>
          </div>
          <div class="detail-item">
            <span class="label">允许IO:</span> 
            <span class="value">${configData.allowIO ? '是' : '否'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件路径:</span> 
            <span class="value">${configData.system_pluginsPath || '未知'}</span>
          </div>
        </div>
      `

        // 显示详情弹窗
        ElMessageBox.alert(detailsHtml, '插件详情', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
          customClass: 'plugin-detail-box'
        }).catch(() => {})
      } else {
        // 如果接口调用失败，回退到使用列表数据显示简要信息
        const fallbackHtml = `
        <div class="plugin-details">
          <div class="detail-item">
            <span class="label">插件名称:</span> 
            <span class="value">${pluginName}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件版本:</span> 
            <span class="value">${pluginList.value[pluginName]?.pluginVersion || '未知'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件作者:</span> 
            <span class="value">${pluginList.value[pluginName]?.pluginAuthor || '未知'}</span>
          </div>
          <div class="detail-item">
            <span class="label">插件描述:</span> 
            <span class="value">${pluginList.value[pluginName]?.pluginDesc || '暂无描述'}</span>
          </div>
          <div class="detail-item">
            <span class="label">当前状态:</span> 
            <span class="value ${pluginList.value[pluginName]?.enable ? 'status-enabled' : 'status-disabled'}">
              ${pluginList.value[pluginName]?.enable ? '已启用' : '已禁用'}
            </span>
          </div>
        </div>
      `

        ElMessageBox.alert(fallbackHtml, '插件详情 (简要信息)', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
          customClass: 'plugin-detail-box'
        }).catch(() => {})

        ElMessage.warning('获取完整插件配置失败，显示简要信息')
      }
    } catch (error) {
      console.error('获取插件详情异常:', error)
      ElMessage.error('获取插件详情失败')
    }
  }

  // 显示上传对话框
  const showUploadDialog = () => {
    // 重置表单
    uploadForm.pluginName = ''
    uploadForm.pluginDesc = ''
    uploadForm.pluginVersion = '1.0.0'
    uploadForm.pluginAuthor = ''
    uploadForm.pluginIconUrl = ''
    uploadForm.file = null
    // 显示对话框
    uploadDialogVisible.value = true
  }

  // 处理文件变更
  const handleFileChange = (file: any) => {
    if (file.raw) {
      if (file.raw.size > 10 * 1024 * 1024) {
        ElMessage.error('文件大小不能超过10MB')
        return false
      }
      uploadForm.file = file.raw
    }
  }

  // 处理文件移除
  const handleFileRemove = () => {
    uploadForm.file = null
  }

  // 上传插件
  const uploadPlugin = async () => {
    // 表单验证
    if (!uploadForm.pluginName) {
      ElMessage.error('请输入插件名称')
      return
    }

    if (!uploadForm.file) {
      ElMessage.error('请选择插件文件')
      return
    }

    isUploading.value = true

    const formData = new FormData()
    formData.append('file', uploadForm.file)
    formData.append('pluginName', uploadForm.pluginName)
    formData.append('pluginDesc', uploadForm.pluginDesc || '')
    formData.append('pluginVersion', uploadForm.pluginVersion || '1.0.0')
    formData.append('pluginAuthor', uploadForm.pluginAuthor || '')
    formData.append('pluginIconUrl', uploadForm.pluginIconUrl || '')

    try {
      const res = await jsPluginService.uploadPlugin(formData)

      if (res.code === 200) {
        ElMessage.success('插件上传成功')
        uploadDialogVisible.value = false
        // 刷新插件列表
        await refreshPlugins()
      } else {
        ElMessage.error(res.message || '插件上传失败')
      }
    } catch (error) {
      console.error('上传插件异常:', error)
      ElMessage.error('上传插件发生异常')
    } finally {
      isUploading.value = false
    }
  }

  // 组件挂载时获取插件列表
  onMounted(() => {
    getPluginList()
  })

  // 图片加载错误处理
  const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    if (target) {
      target.src = 'https://icon-library.com/images/latte.png'
    }
  }
</script>

<style scoped lang="scss">
  .jsplugin-management-container {
    padding: 20px;

    .header-card {
      margin-bottom: 24px;
      background: var(--el-bg-color);
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);

      .header-card-title {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: bold;

        .el-icon {
          margin-right: 8px;
          font-size: 20px;
        }
      }

      .header-card-content {
        display: flex;
        align-items: center;
        justify-content: space-between;

        p {
          margin: 0;
          color: var(--el-text-color-secondary);
        }

        .operation-buttons {
          display: flex;
          gap: 12px; // 按钮之间的间距

          .el-button {
            .el-icon {
              margin-right: 4px;
            }
          }
        }
      }
    }

    .filter-row {
      margin-bottom: 20px;

      .el-select,
      .el-input {
        width: 100%;
      }

      @media screen and (width <= 768px) {
        .el-col {
          margin-bottom: 12px;
        }
      }
    }

    .plugin-cards {
      margin-top: 16px;

      .plugin-col {
        display: flex;
        margin-bottom: 24px;
      }

      .plugin-card {
        width: 100%;
        height: 100%;
        overflow: hidden;
        border: 1px solid var(--el-border-color-light);
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgb(0 0 0 / 3%);
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 8px 16px rgb(0 0 0 / 10%);
          transform: translateY(-5px);
        }

        .plugin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--el-color-primary-light-9);
          border-bottom: 1px solid var(--el-border-color-lighter);

          &.disabled {
            background: var(--el-fill-color-lighter);
            opacity: 0.8;
          }

          .plugin-icon {
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            margin-right: 12px;
            overflow: hidden;
            border-radius: 6px;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .plugin-info {
            flex: 1;
            min-width: 0; // 让文本可以正确截断

            .plugin-name {
              margin-bottom: 6px;
              overflow: hidden;
              font-size: 16px;
              font-weight: bold;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .plugin-version {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }

          .plugin-status {
            flex-shrink: 0;
            margin-left: 8px;
          }
        }

        .plugin-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100px;
          padding: 16px;

          .plugin-desc {
            // 超过三行显示省略号
            display: -webkit-box;
            margin-top: 0;
            margin-bottom: 12px;
            overflow: hidden;
            line-height: 1.5;
            color: var(--el-text-color-primary);
            text-overflow: ellipsis;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }

          .plugin-author {
            margin: 0;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .plugin-footer {
          display: flex;
          justify-content: flex-end;
          padding: 12px 16px;
          background-color: var(--el-fill-color-light);
          border-top: 1px solid var(--el-border-color-lighter);

          .el-button {
            margin-left: 12px;

            .el-icon {
              margin-right: 4px;
            }
          }
        }
      }
    }

    .plugin-upload {
      width: 100%;

      .el-upload {
        width: 100%;
        text-align: left;

        .el-button {
          margin-bottom: 8px;
        }
      }

      .el-upload__tip {
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-secondary);
      }
    }
  }

  // 响应式调整
  @media screen and (width <= 768px) {
    .jsplugin-management-container {
      padding: 12px;

      .header-card-content {
        flex-direction: column;
        align-items: flex-start;

        .operation-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          margin-top: 12px;

          .el-button {
            width: 100%;
          }
        }
      }

      .plugin-cards {
        .plugin-card {
          .plugin-header {
            flex-wrap: wrap;

            .plugin-icon {
              margin-bottom: 8px;
            }

            .plugin-info {
              width: calc(100% - 60px);
            }

            .plugin-status {
              width: 100%;
              margin-top: 8px;
              margin-left: 0;
            }
          }

          .plugin-content {
            min-height: 80px;
          }
        }
      }
    }
  }

  // 插件详情相关样式
  :deep(.plugin-detail-box) {
    // 设置弹窗宽度
    width: 550px !important;
    max-width: 90vw;

    .el-message-box__header {
      padding-bottom: 15px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-message-box__title {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    .el-message-box__body {
      max-height: 70vh;
      padding: 20px;
      overflow-y: auto;
    }

    .plugin-details {
      .detail-item {
        display: flex;
        margin-bottom: 12px;

        .label {
          min-width: 80px;
          font-weight: bold;
          color: var(--el-text-color-regular);
        }

        .value {
          flex: 1;
          word-break: break-all;

          &.status-enabled {
            font-weight: bold;
            color: var(--el-color-success);
          }

          &.status-disabled {
            color: var(--el-color-danger);
          }
        }
      }
    }
  }
</style>
