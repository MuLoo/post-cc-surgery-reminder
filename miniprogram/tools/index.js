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

function getDate() {
  return new Date().toLocaleDateString();
}

export {
  todayHasTargetWater,
  getDate
}