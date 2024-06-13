/* 新增待办页面 */
Page({
  // 保存编辑中待办的信息
  data: {
    title: '',
    desc: '',
    files: [],
    fileName: '',
    freqOptions: ['未完成', '已完成'],
    totalWaterOptions: ['2000毫升', '2500毫升', '3000毫升'],
    intervalsReminderOptions: ['2 小时', '2.5 小时', '3 小时', '自定义'],
    freq: 0, // 这三个都是index
    waterTotal: 0,
    intervals: 0,
    customIntervalItems: Array.from({ length: 24 }, (v, i) => ({
      name: `${i + 1} 点`,
      value: i + 1,
      checked: i >= 6 && i <= 21 ? true : false,
    })),
  },
  // 表单输入处理函数
  onTitleInput(e) {
    this.setData({
      title: e.detail.value,
    })
  },
  onDescInput(e) {
    this.setData({
      desc: e.detail.value,
    })
  },
  // 上传新附件
  async addFile() {
    // 限制附件个数
    if (this.data.files.length + 1 > getApp().globalData.fileLimit) {
      wx.showToast({
        title: '数量达到上限',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    // 从会话选择文件
    wx.chooseMessageFile({
      count: 1,
    }).then(res => {
      const file = res.tempFiles[0]
      // 上传文件至云存储
      getApp()
        .uploadFile(file.name, file.path)
        .then(res => {
          // 追加文件记录，保存其文件名、大小和文件 id
          this.data.files.push({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2),
            id: res.fileID,
          })
          // 更新文件显示
          this.setData({
            files: this.data.files,
            fileName: this.data.fileName + file.name + ' ',
          })
        })
    })
  },
  // 响应计划状态选择器
  onChooseFreq(e) {
    this.setData({
      freq: e.detail.value,
    })
  },
  // 选择总饮水量
  onChooseWaterTotal(e) {
    this.setData({
      waterTotal: e.detail.value,
    })
  },
  // 选择提醒间隔
  onChooseIntervals(e) {
    console.log(e.detail.value)
    this.setData({
      intervals: Number(e.detail.value),
    })
  },
  // 选择自定义时间
  customIntervalChange(e) {
    console.log(e.detail.value)
    const checked = e.detail.value
    const temp = this.data.customIntervalItems.map((item, index) => {
      return {
        ...item,
        checked: checked.indexOf(String(item.value)) !== -1,
      }
    })
    this.setData({
      customIntervalItems: temp,
    })
  },
  // 保存待办
  async saveTodo() {
    // 对输入框内容进行校验
    if (this.data.title === '') {
      wx.showToast({
        title: '事项标题未填写',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    if (this.data.title.length > 10) {
      wx.showToast({
        title: '事项标题过长',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    if (this.data.desc.length > 100) {
      wx.showToast({
        title: '事项描述过长',
        icon: 'error',
        duration: 2000,
      })
      return
    }
    const db = await getApp().database()
    // 在数据库中新建待办事项，并填入已编辑对信息
    db.collection(getApp().globalData.collection)
      .add({
        data: {
          title: this.data.title, // 待办标题
          desc: this.data.desc, // 待办描述
          files: this.data.files, // 待办附件列表
          freq: Number(this.data.freq), // 待办完成情况（提醒频率）
          // !FIXME 总水量
          waterTotal: Number(this.data.totalWaterOptions[this.data.waterTotal].slice(0, 4)), // 待办饮水总量
          // !FIXME
          // intervals: this.data.intervals, // 待办提醒间隔，
          star: false,
        },
      })
      .then(() => {
        wx.navigateBack({
          delta: 0,
        })
      })
  },
  // 重置所有表单项
  resetTodo() {
    this.setData({
      title: '',
      desc: '',
      files: [],
      fileName: '',
      freqOptions: ['未完成', '已完成'],
      totalWaterOptions: ['2000ML', '2500ML', '3000ML'],
      intervalsReminderOptions: ['2 小时', '2.5 小时', '3 小时'],
      freq: 0,
      waterTotal: 0,
      intervals: 0,
      customIntervalItems: Array.from({ length: 24 }, (v, i) => ({
        name: `${i + 1} 点`,
        value: i + 1,
        checked: i >= 6 && i <= 21 ? true : false,
      })),
    })
  },
})