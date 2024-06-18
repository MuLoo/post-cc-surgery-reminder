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
  // onLoad() {
  //   this.getChildComponent()
  // },
  // // 表单输入处理函数
  // onTitleInput(e) {
  //   this.setData({
  //     title: e.detail.value,
  //   })
  // },
  // onDescInput(e) {
  //   this.setData({
  //     desc: e.detail.value,
  //   })
  // },
  // // 上传新附件
  // async addFile() {
  //   // 限制附件个数
  //   if (this.data.files.length + 1 > getApp().globalData.fileLimit) {
  //     wx.showToast({
  //       title: '数量达到上限',
  //       icon: 'error',
  //       duration: 2000,
  //     })
  //     return
  //   }
  //   // 从会话选择文件
  //   wx.chooseMessageFile({
  //     count: 1,
  //   }).then(res => {
  //     const file = res.tempFiles[0]
  //     // 上传文件至云存储
  //     getApp()
  //       .uploadFile(file.name, file.path)
  //       .then(res => {
  //         // 追加文件记录，保存其文件名、大小和文件 id
  //         this.data.files.push({
  //           name: file.name,
  //           size: (file.size / 1024 / 1024).toFixed(2),
  //           id: res.fileID,
  //         })
  //         // 更新文件显示
  //         this.setData({
  //           files: this.data.files,
  //           fileName: this.data.fileName + file.name + ' ',
  //         })
  //       })
  //   })
  // },
  // // 响应计划状态选择器
  // onChooseFreq(e) {
  //   this.setData({
  //     status: e.detail.value,
  //   })
  // },
  // // 选择总饮水量
  // onChooseWaterTotal(e) {
  //   this.setData({
  //     waterTotalIndex: e.detail.value
  //   })
  // },
  // // 选择提醒间隔
  // onChooseIntervals(e) {
  //   console.log(e.detail.value)
  //   this.setData({
  //     intervals: Number(e.detail.value),
  //   }, () => this.generateIntervals())
  // },
  // // 选择自定义时间
  // customIntervalChange(e) {
  //   console.log(e.detail.value)
  //   const checked = e.detail.value
  //   const temp = this.data.customIntervalItems.map((item, index) => {
  //     return {
  //       ...item,
  //       checked: checked.indexOf(String(item.value)) !== -1,
  //     }
  //   })
  //   this.setData({
  //     customIntervalItems: temp,
  //   })
  // },
  // // 生成提醒时间的数组
  // generateIntervals() {
  //   const intervals = []
  //   if (this.data.intervals === 3) {

  //     this.data.customIntervalItems.forEach((item, index) => {
  //       if (item.checked) {
  //         intervals.push(item.value)
  //       }
  //     })
  //   } else {
  //     const arr = this.data.customIntervalItems.slice(6, 22)
  //     const step = this.data.intervals === 0 ? 1 : this.data.intervals === 1 ? 2 : 3
  //     for (let i = 0; i < arr.length; i += step) {
  //       intervals.push(arr[i].value)
  //     }

  //   }
  //   return intervals
  // },
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