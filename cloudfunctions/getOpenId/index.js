// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ // 初始化云开发环境
  env: cloud.DYNAMIC_CURRENT_ENV // 当前环境的常量
})
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  // 预置创建集合，如果存在则自动失败跳过，自己上架时可以去掉
  try {
    await db.createCollection('todo')
    await db.createCollection('daily')
  } catch (e) { }
  const wxContext = cloud.getWXContext()

  // 返回当前用户的身份信息，用于数据库记录和查询
  return {
    event,
    openid: wxContext.OPENID,
    fromopenid: wxContext.FROM_OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}