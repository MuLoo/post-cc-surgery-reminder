const { getDate } = require("../../tools/index.js")

Component({
  data: {
    show: false,
    typeDefaultIndex: 0,
    typeColumns: ['间导', '自主'],
    timeColumns: Array.from({ length: 24 }, (v, i) => `${i + 1} 点`),
    numberColumns: Array.from({ length: 20 }, (v, i) => `${(i + 1) * 50} ml`),
    // 24小时制，计算最近的整数点是什么
    timeDefaultIndex: Math.max(0, new Date().getHours() - 1),
    numDefaultIndex: 3,
    time: new Date().getHours(),
    num: 200,
    type: 0 // 0 间导 1 自主
  },
  methods: {
    recordUrination() {
      console.log('hhh')
      this.setData({
        show: true
      })
    },
    save() {
      console.log('时间和量', this.data.time, this.data.num, this.data.type)
      // this.triggerEvent('onComplete', { time: Number(this.data.time), num: Number(this.data.num), type: this.data.type })
      getApp().getOpenId().then(async openid => {
        const db = await getApp().database()
        db.collection(getApp().globalData.collection_urination_daily).where({
          _openid: openid,
          date: getDate()
        }).get().then(res => {
          const { data } = res
          if (!data.length) {
            // 新建
            db.collection(getApp().globalData.collection_urination_daily).add({
              data: {
                userId: openid,
                date: getDate(),
                records: [{
                  time: this.data.time,
                  num: this.data.num,
                  type: this.data.type
                }]
              }
            }).then(() => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
              this.setData({
                show: false
              })
              // 触发父组件的更新
               this.triggerEvent('update')
            }).catch(err => {
              console.log(err)
              wx.showToast({
                title: '保存失败，请稍后重试',
                icon: 'error',
                duration: 2000,
              })
            })
          } else {
            // 已经存在
            const target = data[0]
            delete target._openid
            delete target._id
            const records = target.records || []
            records.push({
              time: Number(this.data.time),
              num: Number(this.data.num),
              type: this.data.type
            })
            db.collection(getApp().globalData.collection_urination_daily).where({
              userId: openid,
              date: getDate()
            }).update({
              data: {
                ...target,
                records
              }
            }).then(() => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
              this.setData({
                show: false
              })
              // // 触发父组件的更新
              this.triggerEvent('update')
            }).catch(err => {
              console.log(err)
              wx.showToast({
                title: '保存失败，请稍后重试',
                icon: 'error',
                duration: 2000,
              })
            })
          }
        })
      })

    },
    onClose() {
      this.setData({
        show: false
      })
    },
    onChangeTime(event) {
      this.setData({
        time: event.detail.value.replace(' 点', '')
      })
    },
    onChangeNum(event) {
      this.setData({
        num: event.detail.value.replace(' ml', '')
      })
    },
    onChangeType(event) {
      this.setData({
        type: event.detail.value === '间导' ? 0 : 1
      })
    }
  }
})