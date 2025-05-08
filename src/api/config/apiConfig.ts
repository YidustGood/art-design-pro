/**
 * API接口路径配置
 * 统一管理所有接口URL，方便维护和修改
 */
import { getServiceActualPath } from '@/config/env/api-config'

// 服务名称常量
export const ServiceNames = {
  AUTH: 'easy-cloud-auth',
  USER: 'easy-cloud-user',
  CONTENT: 'easy-cloud-content',
  JSPLUGIN: 'easy-cloud-js-plugin'
} as const

/**
 * API接口基础路径
 * @param serviceName 微服务名称
 * @returns 服务的完整前缀路径
 */
export function getServicePath(serviceName: string): string {
  // 使用API配置获取实际服务路径
  return getServiceActualPath(serviceName)
}

/**
 * 拼接完整的API路径
 * @param serviceName 微服务名称
 * @param path API路径
 * @returns 完整的API路径
 */
export function getApiPath(serviceName: string, path: string): string {
  const servicePath = getServicePath(serviceName)
  // 如果服务路径为空（不启用服务前缀），则直接返回路径
  if (!servicePath) {
    return path
  }
  return `${servicePath}${path}`
}

/**
 * 认证相关API
 */
export const AuthApi = {
  // 登录认证
  LOGIN: getApiPath(ServiceNames.AUTH, '/auth/login'),
  LOGOUT: getApiPath(ServiceNames.AUTH, '/auth/logout'),
  // 刷新令牌
  REFRESH_TOKEN: getApiPath(ServiceNames.AUTH, '/auth/refreshToken'),
  // 用户信息
  USER_INFO: getApiPath(ServiceNames.AUTH, '/auth/user/info'),
  UPDATE_USER_INFO: getApiPath(ServiceNames.AUTH, '/auth/user/update'),
  UPDATE_PASSWORD: getApiPath(ServiceNames.AUTH, '/auth/user/password'),
  // 检查用户名和手机号
  CHECK_USERNAME: getApiPath(ServiceNames.AUTH, '/auth/check/username'),
  CHECK_MOBILE: getApiPath(ServiceNames.AUTH, '/auth/check/mobile'),
  // 注册
  REGISTER: getApiPath(ServiceNames.AUTH, '/auth/register'),
  // 菜单
  MENU_LIST: getApiPath(ServiceNames.AUTH, '/menu/list'),
  MENU_TREE: getApiPath(ServiceNames.AUTH, '/menu/tree'),
  // 角色
  ROLE_LIST: getApiPath(ServiceNames.AUTH, '/role/list'),
  ROLE_PAGE: getApiPath(ServiceNames.AUTH, '/role/page'),
  ROLE_DETAIL: getApiPath(ServiceNames.AUTH, '/role'), // GET /{id}，获取角色详情
  ROLE_ADD: getApiPath(ServiceNames.AUTH, '/role'), // POST，新增角色
  ROLE_UPDATE: getApiPath(ServiceNames.AUTH, '/role'), // PUT，更新角色
  ROLE_DELETE: getApiPath(ServiceNames.AUTH, '/role'), // DELETE /{id}，删除角色
  ROLE_PERMISSIONS: getApiPath(ServiceNames.AUTH, '/role'), // /{roleId}/permissions，角色权限操作
  ROLE_GET_MENU_PERMISSIONS: getApiPath(ServiceNames.AUTH, '/role/menu'), // 获取角色菜单权限
  ROLE_SET_MENU_PERMISSIONS: getApiPath(ServiceNames.AUTH, '/role/menu'), // 设置角色菜单权限
  ROLE_GET_FUNC_PERMISSIONS: getApiPath(ServiceNames.AUTH, '/role/permissions'), // 获取角色功能权限
  ROLE_SET_FUNC_PERMISSIONS: getApiPath(ServiceNames.AUTH, '/role/permissions'), // 设置角色功能权限
  // 权限
  PERMISSION_LIST: getApiPath(ServiceNames.AUTH, '/permission/list')
}

/**
 * 用户相关API
 */
export const UserApi = {
  // 用户列表
  LIST: getApiPath(ServiceNames.USER, '/user/list'),
  // 用户详情
  DETAIL: getApiPath(ServiceNames.USER, '/user/detail'),
  // 更新用户
  UPDATE: getApiPath(ServiceNames.USER, '/user/update'),
  // 删除用户
  DELETE: getApiPath(ServiceNames.USER, '/user/delete')
}

// JS插件管理API
export const JSPluginApi = {
  GET_PLUGIN_LIST: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/getPluginList'), // 获取插件列表
  GET_PLUGIN_CONFIG: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/getPluginConfig'), // 获取插件配置，将更改为使用路径参数
  ENABLE_PLUGIN: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/enablePlugin'), // 启用插件，使用路径参数
  DISABLE_PLUGIN: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/disablePlugin'), // 禁用插件，使用路径参数
  HOT_RELOAD_PLUGIN: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/hotReloadPlugin'), // 热重载插件，使用路径参数
  RELOAD_PLUGINS: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/reloadPlugins'), // 重新加载所有插件
  UPLOAD_PLUGIN: getApiPath(ServiceNames.JSPLUGIN, '/api/jsplugin/uploadPlugin') // 上传插件
}

/**
 * 其他业务相关API可以按照上面的模式扩展
 */
