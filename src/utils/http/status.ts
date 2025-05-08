/**
 * API 状态码枚举
 */
export enum ApiStatus {
  /** 成功 */
  success = 200,
  /** 参数错误 */
  paramError = 400,
  /** 未授权 */
  unauthorized = 401,
  /** 禁止访问 */
  forbidden = 403,
  /** 资源不存在 */
  notFound = 404,
  /** 服务器内部错误 */
  serverError = 500
}

/**
 * 请求方法枚举
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

/**
 * 内容类型枚举
 */
export enum ContentType {
  /** application/json */
  JSON = 'application/json',
  /** application/x-www-form-urlencoded */
  FORM = 'application/x-www-form-urlencoded',
  /** multipart/form-data */
  MULTIPART = 'multipart/form-data'
}
