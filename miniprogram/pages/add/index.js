/* 新增待办页面 */
Page({
  getChildComponent: function () {
    const data = this.selectComponent('.todoDetail');
    return data;
  },
  // 保存编辑中待办的信息
  data: {
    // title: '',
    // desc: '',
    // files: [],
    // fileName: '',
    // statusOptions: ['未完成', '已完成'],
    // totalWaterOptions: ['2000毫升', '2500毫升', '3000毫升'],
    // intervalsReminderOptions: ['1 小时', '2 小时', '3 小时', '自定义'],
    // status: 0, // 这三个都是index
    // waterTotalIndex: 0,
    // intervals: 0,
    // customIntervalItems: Array.from({ length: 24 }, (v, i) => ({
    //   name: `${i + 1} 点`,
    //   value: i + 1,
    //   checked: i >= 6 && i <= 21 ? true : false,
    // })),
  },
  // 保存待办
  async saveTodo() {
    const data = this.getChildComponent().data
    // 对输入框内容进行校验
    if (data.title === '') {
      wx.showToast({
        title: '计划名称未填写',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    if (data.title.length > 10) {
      wx.showToast({
        title: '计划名称过长',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    if (data.desc.length > 100) {
      wx.showToast({
        title: '计划描述过长',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    // 处理饮水间隔提醒，默认时间是从7点到22点
    data.created_at = new Date().getTime()
    data.updated_at = new Date().getTime()
    const db = await getApp().database()
    // 在数据库中新建待办事项，并填入已编辑对信息
    db.collection(getApp().globalData.collection)
      .add({
        data
      })
      .then(() => {
        wx.navigateBack({
          delta: 0,
        })
      }).catch(err => {
        console.log(err)
        wx.showToast({
          title: '保存失败，请稍后重试',
          icon: 'error',
          duration: 2000,
        })
        wx.navigateBack({
          delta: 0,
        })
      })
  },
  // 重置所有表单项
  resetTodo() {
    const reset = this.getChildComponent().resetTodo
    reset()
  },
})