const initData = {
  readonly: false, // 只读，无法编辑、修改
  editMode: true, // 是新建还是编辑已有
  urinationDialogShow: false,
  title: '',
  desc: '',
  // buyItemsDesc: '',
  memo: '',
  buyItems: ['catheter', 'tissue', 'mirror'],
  star: false,
  statusOptions: ['未完成', '已完成'],
  intervalsReminderOptions: ['每天', '工作日', '自定义'],
  customDaily: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  selectdDaily: ['星期一', '星期二', '星期三', '星期四', '星期五'],
  status: 0,
  intervalsIndex: 0,
  record: Array.from({ length: 24 }, (v, i) => ({
    value: i + 1,
    checked: false
  })),
  urinationInput: {
    time: '',
    num: '',
    date: ''
  }
}

Page({
  getChildComponent: function () {
    const childData = this.selectComponent('.urinationDetail');
    return childData;
  },
  data: {
    ...initData
  },
  async onLoad(options) {
    const childData = this.getChildComponent()
    // 根据上一页传来的 _id 值更新表单数据
    if (options.id !== undefined) {
      this.setData({
        _id: options.id,
        readonly: options.readonly === 'true'
      })
      const db = await getApp().database()
      // 根据待办 _id 加载信息
      db.collection(getApp().globalData.collection).where({
        _id: this.data._id
      }).get().then(res => {
        // 解包获得 todo 对象
        const {
          data: [urination]
        } = res
        // // 循环拼接展示的文件列表名，文件名过长时截断
        // let fileName = ''
        // const record = todo.record;
        // for (let file of todo.files) {
        //   fileName += file.name.substr(0, 10) + (file.name.length > 10 ? "..." : "") + " "
        // }
        // // 如果整体文件名字符串过长则整体截断
        // fileName = fileName.substr(0, 20) + (fileName.length > 20 ? "..." : "")
        childData.setDetailData({
          ...initData,
          _id: this.data._id,
          title: urination.title,
          desc: urination.desc,
          // buyItemsDesc: urination.buyItemsDesc,
          buyItems: urination.buyItems || [],
          memo: urination.memo,
          status: urination.status,
          record: urination.record,
          intervalsIndex: urination.frequency === 'everyday' ? 0 : urination.frequency === 'workday' ? 1 : 2,
          selectdDaily: urination.frequency !== 'everyday' && urination.frequency !== 'workday' ? urination.frequency.split(',') : [],
          editMode: true,
          readonly: options.readonly === 'true',
          star: urination.star || false,
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
      delta: 1,
    })
  },

  cancelEdit() {
    wx.navigateBack({
      delta: 0,
    })
  },
  // saveTodo
  // 保存待办信息
  async saveTodo() {
    if (this.data.readonly) return wx.showToast({
      title: '只读模式无法编辑',
      icon: 'none',
      duration: 2000
    })
    const data = this.getChildComponent().data
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

    // 这里需要分成两部分来存，首先是记录计划表，这是对每天来说都可能是一样的
    // 其次是更新每天实际的导尿信息，这个是每天都会变化的
    // 在页面上为了方便用户使用和理解，在同一个表格中，数据库实际需要存在两张表里
    // const dailyRecords = data.record.map((item, index) => {
    //   const temp = item.actualDrink;
    //   delete item.actualDrink;
    //   if (temp) {
    //     return {
    //       time: item.value,
    //       num: Number(temp)
    //     }
    //   }
    // }).filter(item => !!item);

    // 校验通过后，根据待办 _id，更新计划
    data.updated_at = new Date().getTime()

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