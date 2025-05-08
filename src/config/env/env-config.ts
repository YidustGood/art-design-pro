import { createBaseConfig } from '../core/base-config'
import { getBaseApiUrl } from './api-config'

/**
 * 根据环境变量动态配置 base-config
 * 开发环境：development
 * 生产环境：production
 */
export const envConfig = {
  systemInfo:
    process.env.NODE_ENV === 'development'
      ? {
          ...createBaseConfig().systemInfo,
          name: 'Art Design Pro (开发环境)'
        }
      : createBaseConfig().systemInfo,

  // API基础URL配置 - 使用api-config中的配置
  apiBaseUrl: getBaseApiUrl(),

  // 是否使用模拟数据
  useMock: process.env.NODE_ENV === 'development' && import.meta.env.VITE_USE_MOCK === 'true',

  // 是否启用动态路由（后端返回的菜单配置）
  //设为true时使用后端返回的菜单配置，设为false时使用前端静态配置填充到动态路由配置
  useDynamicRoutes: import.meta.env.VITE_USE_DYNAMIC_ROUTES !== 'false'

  // 可以在这里添加其他动态配置
}
