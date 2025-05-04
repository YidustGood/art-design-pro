import api from '@/utils/http'
import { BaseResult } from '@/types/axios'
import { JSPluginApi } from './config/apiConfig'

// 定义插件类型
export interface PluginInfo {
  pluginName: string // 插件名称
  pluginDesc: string // 插件描述
  pluginVersion: string // 插件版本
  pluginAuthor: string // 插件作者
  pluginAuthorUrl?: string // 作者主页或头像URL
  pluginIconUrl?: string // 插件图标URL
  enable: boolean // 是否启用
}

// 定义插件API服务
export const jsPluginService = {
  // 获取所有插件列表
  async getPluginList(): Promise<BaseResult<Record<string, PluginInfo>>> {
    console.log('开始请求插件列表API:', JSPluginApi.GET_PLUGIN_LIST)
    try {
      const response = await api.get<BaseResult<Record<string, PluginInfo>>>({
        url: JSPluginApi.GET_PLUGIN_LIST
      })
      console.log('插件列表API响应:', response)

      // 处理返回的数据，确保 pluginIconUrl 属性的兼容性
      if (response.code === 200 && response.data) {
        Object.keys(response.data).forEach((key) => {
          // 过滤掉非插件对象，比如executionTime
          if (response.data[key] && typeof response.data[key] === 'object') {
            // 确保插件图标URL存在，如果不存在或为null则设置默认值
            if (!response.data[key].pluginIconUrl || response.data[key].pluginIconUrl === '') {
              response.data[key].pluginIconUrl =
                'https://icon-library.com/images/default-plugin-icon.png'
            }
          }
        })

        // 移除非插件项，如executionTime
        Object.keys(response.data).forEach((key) => {
          if (typeof response.data[key] !== 'object' || !response.data[key].pluginName) {
            delete response.data[key]
          }
        })
      }

      return response
    } catch (error) {
      console.error('获取插件列表失败', error)
      // 返回模拟数据用于测试UI显示
      if (import.meta.env.DEV) {
        console.log('开发环境返回模拟数据')
        return {
          code: 200,
          message: '模拟数据',
          data: {
            'test-plugin': {
              pluginName: 'test-plugin',
              pluginDesc: '测试插件',
              pluginVersion: '1.0.0',
              pluginAuthor: '测试作者',
              pluginIconUrl: 'https://icon-library.com/images/latte.png',
              enable: true
            },
            'mock-plugin': {
              pluginName: 'mock-plugin',
              pluginDesc: '模拟插件',
              pluginVersion: '0.1.0',
              pluginAuthor: '模拟作者',
              pluginIconUrl: 'https://icon-library.com/images/latte.png',
              enable: false
            }
          }
        }
      }
      return {
        code: 500,
        message: '获取插件列表失败，请检查网络连接',
        data: {} as Record<string, PluginInfo>
      }
    }
  },

  // 获取指定插件配置
  async getPluginConfig(pluginName: string): Promise<BaseResult<any>> {
    try {
      const response = await api.get<BaseResult<any>>({
        url: `${JSPluginApi.GET_PLUGIN_CONFIG}/${pluginName}`
      })
      return response
    } catch (error) {
      console.error('获取插件配置失败', error)
      return {
        code: 500,
        message: '获取插件配置失败，请检查网络连接',
        data: null
      }
    }
  },

  // 启用插件
  async enablePlugin(pluginName: string): Promise<BaseResult<any>> {
    try {
      const response = await api.post<BaseResult<any>>({
        url: `${JSPluginApi.ENABLE_PLUGIN}/${pluginName}`
      })
      return response
    } catch (error) {
      console.error('启用插件失败', error)
      return {
        code: 500,
        message: '启用插件失败，请检查网络连接',
        data: null
      }
    }
  },

  // 禁用插件
  async disablePlugin(pluginName: string): Promise<BaseResult<any>> {
    try {
      const response = await api.post<BaseResult<any>>({
        url: `${JSPluginApi.DISABLE_PLUGIN}/${pluginName}`
      })
      return response
    } catch (error) {
      console.error('禁用插件失败', error)
      return {
        code: 500,
        message: '禁用插件失败，请检查网络连接',
        data: null
      }
    }
  },

  // 热重载插件
  async hotReloadPlugin(pluginName: string): Promise<BaseResult<any>> {
    try {
      const response = await api.post<BaseResult<any>>({
        url: `${JSPluginApi.HOT_RELOAD_PLUGIN}/${pluginName}`
      })
      return response
    } catch (error) {
      console.error('热重载插件失败', error)
      return {
        code: 500,
        message: '热重载插件失败，请检查网络连接',
        data: null
      }
    }
  },

  // 重新加载所有插件
  async reloadAllPlugins(): Promise<BaseResult<any>> {
    try {
      const response = await api.post<BaseResult<any>>({
        url: JSPluginApi.RELOAD_PLUGINS
      })
      return response
    } catch (error) {
      console.error('重新加载所有插件失败', error)
      return {
        code: 500,
        message: '重新加载所有插件失败，请检查网络连接',
        data: null
      }
    }
  },

  // 上传插件
  async uploadPlugin(formData: FormData): Promise<BaseResult<any>> {
    try {
      const response = await api.post<BaseResult<any>>({
        url: JSPluginApi.UPLOAD_PLUGIN,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response
    } catch (error) {
      console.error('上传插件失败', error)
      return {
        code: 500,
        message: '上传插件失败，请检查网络连接',
        data: null
      }
    }
  }
}
