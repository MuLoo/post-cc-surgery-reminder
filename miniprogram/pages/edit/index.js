/* 待办重新编辑页面 */
const DefaultDrink = {
  7: 200,
  9: 300,
  12: 200,
  15: 300,
  18: 200,
  20: 300,
}
const initData = {
  _id: '',
  title: '',
  desc: '',
  files: [],
  fileName: '',
  freqOptions: ['未完成', '已完成'],
  // totalWaterOptions: ['2000毫升', '2500毫升', '3000毫升'],
  // intervalsReminderOptions: ['1 小时', '2 小时', '3 小时', '自定义'],
  freq: 0, // 这三个都是index
  // waterTotalIndex: 0,
  // intervalsIndex: 0,
  customIntervalItems: Array.from({ length: 24 }, (v, i) => ({
    name: `${i + 1} 点`,
    value: i + 1,
    checked: DefaultDrink[i+1] ? true : false,
    targetDrink: DefaultDrink[i+1] || '', // 这个时间段的目标饮水量. 默认有6次，早中晚饭各 200ml， 中间穿插3次，每次 400ml
    actualDrink: '', // 这个时间段的实际饮水量
    actualPee: '', // 这个时间段的实际排尿量
  })),
}

Page({
  getChildComponent: function () {
    const childData = this.selectComponent('.todoDetail');
    return childData;
  },
  // 类似 add 页面，存储正在编辑的待办信息
  data: {
    ...initData
  },

  async onLoad(options) {
    const childData = this.getChildComponent()
    // 根据上一页传来的 _id 值更新表单数据
    if (options.id !== undefined) {
      this.setData({
        _id: options.id
      })
      const db = await getApp().database()
      // 根据待办 _id 加载信息
      db.collection(getApp().globalData.collection).where({
        _id: this.data._id
      }).get().then(res => {
        // 解包获得 todo 对象
        const {
          data: [todo]
        } = res
        // 循环拼接展示的文件列表名，文件名过长时截断
        let fileName = ''
        for (let file of todo.files) {
          fileName += file.name.substr(0, 10) + (file.name.length > 10 ? "..." : "") + " "
        }
        // 如果整体文件名字符串过长则整体截断
        fileName = fileName.substr(0, 20) + (fileName.length > 20 ? "..." : "")

        childData.setDetailData({
          ...initData,
          _id: this.data._id,
          title: todo.title,
          desc: todo.desc,
          files: todo.files,
          fileName,
          freq: todo.freq,
          record: todo.record,
        })
      })
    }
  },

  // 删除待办事项
  async deleteTodo() {
    const db = await getApp().database()
    // 根据待办 _id 删除待办事项
    db.collection(getApp().globalData.collection).where({
      _id: this.data._id
    }).remove()
    // 删除完成后，退回首页
    wx.navigateBack({
      delta: 2,
    })
  },

  cancelEdit() {
    wx.navigateBack({
      delta: 0,
    })
  },

  // 保存待办信息
  async saveTodo() {
    const data = this.getChildComponent().data
    console.log('data ----', data)
    // 对输入框内容进行校验
    if (data.title === '') {
      wx.showToast({
        title: '事项标题未填写',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (data.title.length > 10) {
      wx.showToast({
        title: '事项标题过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (data.desc.length > 100) {
      wx.showToast({
        title: '事项描述过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    const db = await getApp().database()
    // 校验通过后，根据待办 _id，更新待办信息
    db.collection(getApp().globalData.collection).where({
      _id: this.data._id
    }).update({
      data
    }).then(() => {
      // 待办更新后，返回详情页
      wx.navigateBack({
        delta: 0,
      })
    }).catch(err => {
      console.log(err)
      wx.showToast({
        title: '保存失败，请稍后重试',
        icon: 'error',
        duration: 2000
      })
      wx.navigateBack({
        delta: 0,
      })
    })
  }
})