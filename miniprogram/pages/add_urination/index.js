Page({
  getChildComponent: function () {
    const data = this.selectComponent('.urinationDetail');
    return data;
  },
  data: {},
    // 保存待办
  async saveTodo() {
    const data = this.getChildComponent().data
    console.log('data -----', data)
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
    if (!data.urinationInput.time || !data.urinationInput.num) {
      wx.showToast({
        title: '请填写残余尿量',
        icon: 'error',
        duration: 2000
      })
      return
    }
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
  resetUrination() {
    const reset = this.getChildComponent().resetUrination
    reset()
  },

})