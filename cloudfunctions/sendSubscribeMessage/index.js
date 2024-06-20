const collection = 'todo'
const templeteId = 'awvwR6aQIE_G1qw0lvmZKQ1agT4-kX3RbDjne5zh8nQ'
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})
const db = cloud.database()
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    await db.createCollection('todo')
  } catch (e) { }
  try {
    const res = await db.collection(collection).where({
      // _openid: wxContext.OPENID // 需要查询全部计划, 挨个通知
      status: 0
    }).get()
    const {
      data
    } = res
    const log = [];
    const unComplete = data.filter(item => !item.status) // 未完成的计划
    if (!data.length || !unComplete.length) return  { source: wxContext.SOURCE, message: '无数据' }
    // 如果该用户有多个计划，那么多次提醒
    for (let index = 0; index < unComplete.length; index++) {
      const item = unComplete[index];
      const {
        _openid,
        frequency,
        record,
        title
      } = item
      // 今天需要提醒否
      if (!todayHasTargetWater(frequency)) continue
      const today = new Date().toLocaleDateString();
      const now = new Date();
      const nowHour = (now.getUTCHours() + 8) % 24; // 东八区时间
      const target = record.filter(item => item.value === nowHour)[0]
      // 今时需要提醒否
      if (!target || !target.checked || !target.targetDrink) continue
      const result = await cloud.openapi.subscribeMessage.send({
          // "touser": event.openid || wxContext.OPENID,
          "touser": _openid,
          "page": 'pages/list/index',
          "lang": 'zh_CN',
          "data": {
            "thing1": { "value": '喝水时间到啦~' },
            "time2": { "value": `${today} ${nowHour}:00:00` },
            "thing4": { "value": `需要饮水${Number(target.targetDrink)}毫升` },
            "thing5": { "value": `${title || "饮水计划"}` }
            },
          "templateId": templeteId,
          "miniprogramState": 'trial'
      })
      log.push({
        sendTime: `${today} ${nowHour}:00:00`,
        openid: _openid,
        ...result
      })
    }
    return {
      source: wxContext.SOURCE,
      log
    }
  } catch (err) {
    console.log('what is errror', err)
    return err
  }
}

function todayHasTargetWater(frequency = 'everyday') {
  // 每天
  if (frequency === 'everyday') {
    return true
  }
  // 工作日
  if (frequency === 'workday') {
    return new Date().getDay() > 0 && new Date().getDay() < 6
  }
  const mapping = {
    0: '星期日',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六'
  }
  // 自定义
  return frequency.split(',').includes(mapping[new Date().getDay().toString()])

}