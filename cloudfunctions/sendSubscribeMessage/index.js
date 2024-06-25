const collection = 'todo'
const templeteId = 'awvwR6aQIE_G1qw0lvmZKQ1agT4-kX3RbDjne5zh8nQ'
const MAX_LIMIT = 100
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})
const db = cloud.database()
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    await db.createCollection(collection)
  } catch (e) { }
  try {
    const totalResult = await db.collection(collection).count()
    const { total } = totalResult
    if (!total) return { source: wxContext.SOURCE, message: '无数据' }
    // 在云函数中，最多一次可以获取100条记录，记录超过这个数字，就要分批次获取了
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = db.collection(collection).where({
        status: 0
      }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(promise)
    }
    const res = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })
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
        title,
        type
      } = item
      // 今天需要提醒否
      if (!todayHasTargetWater(frequency)) continue
      const today = new Date().toLocaleDateString();
      const now = new Date();
      const nowHour = (now.getUTCHours() + 8) % 24; // 东八区时间
      const target = record.filter(item => item.value === nowHour)[0]
      const isUrination = type === 'urination'
      // 今时需要提醒否
      if (!target || !target.checked || (!isUrination && !target.targetDrink)) continue
      const result = await cloud.openapi.subscribeMessage.send({
          "touser": _openid,
          "page": 'pages/list/index',
          "lang": 'zh_CN',
          "data": {
            "thing1": { "value": isUrination ? '已到计划导尿时间' : '喝水时间到啦~' },
            "time2": { "value": `${today} ${nowHour}:00:00` },
            "thing4": { "value": isUrination ? '请按计划导尿' : `需要饮水${Number(target.targetDrink)}毫升` },
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
    console.log('[Errror]:', err)
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